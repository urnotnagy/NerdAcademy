// frontend/js/router.js

// --- STUB/PLACEHOLDER IMPORTS ---
// These will be replaced with actual imports once other files (main.js, page files) are refactored.

// From main.js (or equivalent) - these need to be exported from there
// Actual navigateTo function to load page content
async function loadPage(htmlPath, jsInitFunction, ...args) {
    const appContent = document.getElementById('app-content');
    if (!appContent) {
        console.error('Main content area #app-content not found.');
        return;
    }
    try {
        const response = await fetch(htmlPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        appContent.innerHTML = html;
        if (jsInitFunction && typeof jsInitFunction === 'function') {
            jsInitFunction(...args);
        }
    } catch (error) {
        console.error(`Error loading page ${htmlPath}:`, error);
        appContent.innerHTML = '<p>Error loading page content. Please try again later.</p>';
    }
}

const navigateTo = (pageLoaderFn, args = []) => {
    console.log(`[Router] navigateTo called for ${pageLoaderFn.name || 'anonymous loader'}. Args:`, args);
    if (typeof pageLoaderFn === 'function') {
        try {
            pageLoaderFn(...args);
        } catch (error) {
            console.error(`[Router] Error in pageLoaderFn: ${error}`);
        }
    } else {
        console.error('[Router] pageLoaderFn is not a function in navigateTo');
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

// Actual implementation for loading admin enrollments page
const loadAdminEnrollmentsPage = async () => {
    try {
        // Dynamically import the init function from adminEnrollments.js
        const { init: initAdminEnrollments } = await import('./pages/adminEnrollments.js');
        await loadPage('admin-enrollments.html', initAdminEnrollments);
    } catch (error) {
        console.error('Failed to load admin enrollments page or its script:', error);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = '<p>Error loading admin enrollments page. Please try again later.</p>';
        }
    }
};

// Actual implementation for loading admin course-specific enrollments page
const loadAdminCourseEnrollmentsPage = async (params) => {
    try {
        const { init: initAdminCourseEnrollments } = await import('./pages/adminCourseEnrollments.js');
        await loadPage('admin-course-enrollments.html', () => initAdminCourseEnrollments(params));
    } catch (error) {
        console.error('Failed to load admin course enrollments page or its script:', error);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = '<p>Error loading admin course enrollments page. Please try again later.</p>';
        }
    }
};

const loadNotFoundPage = () => {
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = '<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>';
    }
    console.warn("[Router] loadNotFoundPage called");
};


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
    '/admin/enrollments': () => navigateTo(loadAdminEnrollmentsPage),
    '/admin/courses/:courseId/enrollments': (params) => navigateTo(loadAdminCourseEnrollmentsPage, [params]),
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
    // Use location.hash for SPA routing if present, otherwise fallback to pathname
    let path = window.location.hash.substring(1); // Remove #
    if (!path || path === '/') { // if hash is empty or just '#/' or '#', use pathname for root or direct access
        path = window.location.pathname;
    }
    // Ensure path starts with a / if it's not empty
    if (path && !path.startsWith('/')) {
        path = '/' + path;
    }


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
            navigateTo(loadNotFoundPage);
        }
    } else {
        console.warn(`[Router] No route found for path: ${path}. Loading default/404 page.`);
        navigateTo(loadNotFoundPage);
    }
}

function navigate(path, replace = false) {
    const currentHashPath = window.location.hash.substring(1);
    const targetPath = path.startsWith('/') ? path : '/' + path; // Ensure path starts with /

    if (currentHashPath === targetPath && !replace) {
        console.log(`[Router] Already at hash path: ${targetPath}. No navigation needed.`);
        return;
    }
    console.log(`[Router] Navigating to hash path: ${targetPath}, replace: ${replace}`);

    if (replace) {
        history.replaceState({ path: targetPath }, '', '#' + targetPath);
    } else {
        history.pushState({ path: targetPath }, '', '#' + targetPath);
    }
    resolveRoute(); // Manually trigger route resolution
}

function initializeRouter() {
    // This function is now called by main.js AFTER its DOMContentLoaded has fired.
    // So, we can directly execute its logic without an additional DOMContentLoaded listener.
    console.log("[Router] Initializing router and resolving initial route.");
    resolveRoute(); // Resolve initial route on page load (hash or path based)

    // Hijack link clicks to use the router
    document.body.addEventListener('click', event => {
        let targetElement = event.target;
        while (targetElement && targetElement.tagName !== 'A') {
            targetElement = targetElement.parentElement;
        }

        if (targetElement && targetElement.tagName === 'A') {
            const href = targetElement.getAttribute('href');
            if (href && !targetElement.hasAttribute('data-external') && !targetElement.hasAttribute('download')) {
                if (href.startsWith('#/')) { // SPA hash link
                    event.preventDefault();
                    const targetPath = href.substring(1); // Remove #
                    navigate(targetPath);
                } else if (href.startsWith('/')) { // Internal path link (less common for this setup now)
                    event.preventDefault();
                    navigate(href);
                } else if (href === '#') { // Link to top of page
                    event.preventDefault();
                }
                // External links or other special links will behave normally
            }
        }
    });

    // Listen to popstate event for browser back/forward navigation (handles hash changes)
    window.addEventListener('popstate', (event) => {
        console.log("[Router] popstate event triggered. New hash:", window.location.hash, "State:", event.state);
        resolveRoute();
    });

    // Also listen to hashchange for direct hash modifications or older browser compatibility
    window.addEventListener('hashchange', () => {
        console.log("[Router] hashchange event triggered. New hash:", window.location.hash);
        resolveRoute();
    });
    console.log("[Router] Router event listeners set up.");
}

// Export functions for use in other modules (e.g., main.js)
export { navigate, initializeRouter, loadPage }; // Export loadPage if it's to be used elsewhere