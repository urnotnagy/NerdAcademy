// Module for rendering the Instructor Dashboard and related forms

import { fetchData } from '../api/apiService.js';
import { renderContent } from '../ui/domUtils.js';
import * as Cache from '../state/cache.js';
import { getCurrentUser } from '../auth/auth.js';
import { loadAddLessonForm, loadCourseLessonsPage } from './lessons.js'; // Import lesson functions

/**
 * Loads and displays the instructor dashboard, showing their created courses.
 */
export async function loadInstructorDashboard() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'Instructor') {
        renderContent('<p>You must be logged in as an instructor to view this page.</p>');
        return;
    }

    const userName = currentUser.firstName || 'Instructor';
    renderContent(`
        <div class="dashboard-container">
            <h2>Instructor Dashboard</h2>
            <p>Welcome, ${userName}!</p>
            <button id="create-course-btn" class="action-button">Create New Course</button>
            <div id="instructor-courses-container">
                <h3>Your Courses</h3>
                <div id="instructor-courses-list"><p>Loading your courses...</p></div>
            </div>
        </div>
    `);

    const instructorCoursesListDiv = document.getElementById('instructor-courses-list');
    document.getElementById('create-course-btn').addEventListener('click', loadCreateCourseForm);

    // Fetch all courses and filter by instructorId
    try {
        console.log("Attempting to fetch courses for Instructor Dashboard...");
        const allCourses = await fetchData('/Courses'); // Old endpoint
        // const instructorCourses = await fetchData('/Courses/mycourses'); // New endpoint
        console.log("Fetched courses data:", allCourses);

        if (!allCourses || !Array.isArray(allCourses)) {
            console.error("Failed to fetch courses or response was not an array:", allCourses);
            instructorCoursesListDiv.innerHTML = '<p>Could not load your courses.</p>';
            return;
        }

        // Filter client-side
        const instructorCourses = allCourses.filter(course => course.instructorId === currentUser.id);
        console.log("Filtered instructor courses:", instructorCourses);

        if (instructorCourses.length === 0) {
            instructorCoursesListDiv.innerHTML = '<p>You have not created any courses yet.</p>';
            return;
        }

        let coursesHtml = '<ul class="course-list instructor-course-list">'; 
        instructorCourses.forEach(course => {
            // Cache the course details
            Cache.updateCourseDetailInCache(course);
            
            coursesHtml += `
                <li>
                    <h3>${course.title}</h3>
                    <p>${course.description ? (course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')) : 'No description.'}</p>
                    <p>Status: ${course.status}</p> 
                    <div class="course-actions">
                        <button class="action-button view-lessons-btn" data-course-id="${course.id}">View Lessons</button>
                        <button class="action-button add-lesson-btn" data-course-id="${course.id}">Add Lesson</button>
                        <button class="action-button edit-course-btn" data-course-id="${course.id}">Edit Course</button>
                        <button class="action-button delete-course-btn" data-course-id="${course.id}">Delete Course</button>
                    </div>
                </li>
            `;
        });
        coursesHtml += '</ul>';
        instructorCoursesListDiv.innerHTML = coursesHtml;

        // Add event listeners for course actions (placeholders for now)
        instructorCoursesListDiv.querySelectorAll('.view-lessons-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseId;
                // TODO: Implement loadCourseLessonsPage(courseId); 
                loadCourseLessonsPage(courseId); // Call the function
           });
       });
       instructorCoursesListDiv.querySelectorAll('.add-lesson-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseId;
                // TODO: Implement loadAddLessonForm(courseId); 
                 loadAddLessonForm(courseId); // Call the function
            });
        });
         instructorCoursesListDiv.querySelectorAll('.edit-course-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseId;
                // TODO: Implement loadEditCourseForm(courseId); 
                 loadEditCourseForm(courseId); // Call the function to load the edit form
            });
        });
         instructorCoursesListDiv.querySelectorAll('.delete-course-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseId;
                handleDeleteCourse(courseId); // Call the delete handler
            });
        });
    } catch (error) {
        instructorCoursesListDiv.innerHTML = `<p class="error">Error loading your courses: ${error.message}</p>`;
    }
}

/**
 * Loads the form for creating a new course.
 */
