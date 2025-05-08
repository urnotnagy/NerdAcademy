// Module for handling API interactions

// Import the base URL from the config file.
// Note the relative path '../config.js' because apiService.js is inside the 'api' subdirectory.
import { API_BASE_URL } from '../config.js'; 

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