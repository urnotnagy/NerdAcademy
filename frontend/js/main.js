// Main application entry point

import { fetchData } from './api/apiService.js'; // IIFE populates NerdAcademy.ApiService
import { decodeJwt, isTokenExpired } from './auth/jwtUtils.js'; // IIFE populates NerdAcademy.jwtUtils
import { renderContent } from './ui/domUtils.js'; // IIFE populates NerdAcademy.domUtils. Import before auth.js
// Import handleAuthStatus as well
import { getCurrentUser, isLoggedIn, handleLogout, clearAuthData, handleAuthStatus } from './auth/auth.js'; // IIFE depends on the above
import * as Cache from './state/cache.js';
import { initializeRouter } from './router.js'; // Import the router initializer
import { loadLoginPage, loadRegisterPage } from './pages/authPages.js';
import { loadCoursesPage, loadCourseDetailPage } from './pages/courses.js';
import { loadStudentDashboard } from './pages/studentDashboard.js';
import { loadInstructorDashboard } from './pages/instructorDashboard.js';

// --- Application State & Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing app...");
    initializeApp();
});

function initializeApp() {
    // Initial UI setup
    setupNavigation();
    initializeRouter(); // Initialize the SPA router
    checkInitialAuthStatus(); // Check auth status AFTER router is ready to handle potential hash
}

// --- Navigation & Routing ---

function setupNavigation() {
    // updateNavUI will handle attaching listeners dynamically.
    // We just need to ensure it's called initially and after login/logout.
}

function navigateTo(pageLoaderFn, args = []) {
     // Simple SPA navigation: clear content, load new page
     // In a real app, might use History API (pushState/popstate) for proper routing
     console.log(`Navigating to ${pageLoaderFn.name}...`);
     try {
        pageLoaderFn(...args); // Call the appropriate page loading function
     } catch (error) {
         console.error(`Error loading page ${pageLoaderFn.name}:`, error);
         renderContent(`<p class="error">Error loading page. Please try again.</p>`);
     }
}

// Define callbacks for navigation actions used by updateNavUI
const navCallbacks = {
    loadCourses: () => navigateTo(loadCoursesPage),
    loadLogin: () => navigateTo(loadLoginPage, [onLoginSuccess, onAuthError]), // Pass callbacks
    loadRegister: () => navigateTo(loadRegisterPage, [onRegisterSuccess, onAuthError]), // Pass callbacks
    loadDashboard: () => {
        const user = getCurrentUser();
        if (user?.role === 'Instructor') {
            navigateTo(loadInstructorDashboard);
        } else if (user?.role === 'Student') {
            navigateTo(loadStudentDashboard);
        } else {
            console.warn("Dashboard clicked, but role unknown or user not logged in.");
            navigateTo(loadCoursesPage); // Fallback
        }
    },
    logout: () => {
        // handleLogout needs the onLogout callback
        handleLogout(onLogoutSuccess);
    }
};

// --- Authentication Callbacks ---

function onLoginSuccess(userDetails) {
    console.log("Login successful, user details fetched:", userDetails);
    handleAuthStatus(navCallbacks); // Use centralized auth status handler
    // Decide where to navigate after login (e.g., dashboard or courses)
    if (userDetails.role === 'Instructor') {
        navigateTo(loadInstructorDashboard);
    } else if (userDetails.role === 'Student') {
        navigateTo(loadStudentDashboard);
    } else {
        navigateTo(loadCoursesPage);
    }
}

function onRegisterSuccess() {
    console.log("Registration successful.");
    // Redirect to login page after successful registration
    navigateTo(loadLoginPage, [onLoginSuccess, onAuthError]); 
}

function onLogoutSuccess() {
    console.log("Logout successful callback triggered.");
    Cache.clearAllCaches(); // Clear caches on logout
    handleAuthStatus(navCallbacks); // Use centralized auth status handler
    navigateTo(loadLoginPage, [onLoginSuccess, onAuthError]); // Redirect to login page
}

function onAuthError(error) {
    // Central place to handle auth errors if needed, 
    // though specific messages are shown by handleLogin/handleRegister
    console.error("Authentication error:", error.message);
    // Maybe show a generic error message in a dedicated area?
}


// --- Initial Auth Check ---

async function checkInitialAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = getCurrentUser(); // Tries to parse stored user data

    if (token && user && !isTokenExpired(token)) {
        console.log("User is logged in from previous session.");
        handleAuthStatus(navCallbacks); // Use centralized auth status handler

        // Pre-fetch student enrollments if applicable
        if (user.role === 'Student') {
            try {
                const allEnrollments = await fetchData('/Enrollments');
                if (allEnrollments && Array.isArray(allEnrollments)) {
                    Cache.setStudentEnrollmentsCache(allEnrollments.filter(e => e.studentId === user.id));
                } else {
                    Cache.setStudentEnrollmentsCache([]);
                }
            } catch (error) {
                 console.error("Error pre-fetching student enrollments on initial load:", error);
                 Cache.setStudentEnrollmentsCache([]);
            }
        }
        // If there's a hash, the router's resolveRoute (called during initializeRouter)
        // should handle it. Otherwise, load default for logged-in user.
        if (!window.location.hash || window.location.hash === "#") {
            navCallbacks.loadDashboard(); // Go to appropriate dashboard
        }
        // If hash exists, router.js's resolveRoute will take over.

    } else {
        console.log("User is not logged in or session expired.");
        if (token) { // If token exists but user data is bad or token expired
            clearAuthData(); // Clean up inconsistent state
        }
        handleAuthStatus(navCallbacks); // Use centralized auth status handler
        
        // If there's a hash, let the router try to handle it (e.g. public course detail page)
        // Otherwise, load default public page.
        if (!window.location.hash || window.location.hash === "#") {
            navigateTo(loadCoursesPage); // Load default public page
        }
        // If hash exists, router.js's resolveRoute will take over.
    }
}