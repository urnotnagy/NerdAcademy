// Module for handling Lesson related pages and actions

import { fetchData, getLessonById, updateLesson, deleteLesson } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import * as Cache from '../state/cache.js';
import { loadInstructorDashboard } from './instructorDashboard.js';
import { loadCourseDetailPage } from './courses.js'; // Import for back button
import { getCurrentUser } from '../auth/auth.js';

let currentCourseLessons = []; // To store lessons for navigation

/**
 * Helper function to embed video based on URL.
 * @param {string} videoUrl - The URL of the video.
 * @returns {string} HTML string for the embedded video.
 */
function embedVideo(videoUrl) {
    if (!videoUrl) return '';

    let embedHtml = '';
    try {
        const url = new URL(videoUrl);
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
            if (videoId) {
                embedHtml = `<div class="video-responsive"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        } else if (url.hostname.includes('vimeo.com')) {
            const videoId = url.pathname.split('/').pop();
            if (videoId) {
                embedHtml = `<div class="video-responsive"><iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        } else if (videoUrl.endsWith('.mp4')) {
            embedHtml = `<div class="video-responsive"><video controls src="${videoUrl}" style="width:100%;"></video></div>`;
        }
    } catch (e) {
        console.error("Error parsing video URL:", e);
        // Fallback to a simple link if parsing/embedding fails
        return `<p>Video: <a href="${videoUrl}" target="_blank">${videoUrl}</a> (Unable to embed)</p>`;
    }
    
    return embedHtml || `<p>Video: <a href="${videoUrl}" target="_blank">${videoUrl}</a> (Unsupported video platform for direct embedding)</p>`;
}


/**
 * Loads the form for adding a new lesson to a specific course.
 * @param {string} courseId - The ID of the course to add a lesson to.
 */
export async function loadAddLessonForm(courseId) {
    const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;
    renderContent(`
        <h2>Add New Lesson to "${courseTitle}"</h2>
        <div id="add-lesson-form-container">
            <p>Loading lesson data...</p>
        </div>
        <div id="add-lesson-message" class="message-area"></div>
        <button id="back-to-dashboard">Back to Dashboard</button>
    `);
    document.getElementById('back-to-dashboard').addEventListener('click', loadInstructorDashboard);

    try {
        const existingLessons = await fetchData(`/courses/${courseId}/lessons`);
        let nextLessonNumber = 1;
        if (existingLessons && existingLessons.length > 0) {
            const maxOrder = existingLessons.reduce((max, lesson) => Math.max(max, lesson.order || 0), 0);
            nextLessonNumber = maxOrder + 1;
        }

        const formContainer = document.getElementById('add-lesson-form-container');
        formContainer.innerHTML = `
            <form id="add-lesson-form">
                 {/* Fields based on LessonCreateDto */}
                 <div><label for="lesson-title">Lesson Title:</label><input type="text" id="lesson-title" name="title" required></div>
                 <div><label for="lesson-content">Content:</label><textarea id="lesson-content" name="content"></textarea></div>
                 <div><label for="lesson-duration">Duration (Minutes):</label><input type="number" id="lesson-duration" name="durationInMinutes" required></div>
                 <div><label for="lesson-number">Lesson Number:</label><input type="number" id="lesson-number" name="lessonNumber" value="${nextLessonNumber}" readonly></div>
                 <div><label for="lesson-videoUrl">Video URL (Optional):</label><input type="url" id="lesson-videoUrl" name="videoUrl"></div>
                 
                 <button type="submit">Add Lesson</button>
            </form>
        `;
        
        const form = document.getElementById('add-lesson-form');
        if (form) {
            form.addEventListener('submit', (event) => handleAddLesson(event, courseId));
        }

    } catch (error) {
        console.error("Error loading existing lessons or setting up form:", error);
        const formContainer = document.getElementById('add-lesson-form-container');
        if(formContainer) {
            formContainer.innerHTML = `<p class="error">Could not load lesson creation form: ${error.message}</p>`;
        }
        const messageDiv = document.getElementById('add-lesson-message');
        if (messageDiv) {
            messageDiv.textContent = `Error preparing form: ${error.message}`;
            messageDiv.className = 'message-area error-message';
        }
    }
}

