// Module for handling enrollment actions

import { fetchData } from '../api/apiService.js';
import * as Cache from '../state/cache.js'; // Need cache for updates
import { getCurrentUser } from '../auth/auth.js'; // Need user info

/**
 * Handles the enrollment request when the enroll button is clicked.
 * @param {string} courseId - The ID of the course to enroll in.
 * @param {HTMLElement} messageDiv - The DOM element to display feedback messages.
 */
export async function handleEnrollment(courseId, messageDiv) { 
    const enrollButton = document.getElementById('enroll-button'); // Assumes button ID is consistent
    const currentUserData = getCurrentUser();

    if (messageDiv) {
        messageDiv.textContent = ''; // Clear previous messages
        messageDiv.className = 'message-area'; // Reset class
    }

    if (!currentUserData || !currentUserData.id) {
        if (messageDiv) {
            messageDiv.textContent = 'You must be logged in to enroll.';
            messageDiv.className = 'message-area error-message';
        } 
        // Optionally redirect to login here if needed
        return;
    }

    if (currentUserData.role !== 'Student') {
        if (messageDiv) {
            messageDiv.textContent = 'Only students can enroll in courses.';
            messageDiv.className = 'message-area error-message';
        } else {
             alert('Only students can enroll in courses.'); // Fallback alert
        }
        return;
    }
    
    // Client-side check against cache before hitting API
    if (Cache.studentEnrollmentsCache && Cache.studentEnrollmentsCache.some(e => e.courseId === courseId)) {
        if (messageDiv) {
            messageDiv.textContent = 'You are already enrolled in this course.';
            messageDiv.className = 'message-area info-message'; 
        }
        // Ensure button state is correct even if somehow clicked again
        if (enrollButton) {
            enrollButton.textContent = 'Already Enrolled';
            enrollButton.disabled = true;
            enrollButton.classList.add('disabled-button');
        }
        return;
    }

    const studentId = currentUserData.id;

    if (enrollButton) {
        enrollButton.disabled = true;
        enrollButton.textContent = 'Enrolling...';
    }
    if (messageDiv) {
         messageDiv.textContent = 'Enrolling...';
         messageDiv.className = 'message-area info-message';
    }


    try {
        const enrollmentData = { studentId, courseId };
        const response = await fetchData('/Enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrollmentData)
        });

        if (response && response.id) { 
            if (enrollButton) {
                enrollButton.textContent = 'Enrolled!';
                enrollButton.disabled = true; 
                enrollButton.classList.add('disabled-button');
            }
            if (messageDiv) {
                messageDiv.textContent = 'Successfully enrolled in the course!';
                messageDiv.className = 'message-area success-message'; 
            }
            // Add to local cache
            const currentCache = Cache.studentEnrollmentsCache || [];
            Cache.setStudentEnrollmentsCache([...currentCache, response]);
            
        } else {
            // Handle potential non-error responses that aren't successful enrollments
            const errorMsg = response?.detail || response?.title || 'Enrollment failed. You might already be enrolled or an error occurred.';
             if (enrollButton) {
                enrollButton.textContent = 'Enrollment Failed';
                enrollButton.disabled = false; // Re-enable on failure
            }
            if (messageDiv) {
                messageDiv.textContent = errorMsg;
                messageDiv.className = 'message-area error-message';
            }
            console.error("Enrollment error response:", response);
        }
    } catch (error) {
        if (enrollButton) {
            enrollButton.textContent = 'Enrollment Error';
            enrollButton.disabled = false; // Re-enable on error
        }
        console.error('Enrollment process error:', error);
        if (messageDiv) {
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.className = 'message-area error-message';
        }
    }
}