export async function loadCreateCourseForm() {
    // Fetch tags if not already in cache
    if (Cache.allTagsCache === null) {
        try {
            const tags = await fetchData('/Tags');
            Cache.setTagsCache(tags || []);
        } catch (error) {
            console.error("Failed to fetch tags for create form:", error);
            Cache.setTagsCache([]); // Set empty cache on error
        }
    }

    // Define options
    const levelOptions = [
        { value: 0, text: 'Beginner' },
        { value: 1, text: 'Intermediate' },
        { value: 2, text: 'Advanced' }
    ];
    const statusOptions = [
        { value: 0, text: 'Draft' },
        { value: 1, text: 'Published' },
        { value: 2, text: 'Archived' }
    ];

    // Generate HTML for dropdowns
    const levelDropdownHtml = `
        <select id="course-level" name="level" required>
            ${levelOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}
        </select>`;
    // const statusDropdownHtml = `
    //     <select id="course-status" name="status" required>
    //          ${statusOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}
    //     </select>`;

    // Generate HTML for tag checkboxes
    let tagsCheckboxesHtml = '<p>No tags available.</p>';
    if (Cache.allTagsCache && Cache.allTagsCache.length > 0) {
        tagsCheckboxesHtml = Cache.allTagsCache.map(tag => `
            <label class="tag-checkbox-label">
                <input type="checkbox" name="tagIds" value="${tag.id}"> ${tag.name}
            </label>
        `).join('');
    }

    renderContent(`
        <h2>Create New Course</h2>
        <form id="create-course-form">
             <div>
                <label for="course-title">Title:</label>
                <input type="text" id="course-title" name="title" required maxlength="150">
                <small id="title-char-count">0/150</small>
             </div>
             <div>
                <label for="course-desc">Description:</label>
                <textarea id="course-desc" name="description" maxlength="2000"></textarea>
                <small id="desc-char-count">0/2000</small>
             </div>
             <div><label for="course-price">Price:</label><input type="number" step="0.01" id="course-price" name="price" required></div>
             <div><label for="course-duration">Duration (Weeks):</label><input type="number" id="course-duration" name="durationInWeeks" required></div>
             <div><label for="course-level">Level:</label>${levelDropdownHtml}</div>
             <fieldset>
                 <legend>Tags:</legend>
                 <div class="tags-checkbox-group">${tagsCheckboxesHtml}</div>
             </fieldset>
             <button type="submit">Create Course</button>
        </form>
        <div id="create-course-message" class="message-area"></div>
        <button id="back-to-dashboard">Back to Dashboard</button>
    `);
    document.getElementById('back-to-dashboard').addEventListener('click', loadInstructorDashboard);
    
    const form = document.getElementById('create-course-form');
    if (form) {
        form.addEventListener('submit', handleCreateCourse);

        const titleInput = document.getElementById('course-title');
        const descriptionInput = document.getElementById('course-desc');
        const titleCharCount = document.getElementById('title-char-count');
        const descCharCount = document.getElementById('desc-char-count');

        if (titleInput && titleCharCount) {
            titleInput.addEventListener('input', () => {
                titleCharCount.textContent = `${titleInput.value.length}/150`;
            });
        }
        if (descriptionInput && descCharCount) {
            descriptionInput.addEventListener('input', () => {
                descCharCount.textContent = `${descriptionInput.value.length}/2000`;
            });
        }
    }
}

/**
 * Loads the form for editing an existing course, pre-filled with data.
 * @param {string} courseId - The ID of the course to edit.
 */