/**
 * Handles the submission of the add lesson form.
 * @param {Event} event
 * @param {string} courseId The ID of the course to add the lesson to.
 */
async function handleAddLesson(event, courseId) {
    event.preventDefault();
    const form = event.target;
    const messageDiv = document.getElementById('add-lesson-message');
    messageDiv.textContent = 'Adding lesson...';
    messageDiv.className = 'message-area info-message';

    // Construct LessonCreateDto payload
    const lessonData = {
        title: form.title.value,
        content: form.content.value,
        durationInMinutes: parseInt(form.durationInMinutes.value, 10),
        lessonNumber: parseInt(form.lessonNumber.value, 10), // Changed from order
        videoUrl: form.videoUrl.value || null // Handle optional field
    };

    // Basic client-side validation
    if (isNaN(lessonData.durationInMinutes) || isNaN(lessonData.lessonNumber)) {
         messageDiv.textContent = 'Please ensure Duration and Lesson Number are valid numbers.';
         messageDiv.className = 'message-area error-message';
         return;
    }
    if (!lessonData.title) {
         messageDiv.textContent = 'Lesson Title is required.';
         messageDiv.className = 'message-area error-message';
         return;
    }

    // Client-side validation for lessonNumber uniqueness (if manual input were allowed)
    // Since it's readonly and auto-generated, this specific check might be redundant here
    // but good to keep in mind if the "readonly" requirement changes.
    // For now, we trust the auto-generation logic.

    console.log(`Submitting new lesson for course ${courseId}:`, lessonData);

    try {
        // Send POST request to /api/courses/{courseId}/lessons
        // Assuming backend DTO expects 'lessonNumber' or 'order'.
        // If backend strictly expects 'order', we might need to map 'lessonNumber' back to 'order' here.
        // For now, sending as 'lessonNumber' as per task context.
        const payload = {
            ...lessonData,
            order: lessonData.lessonNumber // If backend expects 'order'
        };
        // delete payload.lessonNumber; // Clean up if sending 'order'

        // If backend DTO was updated to accept 'lessonNumber' directly:
        // const payload = lessonData;

        // Backend DTO LessonCreateDto expects "Order", not "lessonNumber"
        const payloadForBackend = {
            title: lessonData.title,
            content: lessonData.content,
            durationInMinutes: lessonData.durationInMinutes,
            order: lessonData.lessonNumber, // Map lessonNumber to order
            videoUrl: lessonData.videoUrl
        };

        const createdLesson = await fetchData(`/courses/${courseId}/lessons`, {
            method: 'POST',
            body: JSON.stringify(payloadForBackend) // Send the correctly mapped payload
        });

        if (createdLesson && createdLesson.id) {
             messageDiv.textContent = 'Lesson added successfully!';
             messageDiv.className = 'message-area success-message';
             form.reset(); // Clear the form
             // Reload the form to get the next lesson number correctly for the next entry
             loadAddLessonForm(courseId);
        } else {
            throw new Error("Lesson creation failed. No valid lesson data returned.");
        }
    } catch (error) {
        messageDiv.textContent = `Error adding lesson: ${error.message}`;
        messageDiv.className = 'message-area error-message';
        console.error("Lesson creation error:", error);
    }
}

/**
 * Renders the view for an individual lesson.
 * @param {string} courseId - The ID of the current course.
 * @param {Array} lessons - The array of all lessons for the course.
 * @param {number} currentIndex - The index of the current lesson to display.
 */
