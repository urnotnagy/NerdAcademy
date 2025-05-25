// Module for managing application-level caches

// We export the caches directly for simplicity in this example.
// In a larger app, you might use functions (getters/setters) or a more formal state management pattern.

export let allTagsCache = null; 
export let usersCache = {}; 
export let studentEnrollmentsCache = null; 
export let coursesDetailCache = {}; 

// --- Cache Management Functions ---

/**
 * Clears all relevant application caches, typically called on logout.
 */
export function clearAllCaches() {
    console.log("Clearing application caches...");
    allTagsCache = null;
    usersCache = {};
    studentEnrollmentsCache = null;
    coursesDetailCache = {};
}

/**
 * Clears the student-specific enrollments cache.
 */
export function clearStudentEnrollmentsCache() {
    studentEnrollmentsCache = null;
}

/**
 * Updates the tags cache.
 * @param {Array|null} tagsData - The new tags data.
 */
export function setTagsCache(tagsData) {
    allTagsCache = tagsData;
}

/**
 * Updates the student enrollments cache.
 * @param {Array|null} enrollmentsData - The new enrollments data for the student.
 */
export function setStudentEnrollmentsCache(enrollmentsData) {
    studentEnrollmentsCache = enrollmentsData;
}

/**
 * Adds or updates a user in the users cache.
 * @param {object} user - The user object (UserReadDto).
 */
export function updateUserInCache(user) {
    if (user && user.id) {
        usersCache[user.id] = user;
    }
}

/**
 * Adds or updates a course detail in the cache.
 * @param {object} course - The course object (CourseReadDto).
 */
export function updateCourseDetailInCache(course) {
     if (course && course.id) {
        coursesDetailCache[course.id] = course;
    }
}

/**
 * Populates the usersCache by fetching all users from the API if the cache is empty.
 * This is useful for having user details (like names) available globally.
 */
export async function populateUserCache() {
    if (Object.keys(usersCache).length === 0) {
        try {
            // Dynamically import getUsers to avoid circular dependencies if cache.js is imported by apiService.js
            const { getUsers } = await import('../api/apiService.js');
            const users = await getUsers();
            if (users && users.length > 0) {
                users.forEach(user => {
                    updateUserInCache(user);
                });
                console.log("User cache populated.");
            }
        } catch (error) {
            console.error("Failed to populate user cache:", error);
            // Depending on the app's needs, you might want to throw the error
            // or handle it silently if the cache not being populated isn't critical immediately.
        }
    } else {
        console.log("User cache is already populated.");
    }
}

// Add more specific cache update/retrieval functions as needed.