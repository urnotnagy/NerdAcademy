// Module for rendering the Student Dashboard

import { fetchData } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import * as Cache from '../state/cache.js'; // Import cache module
import { getCurrentUser } from '../auth/auth.js'; // Need user info
import { loadCoursesPage, loadCourseDetailPage } from './courses.js'; // Need navigation functions

/**
 * Loads and displays the student dashboard, showing enrolled courses.
 */
export async function loadStudentDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'Student') {
        renderContent('<p>You must be logged in as a student to view this page.</p>');
        // Optionally redirect to login or courses page
        // loadLoginPage(); 
        return;
    }

    const userName = currentUser.firstName || 'Student';
    renderContent(`
        <div class="dashboard-container">
            <h2>Student Dashboard</h2>
            <p>Welcome, ${userName}!</p>
            <div id="enrolled-courses-container">
                <h3>Your Enrolled Courses</h3>
                <div id="enrolled-courses-list"><p>Loading your enrolled courses...</p></div>
            </div>
        </div>
    `);

    const enrolledCoursesListDiv = document.getElementById('enrolled-courses-list');

    // Ensure studentEnrollmentsCache is populated
    if (Cache.studentEnrollmentsCache === null) { 
        try {
            const allEnrollments = await fetchData('/Enrollments');
            if (allEnrollments && Array.isArray(allEnrollments)) {
                // Filter specifically for the current user
                Cache.setStudentEnrollmentsCache(allEnrollments.filter(e => e.studentId === currentUser.id));
            } else {
                Cache.setStudentEnrollmentsCache([]); 
                console.warn("Could not fetch student enrollments for dashboard or none found.");
            }
        } catch (error) {
             Cache.setStudentEnrollmentsCache([]); // Set to empty on error
             console.error("Error fetching enrollments for dashboard:", error);
             enrolledCoursesListDiv.innerHTML = `<p class="error">Error loading your enrollments: ${error.message}</p>`;
             return; // Stop further processing if enrollments can't be fetched
        }
    }

    // Proceed using the (potentially newly populated) cache
    if (!Cache.studentEnrollmentsCache || Cache.studentEnrollmentsCache.length === 0) {
        enrolledCoursesListDiv.innerHTML = '<p>You are not currently enrolled in any courses. <a href="#" id="explore-courses-link">Explore Courses</a></p>';
        const exploreLink = document.getElementById('explore-courses-link');
        if(exploreLink) exploreLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadCoursesPage(); // Use imported function
        });
        return;
    }

    let coursesHtml = '<ul class="course-list enrolled-course-list">'; // Re-use course-list styling
    
    // Fetch details for each enrolled course
    const courseDetailPromises = Cache.studentEnrollmentsCache.map(async (enrollment) => {
        const courseId = enrollment.courseId;
        if (Cache.coursesDetailCache[courseId]) {
            return Cache.coursesDetailCache[courseId]; // Use cached details
        }
        try {
            const courseDetails = await fetchData(`/Courses/${courseId}`);
            if (courseDetails && courseDetails.id) {
                Cache.updateCourseDetailInCache(courseDetails); // Cache fetched details
                return courseDetails;
            }
            console.error(`Failed to fetch details for enrolled course ID: ${courseId}`);
            return null; 
        } catch (error) {
             console.error(`Error fetching details for course ${courseId}:`, error);
             return null; // Skip course if fetch fails
        }
    });

    // Wait for all detail fetches
    const resolvedCourses = (await Promise.all(courseDetailPromises)).filter(course => course !== null);

    if (resolvedCourses.length === 0 && Cache.studentEnrollmentsCache.length > 0) {
        // This means enrollments exist, but fetching details for all failed.
        enrolledCoursesListDiv.innerHTML = '<p class="error">Could not load details for your enrolled courses. Please try again later.</p>';
        return;
    }
     if (resolvedCourses.length === 0) { // Should be caught earlier, but safeguard
        enrolledCoursesListDiv.innerHTML = '<p>You are not currently enrolled in any courses. <a href="#" id="explore-courses-link">Explore Courses</a></p>';
        const exploreLink = document.getElementById('explore-courses-link');
        if(exploreLink) exploreLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadCoursesPage();
        });
        return;
    }

    // Render the list
    resolvedCourses.forEach(course => {
        coursesHtml += `
            <li>
                <h3>${course.title}</h3>
                <p>${course.description ? (course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')) : 'No description.'}</p>
                <p>Status: ${course.status || 'N/A'}</p> 
                <button class="view-details-btn" data-course-id="${course.id}">View Course</button>
            </li>
        `;
    });
    coursesHtml += '</ul>';
    enrolledCoursesListDiv.innerHTML = coursesHtml;

    // Add event listeners to buttons
    enrolledCoursesListDiv.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const courseId = event.target.dataset.courseId;
            loadCourseDetailPage(courseId); // Use imported function
        });
    });
}