async function renderIndividualLessonView(courseId, lessons, currentIndex) {
    const lessonSummary = lessons[currentIndex];
    if (!lessonSummary) {
        renderContent('<p class="error">Lesson not found.</p><button id="back-to-lessons-list">Back to Lessons</button>');
        document.getElementById('back-to-lessons-list').addEventListener('click', () => loadCourseLessonsPage(courseId));
        return;
    }

    renderContent(`<p>Loading lesson: ${lessonSummary.title}...</p>`);

    try {
        // Fetch full lesson details
        const lessonDetail = await fetchData(`/Lessons/${lessonSummary.id}`);
        if (!lessonDetail) {
            throw new Error(`Could not fetch details for lesson ID ${lessonSummary.id}`);
        }

        const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;
        // Edit button removed from here, will be in the list view.

        let lessonHtml = `
            <div class="lesson-view-container">
                <div class="lesson-actions-top">
                    <button id="back-to-lessons-list">Back to Lessons List (${courseTitle})</button>
                </div>
                <h2>${lessonDetail.title} (Lesson ${lessonDetail.lessonNumber || lessonDetail.order})</h2>
                <div class="lesson-content-area">
                    ${lessonDetail.content || '<p>No textual content for this lesson.</p>'}
                </div>
                <div class="lesson-video-area">
                    ${embedVideo(lessonDetail.videoUrl)}
                </div>
                <div class="lesson-navigation">
                    <button id="prev-lesson-btn" ${currentIndex === 0 ? 'disabled' : ''}>< Previous Lesson</button>
                    <span>Lesson ${currentIndex + 1} of ${lessons.length}</span>
                    <button id="next-lesson-btn" ${currentIndex === lessons.length - 1 ? 'disabled' : ''}>Next Lesson ></button>
                </div>
            </div>
        `;
        renderContent(lessonHtml);

        document.getElementById('back-to-lessons-list').addEventListener('click', () => loadCourseLessonsPage(courseId));
        
        // Edit button event listener removed from here

        const prevButton = document.getElementById('prev-lesson-btn');
        if (prevButton && currentIndex > 0) {
            prevButton.addEventListener('click', () => renderIndividualLessonView(courseId, lessons, currentIndex - 1));
        }

        const nextButton = document.getElementById('next-lesson-btn');
        if (nextButton && currentIndex < lessons.length - 1) {
            nextButton.addEventListener('click', () => renderIndividualLessonView(courseId, lessons, currentIndex + 1));
        }

    } catch (error) {
        renderContent(`<p class="error">Error loading lesson details: ${error.message}</p><button id="back-to-lessons-list-error">Back to Lessons</button>`);
        const backButtonError = document.getElementById('back-to-lessons-list-error');
        if (backButtonError) {
            backButtonError.addEventListener('click', () => loadCourseLessonsPage(courseId));
        }
    }
}


/**
 * Loads and displays the list of lessons for a specific course.
 * Each lesson is clickable to view its individual content.
 * @param {string} courseId - The ID of the course whose lessons to display.
 */
