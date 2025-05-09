// Module for handling authentication logic (login, register, logout)

// These imports are used by the functions within the NerdAcademy.Auth namespace.
// If this file were a true ES module consumed by other ES modules, these would be at the top.
// For the IIFE pattern, they are effectively "private" to this scope unless exposed.

// import { fetchData } from '../api/apiService.js'; // Will use NerdAcademy.ApiService
// import { decodeJwt, isTokenExpired } from './jwtUtils.js'; // Will use NerdAcademy.jwtUtils
// import { API_BASE_URL } from '../config.js'; // Will use NerdAcademy.Config

window.NerdAcademy = window.NerdAcademy || {};
NerdAcademy.Auth = (function(ApiService, jwtUtils, domUtils, Config) {
    'use strict';

    const AUTH_TOKEN_KEY = Config.jwtKey || 'authToken'; // Use key from config
    const USER_DATA_KEY = 'userData';
    const TOKEN_EXPIRES_KEY = 'tokenExpires';

    function getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    function getCurrentUser() {
        const userDataString = localStorage.getItem(USER_DATA_KEY);
        try {
            return userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            console.error("Error parsing stored user data:", e);
            clearAuthData();
            return null;
        }
    }

    function isLoggedIn() {
        const token = getToken();
        if (!token) return false;
        // Consider adding expiration check using jwtUtils.isTokenExpired(token)
        return !jwtUtils.isTokenExpired(token);
    }

    function clearAuthData() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        // Add cache clearing logic if NerdAcademy.Cache is available
        if (NerdAcademy.Cache && NerdAcademy.Cache.clearAllCaches) {
            NerdAcademy.Cache.clearAllCaches();
            console.log("All app caches cleared on logout.");
        }
    }

    async function handleLogin(event, onSuccess, onError) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        const loginMessage = document.getElementById('login-message');

        if (loginMessage) {
            loginMessage.textContent = 'Attempting login...';
            loginMessage.className = 'message-area info-message';
        }

        try {
            // Login doesn't send an auth token initially, so direct fetch or specialized ApiService call
            const response = await fetch(`${Config.API_BASE_URL}/Users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginData = await response.json();

            if (response.ok && loginData.token) {
                if (loginMessage) loginMessage.textContent = 'Login successful! Fetching user details...';
                localStorage.setItem(AUTH_TOKEN_KEY, loginData.token);
                if (loginData.expires) localStorage.setItem(TOKEN_EXPIRES_KEY, loginData.expires);

                const decodedToken = jwtUtils.decodeJwt(loginData.token);
                if (decodedToken && decodedToken.sub) {
                    const userId = decodedToken.sub;
                    // Now use ApiService.fetchData which will include the new token
                    const userDetails = await ApiService.fetchData(`/Users/${userId}`);
                    if (userDetails && userDetails.id) {
                        // IMPORTANT: Ensure userDetails from API includes the 'role'
                        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userDetails));
                        if (onSuccess) onSuccess(userDetails);
                    } else {
                        throw new Error('Login successful, but failed to fetch user details.');
                    }
                } else {
                    throw new Error('Login successful, but could not decode token to get user ID.');
                }
            } else {
                const errorMsg = loginData?.error || loginData?.detail || loginData?.title || 'Login failed. Please check credentials.';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Login process error:', error);
            if (loginMessage) {
                loginMessage.textContent = `Login error: ${error.message}`;
                loginMessage.className = 'message-area error-message';
            }
            if (onError) onError(error);
        }
    }

    async function handleRegister(event, onSuccess, onError) {
        event.preventDefault();
        const form = event.target;
        const firstName = form.firstName.value;
        const lastName = form.lastName.value;
        const email = form.email.value;
        const password = form.password.value;
        const role = form.role.value; // Assuming role can be selected or is defaulted
        const registerMessage = document.getElementById('register-message');

        if (registerMessage) {
            registerMessage.textContent = 'Attempting registration...';
            registerMessage.className = 'message-area info-message';
        }

        try {
            const response = await fetch(`${Config.API_BASE_URL}/Users/register`, {
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
                if (onSuccess) onSuccess();
            } else {
                const errorMsg = registrationData?.error || registrationData?.detail || registrationData?.title || 'Registration failed.';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Registration process error:', error);
            if (registerMessage) {
                registerMessage.textContent = `Registration error: ${error.message}`;
                registerMessage.className = 'message-area error-message';
            }
            if (onError) onError(error);
        }
    }

    function handleLogout(onLogoutCallback) {
        clearAuthData();
        console.log("User logged out.");
        // Update UI immediately after logout, using default nav callbacks
        handleAuthStatus();
        if (onLogoutCallback) onLogoutCallback();
    }

    /**
     * Updates the application's UI based on the current authentication state.
     * This should be called on page load and after login/logout.
     * @param {object} [customNavCallbacks] - Optional navigation callbacks, typically from main.js for SPA.
     */
    function handleAuthStatus(customNavCallbacks) {
        const user = getCurrentUser(); // This should have the role if fetched correctly
        
        let navCallbacksToUse = customNavCallbacks;

        if (!navCallbacksToUse) {
            // Define default navigation callbacks for non-SPA contexts (e.g., admin.html)
            // or when called internally without specific SPA page loaders.
            navCallbacksToUse = {
                loadCourses: () => { window.location.href = 'index.html#courses-section'; },
                loadLogin: () => { window.location.href = 'index.html#login'; },
                loadRegister: () => { window.location.href = 'index.html#register'; },
                loadDashboard: () => {
                    // Basic dashboard link; specific dashboard logic might be in main.js or index.html context
                    if (user && user.role === 'Instructor') {
                        window.location.href = 'index.html#instructor-dashboard'; // Placeholder
                    } else if (user && user.role === 'Student') {
                        window.location.href = 'index.html#student-dashboard'; // Placeholder
                    } else {
                         window.location.href = 'index.html'; // Fallback to home
                    }
                },
                logout: () => {
                    // This logout is the one from NerdAcademy.Auth itself
                    handleLogout(() => {
                        window.location.href = 'index.html';
                    });
                }
                // Admin dashboard link is handled directly in domUtils.updateNavUI based on user.role
            };
        }
        
        if (domUtils && domUtils.updateNavUI) {
            domUtils.updateNavUI(user, navCallbacksToUse);
        } else {
            console.error("domUtils or domUtils.updateNavUI not available for handleAuthStatus.");
        }
    }


    // Public API for NerdAcademy.Auth
    return {
        getToken,
        getCurrentUser,
        isLoggedIn,
        clearAuthData,
        handleLogin,
        handleRegister,
        handleLogout,
        handleAuthStatus // Expose this crucial function
    };

})(NerdAcademy.ApiService, NerdAcademy.jwtUtils, NerdAcademy.domUtils, NerdAcademy.Config);

// ES6 exports:
// To make functions available for ES6 module import (e.g., in main.js),
// we assign them from the NerdAcademy.Auth namespace to top-level constants, then export those.
const {
    getToken,
    getCurrentUser,
    isLoggedIn,
    clearAuthData,
    handleLogin,
    handleRegister,
    handleLogout,
    handleAuthStatus
} = NerdAcademy.Auth;

export {
    getToken,
    getCurrentUser,
    isLoggedIn,
    clearAuthData,
    handleLogin,
    handleRegister,
    handleLogout,
    handleAuthStatus
};