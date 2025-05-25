import { getManageableEnrollments, setEnrollmentStatus } from '../api/apiService.js';
import { showToast } from '../ui/domUtils.js'; // Assuming a toast function for feedback

const enrollmentsTableBody = document.getElementById('enrollments-table-body');
const loadingMessage = document.getElementById('loading-enrollments-message');
const noEnrollmentsMessage = document.getElementById('no-enrollments-message');

async function renderEnrollments() {
    if (!enrollmentsTableBody || !loadingMessage || !noEnrollmentsMessage) {
        console.error('Required DOM elements for enrollment rendering are missing.');
        return;
    }

    loadingMessage.style.display = 'block';
    noEnrollmentsMessage.style.display = 'none';
    enrollmentsTableBody.innerHTML = ''; // Clear existing rows

    try {
        const enrollments = await getManageableEnrollments();
        if (enrollments && enrollments.length > 0) {
            enrollments.forEach(enrollment => {
                const row = enrollmentsTableBody.insertRow();
                row.insertCell().textContent = enrollment.id;
                row.insertCell().textContent = enrollment.course?.title || 'N/A'; // Assuming course object with title
                row.insertCell().textContent = enrollment.student?.userName || 'N/A'; // Assuming student object with name
                row.insertCell().textContent = new Date(enrollment.enrollmentDate).toLocaleDateString();
                
                const statusCell = row.insertCell();
                const statusSelect = document.createElement('select');
                statusSelect.id = `status-select-${enrollment.id}`;
                statusSelect.classList.add('status-select'); // For styling if needed
                const statuses = ["Pending", "Approved", "Rejected"];
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
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save Change';
                saveButton.classList.add('action-button', 'save-status-button');
                saveButton.dataset.enrollmentId = enrollment.id;
                saveButton.addEventListener('click', async () => {
                    const newStatus = statusSelect.value;
                    try {
                        await setEnrollmentStatus(enrollment.id, newStatus);
                        showToast(`Enrollment ${enrollment.id} status updated to ${newStatus}.`, 'success');
                        // Optionally, re-render or update just this row. For simplicity, re-rendering all.
                        renderEnrollments(); 
                    } catch (error) {
                        console.error(`Failed to update status for enrollment ${enrollment.id}:`, error);
                        showToast(`Failed to update status: ${error.message || 'Unknown error'}`, 'error');
                    }
                });
                actionsCell.appendChild(saveButton);
            });
            loadingMessage.style.display = 'none';
        } else {
            noEnrollmentsMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to fetch or render enrollments:', error);
        loadingMessage.style.display = 'none';
        noEnrollmentsMessage.textContent = 'Failed to load enrollments. Please try again.';
        noEnrollmentsMessage.style.display = 'block';
        showToast(`Error fetching enrollments: ${error.message || 'Unknown error'}`, 'error');
    }
}

export function init() {
    if (document.getElementById('admin-enrollments-page')) {
        console.log('Admin Enrollments Page detected. Initializing...');
        renderEnrollments();
    } else {
        // console.log('Not on admin enrollments page, adminEnrollments.js doing nothing.');
    }
}

// Ensure init is called if this script is loaded directly or for non-module contexts (though it's a module here)
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', init);
// } else {
//     init(); // Or call when appropriate for your SPA structure
// }