export async function loadCourseLessonsPage(courseId) {
    renderContent(`<p>Loading lessons for course ID: ${courseId}...</p>`);
    
    const courseDetails = Cache.coursesDetailCache[courseId];
    const courseTitle = courseDetails?.title || `Course ID ${courseId}`;
    const currentUser = getCurrentUser();
    const isInstructorOfCourse = currentUser && currentUser.role === 'Instructor' && courseDetails && courseDetails.instructorId === currentUser.id;
    
    try {
        const lessons = await fetchData(`/courses/${courseId}/lessons`);
        currentCourseLessons = lessons && Array.isArray(lessons) ? lessons.sort((a, b) => (a.lessonNumber || a.order) - (b.lessonNumber || b.order)) : [];

        let lessonsHtml = `
            <button id="back-to-course-detail">Back to Course Details (${courseTitle})</button>
            <h2>Lessons for "${courseTitle}"</h2>
        `;

        if (currentCourseLessons.length > 0) {
            lessonsHtml += '<div class="lesson-list">'; // Changed ul to div, will style for vertical cards
            currentCourseLessons.forEach((lesson, index) => {
                let actionButtonsHtml = '';
                if (isInstructorOfCourse) {
                    actionButtonsHtml = `
                        <div class="lesson-card-actions">
                            <button class="action-button edit-lesson-list-btn" data-lesson-id="${lesson.id}" data-course-id="${courseId}">Edit</button>
                            <button class="action-button delete-lesson-list-btn" data-lesson-id="${lesson.id}" data-course-id="${courseId}" data-lesson-title="${lesson.title}">Delete</button>
                        </div>
                    `;
                }
                // Each lesson is now a div with class 'lesson-card'
                lessonsHtml += `
                    <div class="lesson-card">
                        <div class="lesson-card-main-content" data-lesson-index="${index}" data-course-id="${courseId}">
                             <h3>${lesson.lessonNumber || lesson.order}. ${lesson.title}</h3>
                             <p class="lesson-card-description"><em>Click to view details</em></p>
                        </div>
                        ${actionButtonsHtml}
                    </div>
                `;
            });
            lessonsHtml += '</div>';
        } else {
            lessonsHtml += '<p>No lessons found for this course.</p>';
        }

        renderContent(lessonsHtml);

        document.getElementById('back-to-course-detail').addEventListener('click', () => loadCourseDetailPage(courseId));
        
        // Event listener for viewing lesson details
        document.querySelectorAll('.lesson-card-main-content').forEach(item => {
            item.addEventListener('click', (event) => {
                const targetDiv = event.currentTarget;
                const lessonIndex = parseInt(targetDiv.dataset.lessonIndex, 10);
                const cId = targetDiv.dataset.courseId;
                if (!isNaN(lessonIndex) && cId) {
                    renderIndividualLessonView(cId, currentCourseLessons, lessonIndex);
                } else {
                    console.error("Could not get lesson index or course ID from clicked item", targetDiv.dataset);
                    renderContent("<p class='error'>Sorry, there was an error loading this lesson.</p>");
                }
            });
        });

        // Event listeners for edit buttons in the list
        document.querySelectorAll('.edit-lesson-list-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const lessonId = event.target.dataset.lessonId;
                const cId = event.target.dataset.courseId;
                loadEditLessonForm(cId, lessonId);
                event.stopPropagation(); // Prevent triggering lesson view
            });
        });

        // Event listeners for delete buttons in the list
        document.querySelectorAll('.delete-lesson-list-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const lessonId = event.target.dataset.lessonId;
                const cId = event.target.dataset.courseId;
                const lessonTitle = event.target.dataset.lessonTitle;
                handleDeleteLesson(cId, lessonId, lessonTitle);
                event.stopPropagation(); // Prevent triggering lesson view
            });
        });

    } catch (error) {
        renderContent(`<p class="error">Error loading lessons list: ${error.message}</p><button id="back-to-course-detail-error">Back to Course Details</button>`);
        const backButtonError = document.getElementById('back-to-course-detail-error');
         if (backButtonError) {
            backButtonError.addEventListener('click', () => loadCourseDetailPage(courseId));
        }
    }
}

/**
 * Loads the form for editing an existing lesson.
 * @param {string} courseId - The ID of the course the lesson belongs to.
 * @param {string} lessonId - The ID of the lesson to edit.
 */
