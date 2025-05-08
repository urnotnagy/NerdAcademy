// Module for handling course list and detail page rendering

import { fetchData } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import { handleEnrollment } from './enrollment.js';
import { loadLoginPage } from './authPages.js';
import * as Cache from '../state/cache.js';
import { getCurrentUser } from '../auth/auth.js';
import { loadCourseLessonsPage } from './lessons.js'; // Import lesson page loader

/**
 * Loads and displays the list of all available courses.
 */
export async function loadCoursesPage() {
    renderContent('<p>Loading courses...</p>');
    try {
        const courses = await fetchData('/Courses');
        if (courses && Array.isArray(courses)) {
            // Cache course details fetched in the list view
            courses.forEach(course => Cache.updateCourseDetailInCache(course));

            if (courses.length === 0) {
                renderContent('<p>No courses available at the moment.</p>');
                return;
            }
            let coursesHtml = '<h2>Available Courses</h2><ul class="course-list">';
            courses.forEach(course => {
                coursesHtml += `
                    <li>
                        <h3>${course.title}</h3>
                        <p>${course.description || 'No description available.'}</p>
                        <p>Price: $${course.price}</p>
                        <p>Duration: ${course.durationInWeeks} weeks</p>
                        <p>Level: ${course.level}</p>
                        <p>Status: ${course.status}</p>
                        <button class="view-details-btn" data-course-id="${course.id}">View Details</button>
                    </li>
                `;
            });
            coursesHtml += '</ul>';
            renderContent(coursesHtml);

            document.querySelectorAll('.view-details-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const courseId = event.target.dataset.courseId;
                    loadCourseDetailPage(courseId); // Call detail page loader
                });
            });

        } else {
            renderContent('<p>Could not load courses. Please try again later.</p>');
        }
    } catch (error) {
        renderContent(`<p class="error">Error loading courses: ${error.message}</p>`);
    }
}

/**
 * Loads and displays the details for a single course.
 * @param {string} courseId - The ID of the course to load.
 */
export async function loadCourseDetailPage(courseId) {
    renderContent(`<p>Loading course details for ID: ${courseId}...</p>`);
    try {
        // Check cache first
        let course = Cache.coursesDetailCache[courseId];
        if (!course) {
            course = await fetchData(`/Courses/${courseId}`);
            if (course && course.id) {
                Cache.updateCourseDetailInCache(course); // Update cache
            } else {
                 throw new Error(`Course with ID ${courseId} not found.`);
            }
        }
       
        const currentUserData = getCurrentUser(); // Use auth helper

        // Fetch tags if not cached
        if (Cache.allTagsCache === null) {
            const tags = await fetchData('/Tags');
            Cache.setTagsCache(tags || []); // Update cache, default to empty array
        }

        // Fetch student enrollments if needed
        if (currentUserData && currentUserData.role === 'Student' && Cache.studentEnrollmentsCache === null) {
            const allEnrollments = await fetchData('/Enrollments');
            if (allEnrollments && Array.isArray(allEnrollments)) {
                Cache.setStudentEnrollmentsCache(allEnrollments.filter(e => e.studentId === currentUserData.id));
            } else {
                Cache.setStudentEnrollmentsCache([]);
                console.warn("Could not fetch student enrollments or none found.");
            }
        }

        // Process tags
        let courseTags = [];
        if (Cache.allTagsCache && Array.isArray(Cache.allTagsCache) && course.tagIds && Array.isArray(course.tagIds)) {
            courseTags = Cache.allTagsCache.filter(tag => course.tagIds.includes(tag.id)).map(tag => tag.name);
        }

        // Process instructor name (using cache) - still temporary ID display
        const instructorDisplay = course.instructorId ? `ID: ${course.instructorId}` : 'N/A';
        // TODO: Re-implement instructor name fetching if backend allows or CourseReadDto includes it

        const detailHtml = `
            <button id="back-to-courses">Back to Courses</button>
            <div class="course-detail-container">
                <h2>${course.title}</h2>
                <p><strong>Description:</strong> ${course.description || 'N/A'}</p>
                <p><strong>Price:</strong> $${course.price}</p>
                <p><strong>Duration:</strong> ${course.durationInWeeks} weeks</p>
                <p><strong>Level:</strong> ${course.level}</p>
                <p><strong>Status:</strong> ${course.status}</p>
                <p><strong>Instructor:</strong> ${instructorDisplay}</p>
                <p><strong>Created At:</strong> ${new Date(course.createdAt).toLocaleDateString()}</p>
                <p><strong>Tags:</strong> ${courseTags.length > 0 ? courseTags.join(', ') : 'No tags'}</p>
                
                <div id="enrollment-section">
                     <button id="enroll-button" data-course-id="${course.id}">Enroll in this Course</button>
                     <div id="enrollment-message" class="message-area"></div>
                </div>
                
                <h3>Lessons</h3>
                <div id="lessons-list">
                    <p>Lessons will be listed here.</p>
                    <button data-course-id="${course.id}" id="view-lessons-btn">View Lessons</button>
                </div>
            </div>
        `;
        renderContent(detailHtml);
        document.getElementById('back-to-courses').addEventListener('click', loadCoursesPage);
        
        const enrollButton = document.getElementById('enroll-button');
        const enrollmentMessageDiv = document.getElementById('enrollment-message');

        // Setup Enroll button state
        if (enrollButton) {
            if (currentUserData && currentUserData.role === 'Student') {
                const isEnrolled = Cache.studentEnrollmentsCache && Cache.studentEnrollmentsCache.some(e => e.courseId === courseId);
                if (isEnrolled) {
                    enrollButton.textContent = 'Already Enrolled';
                    enrollButton.disabled = true;
                    enrollButton.classList.add('disabled-button');
                    if (enrollmentMessageDiv) {
                        enrollmentMessageDiv.textContent = 'You are already enrolled in this course.';
                        enrollmentMessageDiv.className = 'message-area info-message'; 
                    }
                } else {
                    enrollButton.style.display = 'inline-block';
                    // Note: handleEnrollment needs to be imported or defined
                    enrollButton.addEventListener('click', () => handleEnrollment(courseId, enrollmentMessageDiv)); 
                }
            } else if (currentUserData && currentUserData.role === 'Instructor') {
                enrollButton.style.display = 'none';
                if (enrollmentMessageDiv) enrollmentMessageDiv.style.display = 'none';
            } else if (!currentUserData) {
                 enrollButton.textContent = 'Login to Enroll';
                 enrollButton.addEventListener('click', loadLoginPage);
            }
        }
        
        // Add listener for view-lessons-btn
        const viewLessonsBtn = document.getElementById('view-lessons-btn');
        if (viewLessonsBtn) {
            viewLessonsBtn.addEventListener('click', () => loadCourseLessonsPage(courseId));
        }

    } catch (error) {
         renderContent(`<p class="error">Error loading course details: ${error.message}</p> <button id="back-to-courses">Back to Courses</button>`);
         const backButton = document.getElementById('back-to-courses');
         if (backButton) backButton.addEventListener('click', loadCoursesPage);
    }
}