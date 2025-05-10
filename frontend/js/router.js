// frontend/js/router.js

// --- STUB/PLACEHOLDER IMPORTS ---
// These will be replaced with actual imports once other files (main.js, page files) are refactored.

// From main.js (or equivalent) - these need to be exported from there
const navigateTo = (pageLoaderFn, args = []) => {
    console.warn(`[Router STUB] navigateTo called for ${pageLoaderFn.name || 'anonymous loader'}. Args:`, args);
    // This is a simplified version of the actual navigateTo from main.js
    // The real navigateTo should handle rendering content.
    if (typeof pageLoaderFn === 'function') {
        try {
            pageLoaderFn(...args);
        } catch (error) {
            console.error(`[Router STUB] Error in pageLoaderFn: ${error}`);
        }
    } else {
        console.error('[Router STUB] pageLoaderFn is not a function in navigateTo');
    }
};
const onLoginSuccess = () => console.warn("[Router STUB] onLoginSuccess callback triggered.");
const onAuthError = (err) => console.warn("[Router STUB] onAuthError callback triggered.", err);
const onRegisterSuccess = () => console.warn("[Router STUB] onRegisterSuccess callback triggered.");

// Placeholder page loading functions (to be imported from their respective files)
const loadHomePageOrDashboard = () => console.warn("[Router STUB] loadHomePageOrDashboard called");
const loadCoursesPage = () => console.warn("[Router STUB] loadCoursesPage called");
const loadCourseDetailPage = (courseId) => console.warn(`[Router STUB] loadCourseDetailPage called with ID: ${courseId}`);
const loadLessonDetailPage = (courseId, lessonId) => console.warn(`[Router STUB] loadLessonDetailPage called for course ${courseId}, lesson ${lessonId}`); // Future
const loadLoginPage = (loginCb, errorCb) => console.warn("[Router STUB] loadLoginPage called");
const loadRegisterPage = (regCb, errorCb) => console.warn("[Router STUB] loadRegisterPage called");
const loadAppropriateDashboard = () => console.warn("[Router STUB] loadAppropriateDashboard called");
const loadStudentDashboard = () => console.warn("[Router STUB] loadStudentDashboard called");
const loadInstructorDashboard = () => console.warn("[Router STUB] loadInstructorDashboard called");
const loadAdminDashboardPage = () => console.warn("[Router STUB] loadAdminDashboardPage called"); // New, for SPA admin view
const loadNotFoundPage = () => console.warn("[Router STUB] loadNotFoundPage called");


// --- ROUTE DEFINITIONS ---
const routes = {
    '/': () => navigateTo(loadHomePageOrDashboard),
    '/courses': () => navigateTo(loadCoursesPage),
    '/courses/:courseId': (params) => navigateTo(loadCourseDetailPage, [params.courseId]),
    '/courses/:courseId/lessons/:lessonId': (params) => navigateTo(loadLessonDetailPage, [params.courseId, params.lessonId]),
    '/login': () => navigateTo(loadLoginPage, [onLoginSuccess, onAuthError]),
    '/register': () => navigateTo(loadRegisterPage, [onRegisterSuccess, onAuthError]),
    '/dashboard': () => navigateTo(loadAppropriateDashboard),
    '/dashboard/student': () => navigateTo(loadStudentDashboard),
    '/dashboard/instructor': () => navigateTo(loadInstructorDashboard),
    '/admin': () => navigateTo(loadAdminDashboardPage),
    // Example for future admin sub-routes:
    // '/admin/users': (params) => navigateTo(loadAdminUsersPage, [params]),
};

function extractParams(routePattern, actualPath) {
    const params = {};
    const routeParts = routePattern.split('/').filter(p => p);
    const actualParts = actualPath.split('/').filter(p => p);

    routeParts.forEach((part, index) => {
        if (part.startsWith(':')) {
            const paramName = part.substring(1);
            if (actualParts[index]) {
                params[paramName] = actualParts[index];
            }
        }
    });
    return params;
}

function resolveRoute() {
    const path = window.location.pathname;
    console.log(`[Router] Resolving route for path: ${path}`);
    let matchedRouteHandler = null;
    let extractedParams = {};

    // Exact matches first
    if (routes[path]) {
        matchedRouteHandler = routes[path];
    } else {
        // Check for parameterized routes
        for (const routePattern in routes) {
            if (routePattern.includes(':')) { // Only check patterns that expect parameters
                const routeParts = routePattern.split('/').filter(p => p);
                const actualParts = path.split('/').filter(p => p);

                if (routeParts.length === actualParts.length) {
                    let isMatch = true;
                    for (let i = 0; i < routeParts.length; i++) {
                        if (!routeParts[i].startsWith(':') && routeParts[i] !== actualParts[i]) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (isMatch) {
                        matchedRouteHandler = routes[routePattern];
                        extractedParams = extractParams(routePattern, path);
                        console.log(`[Router] Matched parameterized route: ${routePattern} with params:`, extractedParams);
                        break;
                    }
                }
            }
        }
    }

    if (matchedRouteHandler) {
        try {
            matchedRouteHandler(extractedParams); // Pass extracted params to the handler
        } catch (error) {
            console.error(`[Router] Error executing route handler for ${path}:`, error);
            // Optionally render a generic error page
            navigateTo(loadNotFoundPage);
        }
    } else {
        console.warn(`[Router] No route found for path: ${path}. Loading default/404 page.`);
        navigateTo(loadNotFoundPage); // Fallback to a 404 page or a default page
    }
}

function navigate(path, replace = false) {
    if (window.location.pathname === path && !replace) {
        console.log(`[Router] Already at path: ${path}. No navigation needed.`);
        return;
    }
    console.log(`[Router] Navigating to: ${path}, replace: ${replace}`);
    if (replace) {
        history.replaceState({ path }, '', path);
    } else {
        history.pushState({ path }, '', path);
    }
    resolveRoute(); // Manually trigger route resolution
}

function initializeRouter() {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("[Router] Initializing router and resolving initial route.");
        resolveRoute(); // Resolve initial route on page load

        // Hijack link clicks to use the router
        document.body.addEventListener('click', event => {
            let targetElement = event.target;
            // Traverse up if the click was on an element inside an <a> tag
            while (targetElement && targetElement.tagName !== 'A') {
                targetElement = targetElement.parentElement;
            }

            if (targetElement && targetElement.tagName === 'A') {
                const href = targetElement.getAttribute('href');
                // Check if it's an internal link (starts with /) and not an external one
                if (href && href.startsWith('/') && !targetElement.hasAttribute('data-external') && !targetElement.hasAttribute('download')) {
                    event.preventDefault(); // Prevent default browser navigation
                    const targetPath = new URL(targetElement.href, window.location.origin).pathname;
                    navigate(targetPath);
                } else if (href && href.startsWith('#') && !targetElement.hasAttribute('data-external')) {
                    // Handle fragment-only links if necessary, or let them behave normally
                    // For now, let them behave normally if they are not caught by SPA routing.
                    // If it's just '#', prevent default to avoid scrolling to top if not intended.
                    if (href === '#') event.preventDefault();
                }
            }
        });

        // Listen to popstate event for browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            console.log("[Router] popstate event triggered. New path:", window.location.pathname, "State:", event.state);
            resolveRoute();
        });
    });
    console.log("[Router] Router event listeners set up.");
}

// Export functions for use in other modules (e.g., main.js)
export { navigate, initializeRouter };