export async function loadEditLessonForm(courseId, lessonId) {
    renderContent(`<p>Loading lesson data for editing (ID: ${lessonId})...</p>`);

    try {
        const lessonData = await getLessonById(lessonId);
        if (!lessonData || !lessonData.id) {
            throw new Error("Lesson not found or could not be fetched.");
        }

        const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;

        const formHtml = `
            <h2>Edit Lesson: ${lessonData.title} (for Course: ${courseTitle})</h2>
            <form id="edit-lesson-form">
                <input type="hidden" id="lesson-id" name="lessonId" value="${lessonData.id}">
                <input type="hidden" id="course-id" name="courseId" value="${courseId}">
                <div>
                    <label for="edit-lesson-title">Title:</label>
                    <input type="text" id="edit-lesson-title" name="title" value="${lessonData.title || ''}" required>
                </div>
                <div>
                    <label for="edit-lesson-content">Content:</label>
                    <textarea id="edit-lesson-content" name="content">${lessonData.content || ''}</textarea>
                </div>
                <div>
                    <label for="edit-lesson-videoUrl">Video URL (Optional):</label>
                    <input type="url" id="edit-lesson-videoUrl" name="videoUrl" value="${lessonData.videoUrl || ''}">
                </div>
                <div>
                    <label for="edit-lesson-duration">Duration (Minutes):</label>
                    <input type="number" id="edit-lesson-duration" name="durationInMinutes" value="${lessonData.durationInMinutes || 0}" required>
                </div>
                <div>
                    <label for="edit-lesson-number">Lesson Number:</label>
                    <input type="number" id="edit-lesson-number" name="lessonNumber" value="${lessonData.lessonNumber || lessonData.order || 1}" readonly>
                </div>
                <button type="submit">Update Lesson</button>
            </form>
            <div id="edit-lesson-message" class="message-area"></div>
            <button id="back-to-lesson-view" class="action-button">Back to Lesson</button>
            <button id="back-to-lessons-list-from-edit" class="action-button">Back to Lessons List</button>
        `;
        renderContent(formHtml);

        // Re-fetch the lesson to pass to renderIndividualLessonView for "Back to Lesson"
        // This is a bit inefficient but ensures we have the correct index if the list isn't readily available
        // A better approach might involve passing the lesson index or the full lesson object.
        // For now, we'll find the lesson in currentCourseLessons if available.
        let currentLessonIndex = -1;
        if (currentCourseLessons && currentCourseLessons.length > 0) {
            currentLessonIndex = currentCourseLessons.findIndex(l => l.id === lessonId);
        }


        document.getElementById('back-to-lesson-view').addEventListener('click', () => {
            if (currentLessonIndex !== -1) {
                renderIndividualLessonView(courseId, currentCourseLessons, currentLessonIndex);
            } else {
                // Fallback if index not found, just reload the lesson list
                loadCourseLessonsPage(courseId);
            }
        });
        document.getElementById('back-to-lessons-list-from-edit').addEventListener('click', () => loadCourseLessonsPage(courseId));

        const form = document.getElementById('edit-lesson-form');
        if (form) {
            form.addEventListener('submit', handleEditLesson);
        }

    } catch (error) {
        renderContent(`<p class="error">Error loading lesson for editing: ${error.message}</p><button id="back-to-lessons-list-error-edit">Back to Lessons List</button>`);
        const backBtn = document.getElementById('back-to-lessons-list-error-edit');
        if (backBtn) {
            backBtn.addEventListener('click', () => loadCourseLessonsPage(courseId));
        }
    }
}

/**
 * Handles the submission of the edit lesson form.
 * @param {Event} event
 */
