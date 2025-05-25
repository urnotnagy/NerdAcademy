// adminDashboard.js

// Import dependencies
import { getCourses, updateCourse, deleteCourse, getUsers, getEnrollments, deleteEnrollment, getManageableEnrollments, approveEnrollment, rejectEnrollment } from '../api/apiService.js'; // Added getUsers, getEnrollments, deleteEnrollment, and new enrollment functions
import { displayError, createButton } from '../ui/domUtils.js';
import { decodeJwt } from '../auth/jwtUtils.js'; // Assuming this is the correct function from jwtUtils
import { getToken } from '../auth/auth.js'; // For checkAdminRole
import { usersCache, updateUserInCache } from '../state/cache.js'; // Import cache utilities
// Removed: import { navigate } from '../router.js';
// We will use direct window.location.href for navigating from admin.html to index.html SPA routes

// Note: NerdAcademy.Config.jwtKey is used indirectly via getToken -> Config.jwtKey
// If NerdAcademy.Config is needed directly, it should be imported from '../config.js'

// No longer an IIFE assigning to window.NerdAcademy.AdminDashboard directly,
// but we will export an init function.

const coursesTableBody = document.getElementById('courses-table-body');
const loadingMessage = document.getElementById('loading-message');
const noCoursesMessage = document.getElementById('no-courses-message');
const statusFilter = document.getElementById('status-filter');
const searchTermInput = document.getElementById('search-term');
const applyFiltersBtn = document.getElementById('apply-filters-btn');

// Enrollments elements
const enrollmentsTableBody = document.getElementById('enrollments-table-body');
const loadingEnrollmentsMessage = document.getElementById('loading-enrollments-message');
const noEnrollmentsMessage = document.getElementById('no-enrollments-message');

// Pending Enrollments elements - REMOVED as this functionality is moved
// const pendingEnrollmentsTableBody = document.getElementById('pending-enrollments-table-body');
// const loadingPendingEnrollmentsMessage = document.getElementById('loading-pending-enrollments-message');
// const noPendingEnrollmentsMessage = document.getElementById('no-pending-enrollments-message');


let allCourses = []; // To store all fetched courses for client-side filtering
let instructorMap = new Map(); // To store instructor ID to name mapping (also used for student names)
let allEnrollments = []; // To store all fetched enrollments

    // Export the init function so it can be called from admin.html