async function loadEditCourseForm(courseId) {
    renderContent(`<p>Loading course data for editing (ID: ${courseId})...</p>`);

    // Fetch course data (use cache first)
    let courseData = Cache.coursesDetailCache[courseId];
    if (!courseData) {
        try {
            courseData = await fetchData(`/Courses/${courseId}`);
            if (!courseData || !courseData.id) throw new Error("Course not found");
            Cache.updateCourseDetailInCache(courseData);
        } catch (error) {
            renderContent(`<p class="error">Error loading course data: ${error.message}</p><button id="back-to-dashboard">Back</button>`);
            document.getElementById('back-to-dashboard').addEventListener('click', loadInstructorDashboard);
            return;
        }
    }

    // Fetch tags if not already in cache
    if (Cache.allTagsCache === null) {
        try {
            const tags = await fetchData('/Tags');
            Cache.setTagsCache(tags || []);
        } catch (error) {
            console.error("Failed to fetch tags for edit form:", error);
            Cache.setTagsCache([]); // Set empty cache on error
        }
    }

    // Define options (same as create form)
    const levelOptions = [ { value: 0, text: 'Beginner' }, { value: 1, text: 'Intermediate' }, { value: 2, text: 'Advanced' } ];
    const statusOptions = [ { value: 0, text: 'Draft' }, { value: 1, text: 'Published' }, { value: 2, text: 'Archived' } ];

    // Helper to check if an option value matches the course data (handles string/number comparison)
    const isSelected = (optionValue, courseValue) => String(optionValue) === String(courseValue);
    const isTagChecked = (tagId, courseTagIds) => courseTagIds && courseTagIds.includes(tagId);

    // Generate HTML for dropdowns with selected values
    const levelDropdownHtml = `
        <select id="course-level" name="level" required>
            ${levelOptions.map(opt => `<option value="${opt.value}" ${isSelected(opt.value, courseData.level) ? 'selected' : ''}>${opt.text}</option>`).join('')}
        </select>`;
    const statusDropdownHtml = `
        <select id="course-status" name="status" required>
             ${statusOptions.map(opt => `<option value="${opt.value}" ${isSelected(opt.value, courseData.status) ? 'selected' : ''}>${opt.text}</option>`).join('')}
        </select>`;

    // Generate HTML for tag checkboxes with checked state
    let tagsCheckboxesHtml = '<p>No tags available.</p>';
    if (Cache.allTagsCache && Cache.allTagsCache.length > 0) {
        tagsCheckboxesHtml = Cache.allTagsCache.map(tag => `
            <label class="tag-checkbox-label">
                <input type="checkbox" name="tagIds" value="${tag.id}" ${isTagChecked(tag.id, courseData.tagIds) ? 'checked' : ''}> ${tag.name}
            </label>
        `).join('');
    }

    renderContent(`
        <h2>Edit Course: ${courseData.title}</h2>
        <form id="edit-course-form">
             <div><label for="course-title">Title:</label><input type="text" id="course-title" name="title" value="${courseData.title || ''}" required></div>
             <div><label for="course-desc">Description:</label><textarea id="course-desc" name="description">${courseData.description || ''}</textarea></div>
             <div><label for="course-price">Price:</label><input type="number" step="0.01" id="course-price" name="price" value="${courseData.price || 0}" required></div>
             <div><label for="course-duration">Duration (Weeks):</label><input type="number" id="course-duration" name="durationInWeeks" value="${courseData.durationInWeeks || 0}" required></div>
             <div><label for="course-level">Level:</label>${levelDropdownHtml}</div>
             <div><label for="course-status">Status:</label>${statusDropdownHtml}</div>
             <fieldset>
                 <legend>Tags:</legend>
                 <div class="tags-checkbox-group">${tagsCheckboxesHtml}</div>
             </fieldset>
             <button type="submit">Update Course</button>
        </form>
        <div id="edit-course-message" class="message-area"></div>
        <button id="back-to-dashboard">Back to Dashboard</button>
    `);
    document.getElementById('back-to-dashboard').addEventListener('click', loadInstructorDashboard);
    
    const form = document.getElementById('edit-course-form');
    if (form) {
        // Pass courseId to the handler
        form.addEventListener('submit', (event) => handleEditCourse(event, courseId)); 
    }
}

/**
 * Handles the submission of the edit course form.
 * @param {Event} event 
 * @param {string} courseId The ID of the course being edited.
 */