async function handleEditLesson(event) {
    event.preventDefault();
    const form = event.target;
    const messageDiv = document.getElementById('edit-lesson-message');
    messageDiv.textContent = 'Updating lesson...';
    messageDiv.className = 'message-area info-message';

    const lessonId = form.lessonId.value;
    const courseId = form.courseId.value; // Keep courseId for navigation

    // Construct LessonUpdateDto payload
    // Assuming LessonUpdateDto expects: title, content, videoUrl, durationInMinutes
    // lessonNumber (order) is not typically editable in this flow, or handled separately.
    const lessonUpdateData = {
        title: form.title.value,
        content: form.content.value,
        videoUrl: form.videoUrl.value || null,
        durationInMinutes: parseInt(form.durationInMinutes.value, 10),
        // Include 'order' if the backend DTO requires it, using the readonly lessonNumber value
        order: parseInt(form.lessonNumber.value, 10)
    };

    // Basic client-side validation
    if (!lessonUpdateData.title) {
        messageDiv.textContent = 'Lesson Title is required.';
        messageDiv.className = 'message-area error-message';
        return;
    }
    if (isNaN(lessonUpdateData.durationInMinutes)) {
        messageDiv.textContent = 'Please ensure Duration is a valid number.';
        messageDiv.className = 'message-area error-message';
        return;
    }
     if (isNaN(lessonUpdateData.order)) {
        messageDiv.textContent = 'Lesson Number (Order) must be a valid number.';
        messageDiv.className = 'message-area error-message';
        return;
    }


    console.log(`Submitting lesson update for ID ${lessonId}:`, lessonUpdateData);

    try {
        await updateLesson(lessonId, lessonUpdateData); // updateLesson from apiService

        messageDiv.textContent = 'Lesson updated successfully!';
        messageDiv.className = 'message-area success-message';

        // Refresh the lesson view or list
        // For simplicity, let's reload the individual lesson view after a short delay
        // We need to find the lesson's index in currentCourseLessons
        let updatedLessonIndex = -1;
        if (currentCourseLessons && currentCourseLessons.length > 0) {
            updatedLessonIndex = currentCourseLessons.findIndex(l => l.id === lessonId);
            if (updatedLessonIndex !== -1) {
                // Optimistically update the lesson in the local list before re-rendering
                currentCourseLessons[updatedLessonIndex] = {
                    ...currentCourseLessons[updatedLessonIndex],
                    title: lessonUpdateData.title,
                    // Note: other fields like content, videoUrl are not in the summary list
                    // but title and order/lessonNumber are.
                    order: lessonUpdateData.order,
                    lessonNumber: lessonUpdateData.order
                };
            }
        }
        
        // Fetch the updated lesson details to ensure the view is current
        const updatedLessonDetail = await getLessonById(lessonId);
        // Update the specific lesson in the cache if it exists
        // This is a simplified cache update; a more robust system might be needed.
        if (currentCourseLessons && updatedLessonIndex !== -1) {
             // Update the summary in currentCourseLessons
            currentCourseLessons[updatedLessonIndex] = {
                ...currentCourseLessons[updatedLessonIndex], // Keep existing summary fields
                id: updatedLessonDetail.id,
                title: updatedLessonDetail.title,
                order: updatedLessonDetail.order,
                lessonNumber: updatedLessonDetail.lessonNumber,
                // Potentially other summary fields if they exist in LessonDto
            };
        }


        setTimeout(() => {
            if (updatedLessonIndex !== -1) {
                renderIndividualLessonView(courseId, currentCourseLessons, updatedLessonIndex);
            } else {
                // Fallback if index not found (e.g., if currentCourseLessons was empty or lesson not in it)
                // This could happen if navigating directly to edit form without viewing list first.
                // In such a case, just go back to the lessons list for the course.
                loadCourseLessonsPage(courseId);
            }
        }, 1500);

    } catch (error) {
        messageDiv.textContent = `Error updating lesson: ${error.message}`;
        messageDiv.className = 'message-area error-message';
        console.error("Lesson update error:", error);
    }
}

/**
 * Handles the deletion of a lesson.
 * @param {string} courseId - The ID of the course the lesson belongs to.
 * @param {string} lessonId - The ID of the lesson to delete.
 * @param {string} lessonTitle - The title of the lesson for confirmation message.
 */
async function handleDeleteLesson(courseId, lessonId, lessonTitle) {
    if (!confirm(`Are you sure you want to delete the lesson "${lessonTitle || 'this lesson'}"? This action cannot be undone.`)) {
        return;
    }

    try {
        await deleteLesson(lessonId); // Call deleteLesson from apiService
        alert(`Lesson "${lessonTitle || 'Lesson'}" deleted successfully.`);
        
        // Refresh the lessons list for the current course
        loadCourseLessonsPage(courseId);
        
        // Optionally, update currentCourseLessons cache if it's critical,
        // but reloading the list is often simpler and ensures consistency.
        // currentCourseLessons = currentCourseLessons.filter(lesson => lesson.id !== lessonId);

    } catch (error) {
        console.error(`Error deleting lesson ${lessonId}:`, error);
        alert(`Error deleting lesson: ${error.message}`);
    }
}