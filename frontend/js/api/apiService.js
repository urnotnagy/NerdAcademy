// Module for handling API interactions

// Use the globally available config.
// import { API_BASE_URL } from '../config.js'; // No longer importing
const API_BASE_URL = window.NerdAcademy.Config.API_BASE_URL;

/**
 * Fetches data from the backend API.
 * Automatically adds Authorization header if a token exists in localStorage.
 * Handles basic response checking and JSON parsing.
 * @param {string} endpoint - The API endpoint (e.g., '/Courses').
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<object|string|null>} - The parsed JSON response, text response, or null on error.
 */
export async function fetchData(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers }; // Copy existing headers

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Ensure Content-Type is set for relevant methods if not already provided
    if (options.body && !headers['Content-Type']) {
         headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        if (!response.ok) {
            let errorData;
            try {
                // Try to parse error details, e.g., ProblemDetails
                errorData = await response.json();
            } catch (e) { 
                // If error response isn't JSON, use status text
                errorData = { title: response.statusText };
            }
            // Construct a meaningful error message
            const errorMessage = errorData?.detail || errorData?.title || `HTTP error! status: ${response.status}`;
            console.error(`API Error (${response.status}) on ${endpoint}:`, errorData);
            throw new Error(errorMessage);
        }

        // Handle empty responses (e.g., 204 No Content)
        if (response.status === 204) {
            return null; // Or return an empty object/true depending on expected outcome
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            // Handle non-JSON responses if necessary, e.g., plain text
            return await response.text(); 
        }
    } catch (error) {
        // Log fetch errors (network issues, CORS, etc.) or errors thrown above
        console.error(`Fetch error for endpoint ${endpoint}:`, error);
        // Re-throw or handle as needed - maybe display a generic error to the user
        // For now, re-throwing might be simpler for calling functions to handle
        throw error; // Re-throw the error to be caught by the calling function
    }
}

// --- Start of NerdAcademy.ApiService namespace population ---
window.NerdAcademy = window.NerdAcademy || {};
window.NerdAcademy.ApiService = (function() {
    // Course specific API calls
    async function getCourses() {
        return fetchData('/Courses');
    }

    async function getCourseById(courseId) {
        return fetchData(`/Courses/${courseId}`);
    }

    async function createCourse(courseData) {
        return fetchData('/Courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    async function updateCourse(courseId, courseData) {
        return fetchData(`/Courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
    }

    async function deleteCourse(courseId) {
        return fetchData(`/Courses/${courseId}`, {
            method: 'DELETE'
        });
    }

    // User/Auth specific API calls
    async function loginUser(credentials) {
        return fetchData('/Users/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async function registerUser(userData) {
        return fetchData('/Users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async function getCurrentUserProfile() {
        // As discussed, direct /me endpoint is not available. Role is from JWT.
        return Promise.reject(new Error("No /me endpoint defined for profile fetching. Use JWT."));
    }

    async function getUsers() { // Added getUsers function
        return fetchData('/Users');
    }
 
    // Enrollment specific API calls
    async function enrollInCourse(courseId) {
        return fetchData('/Enrollments', {
            method: 'POST',
            body: JSON.stringify({ courseId: courseId })
        });
    }

    async function getStudentEnrollments() {
        return Promise.reject(new Error("No dedicated student enrollments endpoint defined."));
    }

    // Lesson specific API calls
    async function getLessonsForCourse(courseId) {
        return Promise.reject(new Error("No specific endpoint to get lessons by course ID."));
    }

    async function getLessonById(lessonId) {
        return fetchData(`/Lessons/${lessonId}`);
    }

    async function updateLesson(lessonId, lessonData) {
        return fetchData(`/Lessons/${lessonId}`, {
            method: 'PUT',
            body: JSON.stringify(lessonData)
        });
    }

    async function deleteLesson(lessonId) { // Added to IIFE
        return fetchData(`/Lessons/${lessonId}`, {
            method: 'DELETE'
        });
    }

    return {
        fetchData, // Expose the generic fetchData as well if needed directly
        getCourses,
        getCourseById,
        createCourse,
        updateCourse,
        deleteCourse,
        loginUser,
        registerUser,
        getCurrentUserProfile,
        getUsers, // Added getUsers to IIFE return
        enrollInCourse,
        getStudentEnrollments,
        getLessonsForCourse,
        getLessonById,
        updateLesson,
        deleteLesson,
        getEnrollments, // Added
        deleteEnrollment // Added
    };
})();
// --- End of NerdAcademy.ApiService namespace population ---


// ES6 Exports (can co-exist for future module system adoption)
// Course specific API calls
export async function getCourses() {
    return fetchData('/Courses');
}

export async function getCourseById(courseId) {
    return fetchData(`/Courses/${courseId}`);
}

export async function createCourse(courseData) {
    return fetchData('/Courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
    });
}

export async function updateCourse(courseId, courseData) {
    return fetchData(`/Courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
    });
}

export async function deleteCourse(courseId) {
    return fetchData(`/Courses/${courseId}`, {
        method: 'DELETE'
    });
}

// User/Auth specific API calls
export async function loginUser(credentials) {
    return fetchData('/Users/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

export async function registerUser(userData) {
    return fetchData('/Users/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

export async function getCurrentUserProfile() {
    return Promise.reject(new Error("No /me endpoint defined for profile fetching. Use JWT."));
}

export async function getUsers() { // Added getUsers ES6 export
    return fetchData('/Users');
}
 
 
// Enrollment specific API calls
export async function enrollInCourse(courseId) {
    return fetchData('/Enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId: courseId })
    });
}

export async function getStudentEnrollments() {
    return Promise.reject(new Error("No dedicated student enrollments endpoint defined."));
}

export async function getEnrollments() { // New function
    return fetchData('/Enrollments');
}

export async function deleteEnrollment(enrollmentId) { // New function
    return fetchData(`/Enrollments/${enrollmentId}`, {
        method: 'DELETE'
    });
}

// Lesson specific API calls
export async function getLessonsForCourse(courseId) {
    return Promise.reject(new Error("No specific endpoint to get lessons by course ID."));
}

export async function getLessonById(lessonId) {
    return fetchData(`/Lessons/${lessonId}`);
}

export async function updateLesson(lessonId, lessonData) {
    return fetchData(`/Lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(lessonData)
    });
}

export async function deleteLesson(lessonId) {
    return fetchData(`/Lessons/${lessonId}`, {
        method: 'DELETE'
    });
}

// Add other API functions as needed (e.g., for Tags, Payments, etc.)