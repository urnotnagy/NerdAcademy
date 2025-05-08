// Module for handling authentication logic (login, register, logout)

import { fetchData } from '../api/apiService.js';
import { decodeJwt, isTokenExpired } from './jwtUtils.js';

// --- Authentication State & Helpers ---

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
const TOKEN_EXPIRES_KEY = 'tokenExpires'; // If you store expiry

export function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getCurrentUser() {
    const userDataString = localStorage.getItem(USER_DATA_KEY);
    try {
        return userDataString ? JSON.parse(userDataString) : null;
    } catch (e) {
        console.error("Error parsing stored user data:", e);
        clearAuthData(); // Clear potentially corrupted data
        return null;
    }
}

export function isLoggedIn() {
    const token = getToken();
    // Optionally add expiration check here using isTokenExpired(token)
    return !!token; // Simple check: if token exists, assume logged in for now
}

export function clearAuthData() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    // Clear relevant caches - needs access to cache module or event system
    // For now, we'll handle cache clearing within handleLogout which calls this
}

// --- Authentication Actions ---

/**
 * Handles the login form submission.
 * @param {Event} event - The form submission event.
 * @param {function} onSuccess - Callback function on successful login and user fetch.
 * @param {function} onError - Callback function on error.
 */
export async function handleLogin(event, onSuccess, onError) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const loginMessage = document.getElementById('login-message'); // Assumes this ID exists where the form is rendered

    if (loginMessage) {
        loginMessage.textContent = 'Attempting login...';
        loginMessage.className = 'message-area info-message';
    }

    try {
        // Use fetch directly for login as fetchData might add an old token header
        const response = await fetch(`${API_BASE_URL}/Users/login`, { // Need API_BASE_URL, import from config?
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await response.json();

        if (response.ok && loginData.token) {
            if (loginMessage) loginMessage.textContent = 'Login successful! Fetching user details...';
            localStorage.setItem(AUTH_TOKEN_KEY, loginData.token);
            if (loginData.expires) localStorage.setItem(TOKEN_EXPIRES_KEY, loginData.expires);

            const decodedToken = decodeJwt(loginData.token);
            if (decodedToken && decodedToken.sub) {
                const userId = decodedToken.sub;
                // Use the imported fetchData (which will now include the new token)
                const userDetails = await fetchData(`/Users/${userId}`); 
                if (userDetails && userDetails.id) {
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userDetails));
                    if (onSuccess) onSuccess(userDetails); // Call success callback
                } else {
                    throw new Error('Login successful, but failed to fetch user details.');
                }
            } else {
                 throw new Error('Login successful, but could not decode token to get user ID.');
            }
        } else if (loginData.error) {
            throw new Error(`Login failed: ${loginData.error}`);
        } else {
            const errorMsg = loginData?.detail || loginData?.title || 'Login failed. Please check your credentials.';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Login process error:', error);
        if (loginMessage) {
            loginMessage.textContent = `Login error: ${error.message}`;
            loginMessage.className = 'message-area error-message';
        }
        if (onError) onError(error); // Call error callback
    }
}

/**
 * Handles the registration form submission.
 * @param {Event} event - The form submission event.
 * @param {function} onSuccess - Callback function on successful registration.
 * @param {function} onError - Callback function on error.
 */
export async function handleRegister(event, onSuccess, onError) {
    event.preventDefault();
    const form = event.target;
    const firstName = form.firstName.value;
    const lastName = form.lastName.value;
    const email = form.email.value;
    const password = form.password.value;
    const role = form.role.value;
    const registerMessage = document.getElementById('register-message'); // Assumes this ID exists

    if (registerMessage) {
        registerMessage.textContent = 'Attempting registration...';
        registerMessage.className = 'message-area info-message';
    }

    try {
        // Use fetch directly to avoid sending potential auth token
        const response = await fetch(`${API_BASE_URL}/Users/register`, { // Need API_BASE_URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password, role })
        });
        const registrationData = await response.json();

        if (response.ok && registrationData && registrationData.id) {
            if (registerMessage) {
                registerMessage.textContent = 'Registration successful! Please login.';
                registerMessage.className = 'message-area success-message';
            }
            if (onSuccess) onSuccess(); // Call success callback (e.g., redirect to login)
        } else {
            const errorMsg = registrationData?.detail || registrationData?.title || registrationData?.message || 'Registration failed.';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Registration process error:', error);
         if (registerMessage) {
            registerMessage.textContent = `Registration error: ${error.message}`;
            registerMessage.className = 'message-area error-message';
        }
        if (onError) onError(error); // Call error callback
    }
}

/**
 * Handles user logout.
 * @param {function} onLogout - Callback function executed after logout.
 */
export function handleLogout(onLogout) {
    clearAuthData();
    // Cache clearing should ideally happen here or be triggered by an event
    // For now, assume main.js or cache module handles cache clearing on logout event/call
    console.log("User logged out.");
    if (onLogout) onLogout(); // Call the callback (e.g., update nav, redirect)
}

// Need to import API_BASE_URL for direct fetch calls in login/register
// This creates a slight dependency issue. Ideally, login/register would also use fetchData,
// but fetchData needs modification to optionally *not* send the token for these specific public routes.
// For now, we'll duplicate the import.
import { API_BASE_URL } from '../config.js';