async function handleEditCourse(event, courseId) {
    event.preventDefault();
    const form = event.target;
    const messageDiv = document.getElementById('edit-course-message');
    messageDiv.textContent = 'Submitting updates...';
    messageDiv.className = 'message-area info-message';

    // Collect selected tag IDs
    const selectedTagIds = [];
    form.querySelectorAll('input[name="tagIds"]:checked').forEach(checkbox => {
        selectedTagIds.push(checkbox.value);
    });

    // Construct CourseUpdateDto payload
    const courseUpdateData = {
        title: form.title.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        durationInWeeks: parseInt(form.durationInWeeks.value, 10),
        level: parseInt(form.level.value, 10), 
        status: parseInt(form.status.value, 10), 
        tagIds: selectedTagIds 
    };

    // Basic client-side validation
    if (isNaN(courseUpdateData.price) || isNaN(courseUpdateData.durationInWeeks) || isNaN(courseUpdateData.level) || isNaN(courseUpdateData.status)) {
         messageDiv.textContent = 'Please ensure Price, Duration, Level, and Status are valid numbers.';
         messageDiv.className = 'message-area error-message';
         return; 
    }

    console.log(`Submitting course update for ID ${courseId}:`, courseUpdateData); 

    try {
        // Send PUT request
        const result = await fetchData(`/Courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseUpdateData) // fetchData sets Content-Type
        });

        // PUT request might return 204 No Content on success, or maybe updated object
        // Assuming success if no error is thrown by fetchData
        messageDiv.textContent = 'Course updated successfully!';
        messageDiv.className = 'message-area success-message';
        
        // Update cache with potentially modified data (if API returned it, otherwise refetch or merge)
        // For simplicity, let's just update with the submitted data for now
        const updatedCourseDataForCache = { 
            ...Cache.coursesDetailCache[courseId], // Keep existing ID, createdAt etc.
            ...courseUpdateData // Overwrite with updated fields
        };
         Cache.updateCourseDetailInCache(updatedCourseDataForCache); 

        // Redirect back to dashboard after a short delay
        setTimeout(loadInstructorDashboard, 1500); 

    } catch (error) {
        messageDiv.textContent = `Error updating course: ${error.message}`;
        messageDiv.className = 'message-area error-message';
        console.error("Course update error:", error);
    }
}
/**
 * Handles the submission of the create course form. (Placeholder)
 * @param {Event} event 
 */
async function handleCreateCourse(event) {
    event.preventDefault();
    const form = event.target;
    const messageDiv = document.getElementById('create-course-message');
    messageDiv.textContent = 'Submitting...';
    messageDiv.className = 'message-area info-message';

    // Collect selected tag IDs
    const selectedTagIds = [];
    form.querySelectorAll('input[name="tagIds"]:checked').forEach(checkbox => {
        selectedTagIds.push(checkbox.value);
    });

    const courseData = {
        title: form.title.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        durationInWeeks: parseInt(form.durationInWeeks.value, 10),
        level: parseInt(form.level.value, 10), // Get value from level dropdown
        status: 0, // Default status to "Draft" (0)
        tagIds: selectedTagIds // Use collected tag IDs
    };

    // Basic client-side validation example (can be expanded)
    // Status is no longer part of form validation as it's defaulted
    if (isNaN(courseData.price) || isNaN(courseData.durationInWeeks) || isNaN(courseData.level)) {
         messageDiv.textContent = 'Please ensure Price, Duration, and Level are valid numbers.';
         messageDiv.className = 'message-area error-message';
         return; // Stop submission
    }

    console.log("Submitting course data:", courseData);

    try {
        const createdCourse = await fetchData('/Courses', {
            method: 'POST',
            body: JSON.stringify(courseData) // fetchData sets Content-Type
        });

        if (createdCourse && createdCourse.id) {
             messageDiv.textContent = 'Course created successfully!';
             messageDiv.className = 'message-area success-message';
             Cache.updateCourseDetailInCache(createdCourse); // Add to cache
             // Optionally clear the main course list cache if needed
             // Redirect back to dashboard after a short delay?
             setTimeout(loadInstructorDashboard, 1500); 
        } else {
            throw new Error("Course creation failed. No valid course data returned.");
        }
    } catch (error) {
        messageDiv.textContent = `Error creating course: ${error.message}`;
        messageDiv.className = 'message-area error-message';
        console.error("Course creation error:", error);
    }
}
/**
 * Handles the deletion of a course after confirmation.
 * @param {string} courseId - The ID of the course to delete.
 */
async function handleDeleteCourse(courseId) {
    // Find the course title from cache for the confirmation message
    const courseTitle = Cache.coursesDetailCache[courseId]?.title || `Course ID ${courseId}`;
    
    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete the course "${courseTitle}"? This action cannot be undone.`)) {
        return; // Stop if user cancels
    }

    console.log(`Attempting to delete course ID: ${courseId}`);
    // Optionally disable the delete button or show a loading indicator here

    try {
        // Send DELETE request
        // fetchData handles success/error based on response.ok
        // DELETE often returns 204 No Content, which fetchData handles by returning null
        await fetchData(`/Courses/${courseId}`, {
            method: 'DELETE'
        });

        console.log(`Course ${courseId} deleted successfully.`);
        
        // Remove from cache
        if (Cache.coursesDetailCache[courseId]) {
            delete Cache.coursesDetailCache[courseId];
        }
        
        // Provide feedback and reload the dashboard
        alert(`Course "${courseTitle}" deleted successfully.`); // Simple feedback
        loadInstructorDashboard(); // Reload the dashboard view

    } catch (error) {
        console.error(`Error deleting course ${courseId}:`, error);
        // Display error message to the user (e.g., in a dedicated message area on the dashboard)
        alert(`Error deleting course: ${error.message}`); 
        // Re-enable button or remove loading indicator if implemented
    }
}