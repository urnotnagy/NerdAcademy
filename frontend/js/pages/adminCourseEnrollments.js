// frontend/js/pages/adminCourseEnrollments.js
import { getEnrollmentsByCourseId, setEnrollmentStatus, deleteEnrollment, getCourseById } from '../api/apiService.js';
import { showToast, createButton } from '../ui/domUtils.js';
import { usersCache, updateUserInCache, populateUserCache } from '../state/cache.js'; // Assuming populateUserCache fetches all users if cache is empty

let currentCourseId = null;

async function renderCourseEnrollments() {
    const enrollmentsTableBody = document.getElementById('course-enrollments-table-body');
    const loadingMessage = document.getElementById('loading-course-enrollments-message');
    const noEnrollmentsMessage = document.getElementById('no-course-enrollments-message');
    const courseNamePlaceholder = document.getElementById('course-name-placeholder');

    if (!enrollmentsTableBody || !loadingMessage || !noEnrollmentsMessage || !courseNamePlaceholder) {
        console.error('Required DOM elements for course enrollment rendering are missing.');
        return;
    }

    loadingMessage.style.display = 'block';
    noEnrollmentsMessage.style.display = 'none';
    enrollmentsTableBody.innerHTML = ''; // Clear existing rows

    try {
        // Fetch course details to display name
        const courseDetails = await getCourseById(currentCourseId);
        if (courseDetails && courseDetails.title) {
            courseNamePlaceholder.textContent = courseDetails.title;
        } else {
            courseNamePlaceholder.textContent = `ID: ${currentCourseId}`;
        }

        // Ensure user cache is populated for student names
        if (Object.keys(usersCache).length === 0) {
            await populateUserCache(); // This function should fetch users and populate usersCache
        }

        const enrollments = await getEnrollmentsByCourseId(currentCourseId);

        if (enrollments && enrollments.length > 0) {
            enrollments.forEach(enrollment => {
                const row = enrollmentsTableBody.insertRow();
                row.insertCell().textContent = enrollment.id;

                const student = usersCache[enrollment.studentId];
                const studentName = student ? (student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()) : 'N/A';
                const studentEmail = student ? student.email : 'N/A';

                row.insertCell().textContent = studentName;
                row.insertCell().textContent = studentEmail;
                row.insertCell().textContent = new Date(enrollment.enrollmentDate).toLocaleDateString();

                const statusCell = row.insertCell();
                const statusSelect = document.createElement('select');
                statusSelect.id = `status-select-course-${enrollment.id}`;
                statusSelect.classList.add('status-select');
                const statuses = ["Pending", "Approved", "Rejected"]; // Match backend enum/string values
                statuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    if (enrollment.status === status) {
                        option.selected = true;
                    }
                    statusSelect.appendChild(option);
                });
                statusCell.appendChild(statusSelect);

                const actionsCell = row.insertCell();
                actionsCell.classList.add('actions');

                const saveButton = createButton('Save Status', async () => {
                    const newStatus = statusSelect.value;
                    try {
                        await setEnrollmentStatus(enrollment.id, newStatus);
                        showToast(`Enrollment ${enrollment.id} status updated to ${newStatus}.`, 'success');
                        // Optionally, update just this row's status display or re-render all.
                        enrollment.status = newStatus; // Update local data before potential re-render
                    } catch (error) {
                        console.error(`Failed to update status for enrollment ${enrollment.id}:`, error);
                        showToast(`Failed to update status: ${error.message || 'Unknown error'}`, 'error');
                        statusSelect.value = enrollment.status; // Revert dropdown on error
                    }
                }, 'button-approve'); // Reusing class, consider specific if needed
                actionsCell.appendChild(saveButton);

                // Delete button and its logic removed as per request.
            });
            loadingMessage.style.display = 'none';
        } else {
            noEnrollmentsMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    } catch (error) {
        console.error(`Failed to fetch or render enrollments for course ${currentCourseId}:`, error);
        loadingMessage.style.display = 'none';
        noEnrollmentsMessage.textContent = 'Failed to load enrollments. Please try again.';
        noEnrollmentsMessage.style.display = 'block';
        showToast(`Error fetching enrollments: ${error.message || 'Unknown error'}`, 'error');
    }
}

export function init(params) {
    if (document.getElementById('admin-course-enrollments-page')) {
        if (params && params.courseId) {
            currentCourseId = params.courseId;
            console.log(`Admin Course Enrollments Page detected for course ID: ${currentCourseId}. Initializing...`);
            renderCourseEnrollments();

            const backLink = document.getElementById('back-to-admin-dashboard');
            if(backLink) {
                // Ensure the router's navigate function is available or use direct hash change
                // For simplicity, direct hash change if navigate isn't easily available here
                // Or, ideally, import navigate from router.js
                // import { navigate as spaNavigate } from '../router.js';
                // backLink.addEventListener('click', (e) => { e.preventDefault(); spaNavigate('/admin'); });
            }

        } else {
            console.error('Course ID not provided for admin course enrollments page.');
            const courseNamePlaceholder = document.getElementById('course-name-placeholder');
            if(courseNamePlaceholder) courseNamePlaceholder.textContent = "Error: Course ID missing";
            const noEnrollmentsMessage = document.getElementById('no-course-enrollments-message');
            if(noEnrollmentsMessage) {
                noEnrollmentsMessage.textContent = 'Cannot load enrollments: Course ID is missing.';
                noEnrollmentsMessage.style.display = 'block';
            }
            const loadingMessage = document.getElementById('loading-course-enrollments-message');
            if(loadingMessage) loadingMessage.style.display = 'none';
        }
    }
}