// Module for handling Lesson related pages and actions

import { fetchData } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import * as Cache from '../state/cache.js';
import { loadInstructorDashboard } from './instructorDashboard.js';
import { loadCourseDetailPage } from './courses.js'; // Import for back button

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

        let lessonHtml = `
            <div class="lesson-view-container">
                <button id="back-to-lessons-list">Back to Lessons List (${courseTitle})</button>
                <h2>${lessonDetail.title} (Lesson ${lessonDetail.order})</h2>
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
    
    const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;
    
    try {
        const lessons = await fetchData(`/courses/${courseId}/lessons`);
        currentCourseLessons = lessons && Array.isArray(lessons) ? lessons.sort((a, b) => a.order - b.order) : [];

        let lessonsHtml = `
            <button id="back-to-course-detail">Back to Course Details (${courseTitle})</button>
            <h2>Lessons for "${courseTitle}"</h2>
        `;

        if (currentCourseLessons.length > 0) {
            lessonsHtml += '<ul class="lesson-list clickable-lesson-list">'; // Added a class for styling clickable items
            currentCourseLessons.forEach((lesson, index) => {
                lessonsHtml += `
                    <li class="lesson-item" data-lesson-index="${index}" data-course-id="${courseId}">
                        <h3>${lesson.order}. ${lesson.title}</h3>
                        <p><em>Click to view details</em></p>
                    </li>
                `;
            });
            lessonsHtml += '</ul>';
        } else {
            lessonsHtml += '<p>No lessons found for this course.</p>';
        }

        renderContent(lessonsHtml);

        document.getElementById('back-to-course-detail').addEventListener('click', () => loadCourseDetailPage(courseId));
        
        document.querySelectorAll('.clickable-lesson-list .lesson-item').forEach(item => {
            item.addEventListener('click', (event) => {
                const targetLi = event.currentTarget;
                const lessonIndex = parseInt(targetLi.dataset.lessonIndex, 10);
                const cId = targetLi.dataset.courseId;
                if (!isNaN(lessonIndex) && cId) {
                    renderIndividualLessonView(cId, currentCourseLessons, lessonIndex);
                } else {
                    console.error("Could not get lesson index or course ID from clicked item", targetLi.dataset);
                    renderContent("<p class='error'>Sorry, there was an error loading this lesson.</p>");
                }
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