export async function init() {
    if (!checkAdminRole()) {
        // Use the imported displayError
        displayError('Access Denied: You must be an admin to view this page.', document.querySelector('main.container'));
        // Optionally redirect: window.location.href = 'index.html';
        if(loadingMessage) loadingMessage.style.display = 'none';
        if(loadingEnrollmentsMessage) loadingEnrollmentsMessage.style.display = 'none';
        // if(loadingPendingEnrollmentsMessage) loadingPendingEnrollmentsMessage.style.display = 'none'; // REMOVED
            return;
        }

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', fetchAndDisplayCourses);
        }
        // Initial fetch
        await fetchAndDisplayCourses();
        await fetchAndDisplayEnrollments(); // Fetch existing enrollments
        // await fetchAndDisplayPendingEnrollments(); // REMOVED - No longer fetching pending enrollments here
    }

    function checkAdminRole() {
        // Use the imported getToken which handles Config.jwtKey internally
        const token = getToken();
        if (!token) return false;

        try {
            // Use the imported decodeJwt
            const decodedToken = decodeJwt(token);
            return decodedToken && decodedToken.role === 'Admin';
        } catch (error) {
            console.error('Error decoding token:', error);
            return false;
        }
    }

    async function fetchAndDisplayCourses() {
        if(loadingMessage) loadingMessage.style.display = 'block';
        if(noCoursesMessage) noCoursesMessage.style.display = 'none';
        if(coursesTableBody) coursesTableBody.innerHTML = '';

        try {
            // Populate instructorMap from cache or fetch users
            if (instructorMap.size === 0) {
                if (usersCache && Object.keys(usersCache).length > 0) {
                    console.log("Populating instructorMap from usersCache.");
                    for (const userId in usersCache) {
                        const user = usersCache[userId];
                        const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
                        if (user.id && displayName) {
                            instructorMap.set(user.id, displayName);
                        }
                    }
                } else {
                    console.log("usersCache is empty, fetching users from API.");
                    try {
                        const users = await getUsers();
                        if (users && users.length > 0) {
                            users.forEach(user => {
                                const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                if (user.id && displayName) {
                                    instructorMap.set(user.id, displayName);
                                    updateUserInCache(user); // Update cache
                                }
                            });
                        }
                    } catch (userError) {
                        console.error('Error fetching users for instructor mapping:', userError);
                        displayError('Could not load instructor names. Displaying IDs instead.', document.getElementById('course-management'));
                    }
                }
            }

            // Fetch all courses initially if not already fetched
            if (allCourses.length === 0) {
                // Use imported getCourses
                const courses = await getCourses();
                allCourses = courses || [];
            }
            
            if (allCourses.length === 0) {
                if(noCoursesMessage) noCoursesMessage.style.display = 'block';
                return;
            }
 
            const filteredCourses = filterAndSearchCourses(allCourses);
 
            if (filteredCourses.length === 0) {
                if(noCoursesMessage) noCoursesMessage.style.display = 'block';
            } else {
                renderCourses(filteredCourses); // renderCourses will now use instructorMap
            }
 
        } catch (error) {
            console.error('Error fetching or processing course data:', error);
            // Use imported displayError
            displayError('Failed to load courses. Please try again.', document.getElementById('course-management'));
            if(noCoursesMessage) noCoursesMessage.style.display = 'block';
        } finally {
            if(loadingMessage) loadingMessage.style.display = 'none';
        }
    }

    function filterAndSearchCourses(courses) {
        const selectedStatus = statusFilter ? statusFilter.value : '';
        const searchTerm = searchTermInput ? searchTermInput.value.toLowerCase() : '';

        return courses.filter(course => {
            const matchesStatus = !selectedStatus || course.status === selectedStatus;
            const matchesSearch = !searchTerm || course.title.toLowerCase().includes(searchTerm);
            return matchesStatus && matchesSearch;
        });
    }

    function renderCourses(courses) {
        if(!coursesTableBody) return;
        coursesTableBody.innerHTML = ''; // Clear existing rows

        courses.forEach(course => {
            const row = coursesTableBody.insertRow();
            row.insertCell().textContent = course.title;
            
            // Display instructor name using the map
            const instructorName = instructorMap.get(course.instructorId) || `ID: ${course.instructorId}`; // Fallback to ID
            row.insertCell().textContent = instructorName;
            
            row.insertCell().textContent = `$${course.price.toFixed(2)}`;
            
            let displayStatus = course.status;
            if (course.status === 'Draft') {
                displayStatus = 'Pending Approval (Draft)';
            }
            row.insertCell().textContent = displayStatus;
            row.insertCell().textContent = new Date(course.createdAt).toLocaleDateString();

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions');

            if (course.status === 'Draft') { // "Pending Approval"
                // Use imported createButton
                const approveButton = createButton('Approve', async () => await updateCourseStatusInternal(course.id, 1, 'Published'), 'button-approve');
                actionsCell.appendChild(approveButton);
            }

            if (course.status !== 'Archived') {
                 // Use imported createButton
                 const archiveButton = createButton(course.status === 'Draft' ? 'Reject (Archive)' : 'Archive', async () => await updateCourseStatusInternal(course.id, 2, 'Archived'), 'button-archive');
                 actionsCell.appendChild(archiveButton);
            }

            if (course.status === 'Archived') {
                const republishButton = createButton('Republish', async () => await updateCourseStatusInternal(course.id, 1, 'Published'), 'button-republish'); // Assuming 1 is Published
                actionsCell.appendChild(republishButton);
            }

            // Use imported createButton
            const deleteButton = createButton('Delete', async () => await deleteCourseInternal(course.id), 'button-delete');
            actionsCell.appendChild(deleteButton);

            // Add "View Enrollments" button
            const viewEnrollmentsButton = createButton('Manage Enrollments', () => {
                // Navigate to index.html with the specific hash for the SPA router to handle
                window.location.href = `index.html#/admin/courses/${course.id}/enrollments`;
            }, 'button-view-enrollments'); // Add a class for styling if needed
            actionsCell.appendChild(viewEnrollmentsButton);
        });
    }

    // Renamed to avoid conflict with imported updateCourse
    async function updateCourseStatusInternal(courseId, newStatusValue, newStatusName) {
        if (!confirm(`Are you sure you want to change status to "${newStatusName}" for this course?`)) {
            return;
        }
        try {
            const currentCourse = allCourses.find(c => c.id === courseId);
            if (!currentCourse) {
                alert('Error: Could not find course data to update.');
                console.error(`Course with ID ${courseId} not found in local cache.`);
                return;
            }

            // Map string Level from ReadDTO to int for UpdateDTO
            const levelMap = { "Beginner": 0, "Intermediate": 1, "Advanced": 2 };
            const currentLevelInt = levelMap[currentCourse.level];
            if (currentLevelInt === undefined) {
                alert(`Error: Unknown course level "${currentCourse.level}". Cannot update.`);
                console.error(`Unknown level string: ${currentCourse.level}`);
                return;
            }

            const updatePayload = {
                title: currentCourse.title,
                description: currentCourse.description, // Can be null
                price: currentCourse.price,
                durationInWeeks: currentCourse.durationInWeeks,
                level: currentLevelInt,
                status: newStatusValue, // This is the new integer status value
                tagIds: currentCourse.tagIds || [] // Ensure it's an array
            };

            // Use imported updateCourse with the full payload
            await updateCourse(courseId, updatePayload);
            
            // Update local cache and re-render
            const courseIndex = allCourses.findIndex(c => c.id === courseId);
            if (courseIndex > -1) {
                allCourses[courseIndex].status = newStatusName; // Use the string name for display
            }
            fetchAndDisplayCourses(); // Re-filter and re-render
            alert(`Course status updated to ${newStatusName}.`);
        } catch (error) {
            console.error(`Error updating course ${courseId} status:`, error);
            alert(`Failed to update course status. ${error.message || ''}`);
        }
    }

    // Renamed to avoid conflict with imported deleteCourse
    async function deleteCourseInternal(courseId) {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        try {
            // Use imported deleteCourse
            await deleteCourse(courseId);
            // Remove from local cache and re-render
            allCourses = allCourses.filter(c => c.id !== courseId);
            fetchAndDisplayCourses(); // Re-filter and re-render
            alert('Course deleted successfully.');
        } catch (error) {
            console.error(`Error deleting course ${courseId}:`, error);
            alert(`Failed to delete course. ${error.message || ''}`);
        }
    }

    // --- Enrollment Management Functions ---

    async function fetchAndDisplayEnrollments() {
        if (loadingEnrollmentsMessage) loadingEnrollmentsMessage.style.display = 'block';
        if (noEnrollmentsMessage) noEnrollmentsMessage.style.display = 'none';
        if (enrollmentsTableBody) enrollmentsTableBody.innerHTML = '';

        try {
            // Ensure users (for student names) and courses (for course titles) are loaded
            // Users are loaded via instructorMap population in fetchAndDisplayCourses
            // Courses are loaded into allCourses in fetchAndDisplayCourses
            // If these are not guaranteed to be populated first, add explicit calls or checks here.
            if (instructorMap.size === 0 || allCourses.length === 0) {
                console.log("Waiting for users and courses to be loaded before fetching enrollments...");
                // This assumes fetchAndDisplayCourses is called first and populates these.
                // A more robust solution might involve promises or a loading state manager.
            }

            const enrollments = await getEnrollments();
            allEnrollments = enrollments || [];

            if (allEnrollments.length === 0) {
                if (noEnrollmentsMessage) noEnrollmentsMessage.style.display = 'block';
            } else {
                renderEnrollments(allEnrollments);
            }
        } catch (error) {
            console.error('Error fetching or processing enrollment data:', error);
            displayError('Failed to load enrollments. Please try again.', document.getElementById('enrollment-management'));
            if (noEnrollmentsMessage) noEnrollmentsMessage.style.display = 'block';
        } finally {
            if (loadingEnrollmentsMessage) loadingEnrollmentsMessage.style.display = 'none';
        }
    }

    function renderEnrollments(enrollments) {
        if (!enrollmentsTableBody) return;
        enrollmentsTableBody.innerHTML = ''; // Clear existing rows

        enrollments.forEach(enrollment => {
            const row = enrollmentsTableBody.insertRow();
            row.insertCell().textContent = enrollment.id;

            const studentName = instructorMap.get(enrollment.studentId) || `Student ID: ${enrollment.studentId}`;
            row.insertCell().textContent = studentName;

            const course = allCourses.find(c => c.id === enrollment.courseId);
            const courseTitle = course ? course.title : `Course ID: ${enrollment.courseId}`;
            row.insertCell().textContent = courseTitle;

            row.insertCell().textContent = new Date(enrollment.enrollmentDate).toLocaleDateString();

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions');

            const deleteButton = createButton('Delete', async () => await deleteEnrollmentInternal(enrollment.id), 'button-delete');
            actionsCell.appendChild(deleteButton);
        });
    }

    async function deleteEnrollmentInternal(enrollmentId) {
        if (!confirm(`Are you sure you want to delete enrollment ID ${enrollmentId}? This action cannot be undone.`)) {
            return;
        }
        try {
            await deleteEnrollment(enrollmentId);
            allEnrollments = allEnrollments.filter(e => e.id !== enrollmentId);
            renderEnrollments(allEnrollments); // Re-render enrollments
            alert('Enrollment deleted successfully.');
        } catch (error) {
            console.error(`Error deleting enrollment ${enrollmentId}:`, error);
            alert(`Failed to delete enrollment. ${error.message || ''}`);
        }
    }

    // --- Pending Enrollment Management Functions --- REMOVED ---
    // All functions related to fetchAndDisplayPendingEnrollments, renderPendingEnrollments,
    // handleApproveEnrollment, and handleRejectEnrollment have been removed as this
    // functionality is now handled in frontend/js/pages/adminEnrollments.js

// No longer an IIFE, so no return statement like that.
// The init function is exported.