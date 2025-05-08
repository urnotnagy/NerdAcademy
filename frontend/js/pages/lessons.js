// Module for handling Lesson related pages and actions

import { fetchData } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import * as Cache from '../state/cache.js';
import { loadInstructorDashboard } from './instructorDashboard.js';
import { loadCourseDetailPage } from './courses.js'; // Import for back button

/**
 * Loads the form for adding a new lesson to a specific course.
 * @param {string} courseId - The ID of the course to add a lesson to.
 */
export async function loadAddLessonForm(courseId) {
    // Optionally fetch course details to display course title, using cache
    const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;

    renderContent(`
        <h2>Add New Lesson to "${courseTitle}"</h2>
        <form id="add-lesson-form">
             {/* Fields based on LessonCreateDto */}
             <div><label for="lesson-title">Lesson Title:</label><input type="text" id="lesson-title" name="title" required></div>
             <div><label for="lesson-content">Content:</label><textarea id="lesson-content" name="content"></textarea></div>
             <div><label for="lesson-duration">Duration (Minutes):</label><input type="number" id="lesson-duration" name="durationInMinutes" required></div>
             <div><label for="lesson-order">Order:</label><input type="number" id="lesson-order" name="order" required></div>
             <div><label for="lesson-videoUrl">Video URL (Optional):</label><input type="url" id="lesson-videoUrl" name="videoUrl"></div>
             
             <button type="submit">Add Lesson</button>
        </form>
        <div id="add-lesson-message" class="message-area"></div>
        <button id="back-to-dashboard">Back to Dashboard</button>
    `);

    document.getElementById('back-to-dashboard').addEventListener('click', loadInstructorDashboard);
    
    const form = document.getElementById('add-lesson-form');
    if (form) {
        form.addEventListener('submit', (event) => handleAddLesson(event, courseId)); 
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
        order: parseInt(form.order.value, 10),
        videoUrl: form.videoUrl.value || null // Handle optional field
    };

    // Basic client-side validation
    if (isNaN(lessonData.durationInMinutes) || isNaN(lessonData.order)) {
         messageDiv.textContent = 'Please ensure Duration and Order are valid numbers.';
         messageDiv.className = 'message-area error-message';
         return; 
    }
    if (!lessonData.title) {
         messageDiv.textContent = 'Lesson Title is required.';
         messageDiv.className = 'message-area error-message';
         return;
    }

    console.log(`Submitting new lesson for course ${courseId}:`, lessonData); 

    try {
        // Send POST request to /api/courses/{courseId}/lessons
        const createdLesson = await fetchData(`/courses/${courseId}/lessons`, {
            method: 'POST',
            body: JSON.stringify(lessonData) // fetchData sets Content-Type
        });

        if (createdLesson && createdLesson.id) {
             messageDiv.textContent = 'Lesson added successfully!';
             messageDiv.className = 'message-area success-message';
             // Optionally clear form or redirect
             form.reset(); 
             // Consider redirecting back to dashboard or a lesson list view after delay
             // setTimeout(loadInstructorDashboard, 1500); 
        } else {
            throw new Error("Lesson creation failed. No valid lesson data returned.");
        }
    } catch (error) {
        messageDiv.textContent = `Error adding lesson: ${error.message}`;
        messageDiv.className = 'message-area error-message';
        console.error("Lesson creation error:", error);
    }
}

// TODO: Add functions for viewing, editing, deleting lessons
/**
 * Loads and displays the list of lessons for a specific course.
 * @param {string} courseId - The ID of the course whose lessons to display.
 */
export async function loadCourseLessonsPage(courseId) {
    renderContent(`<p>Loading lessons for course ID: ${courseId}...</p>`);
    
    // Fetch course details for title (use cache)
    const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;
    
    try {
        const lessons = await fetchData(`/courses/${courseId}/lessons`);

        let lessonsHtml = `
            <button id="back-to-course-detail">Back to Course Details</button> 
            <h2>Lessons for "${courseTitle}"</h2>
        `; 
        // TODO: Add 'Back to Instructor Dashboard' button if navigating from there? Requires context.

        if (lessons && Array.isArray(lessons) && lessons.length > 0) {
            // Sort lessons by order
            lessons.sort((a, b) => a.order - b.order);

            lessonsHtml += '<ul class="lesson-list">'; // Add styling for lesson-list
            lessons.forEach(lesson => {
                lessonsHtml += `
                    <li class="lesson-item">
                        <h3>${lesson.order}. ${lesson.title}</h3>
                        <p><strong>Duration:</strong> ${lesson.durationInMinutes} minutes</p>
                        <p>${lesson.content || 'No content description.'}</p>
                        ${lesson.videoUrl ? `<p><a href="${lesson.videoUrl}" target="_blank">Watch Video</a></p>` : ''}
                        {/* TODO: Add Edit/Delete buttons for instructors */}
                    </li>
                `;
            });
            lessonsHtml += '</ul>';
        } else {
            lessonsHtml += '<p>No lessons found for this course.</p>';
        }

        renderContent(lessonsHtml);

        // Add back button listener (assuming it always goes back to course detail for now)
        const backButton = document.getElementById('back-to-course-detail');
        if (backButton) {
            // We need loadCourseDetailPage, import it at the top of this file
            backButton.addEventListener('click', () => loadCourseDetailPage(courseId)); 
        }

    } catch (error) {
        renderContent(`<p class="error">Error loading lessons: ${error.message}</p><button id="back-to-course-detail-error">Back</button>`);
        const backButtonError = document.getElementById('back-to-course-detail-error');
         if (backButtonError) {
            backButtonError.addEventListener('click', () => loadCourseDetailPage(courseId)); // Need loadCourseDetailPage import
        }
    }
}