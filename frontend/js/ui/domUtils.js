// Module for DOM manipulation utilities

// Assume 'app-content' is the main container ID from index.html
const MAIN_CONTENT_ID = 'app-content';

/**
 * Renders the provided HTML string into the main content area.
 * @param {string} html - The HTML string to render.
 */
export function renderContent(html) {
    const appContent = document.getElementById(MAIN_CONTENT_ID);
    if (appContent) {
        appContent.innerHTML = html;
    } else {
        console.error(`Main content container with ID '${MAIN_CONTENT_ID}' not found.`);
    }
}

/**
 * Updates the navigation UI based on the user's login state.
 * @param {object|null} user - The user object (from UserReadDto) or null if logged out.
 * @param {object} callbacks - Object containing callback functions for nav actions 
 *                             (e.g., { loadCourses, loadLogin, loadRegister, loadDashboard, logout })
 */
export function updateNavUI(user, callbacks) {
    const navUl = document.querySelector('header nav ul');
    if (!navUl) {
        console.error("Navigation list 'header nav ul' not found.");
        return;
    }

    navUl.innerHTML = ''; // Clear previous links

    // Always show Courses link
    const coursesLi = createNavItem('Courses', callbacks.loadCourses);
    navUl.appendChild(coursesLi);

    if (user && user.id) { // Logged-in state
        const userName = user.firstName || 'User';

        const dashboardLi = createNavItem('My Dashboard', callbacks.loadDashboard);
        navUl.appendChild(dashboardLi);

        const greetingLi = document.createElement('li');
        greetingLi.id = 'user-greeting';
        greetingLi.textContent = `Welcome, ${userName}!`;
        navUl.appendChild(greetingLi);

        const logoutLi = createNavItem('Logout', callbacks.logout);
        navUl.appendChild(logoutLi);

    } else { // Logged-out state
        const loginLi = createNavItem('Login', callbacks.loadLogin);
        navUl.appendChild(loginLi);

        const registerLi = createNavItem('Register', callbacks.loadRegister);
        navUl.appendChild(registerLi);
    }
}

/**
 * Helper function to create a navigation list item (<li><a>...</a></li>).
 * @param {string} text - The link text.
 * @param {function} onClickAction - The function to call when the link is clicked.
 * @returns {HTMLLIElement} The created list item element.
 */
function createNavItem(text, onClickAction) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#'; // Use hash for SPA-like behavior
    a.textContent = text;
    a.addEventListener('click', (e) => {
        e.preventDefault();
        if (onClickAction) {
            onClickAction();
        }
    });
    li.appendChild(a);
    return li;
}

// You can add more DOM utility functions here as needed
// e.g., functions to create specific elements, show/hide elements, etc.