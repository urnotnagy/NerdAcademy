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

// Add more specific cache update/retrieval functions as needed.