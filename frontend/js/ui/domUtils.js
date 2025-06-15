// Module for DOM manipulation utilities

window.NerdAcademy = window.NerdAcademy || {};
window.NerdAcademy.domUtils = (function() {
    'use strict';

    // Assume 'app-content' is the main container ID from index.html for some functions
    const MAIN_CONTENT_ID = 'app-content';

    /**
     * Renders the provided HTML string into the main content area.
     * @param {string} html - The HTML string to render.
     */
    function renderContent(html) {
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
    function updateNavUI(user, callbacks) {
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
 
            // Only add "My Dashboard" if the user is NOT an Admin
            if (user.role !== 'Admin') {
                const dashboardLi = createNavItem('My Dashboard', callbacks.loadDashboard);
                navUl.appendChild(dashboardLi);
            }
            
            // Check for Admin role to add Admin Dashboard link
            if (user.role === 'Admin') { // Assuming role is part of the user object passed to updateNavUI
                const adminDashboardLi = createNavItem('Admin Dashboard', () => {
                    window.location.href = 'admin.html'; // Direct navigation
                });
                navUl.appendChild(adminDashboardLi);
            }


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
        a.href = '#'; // Use hash for SPA-like behavior or actual hrefs
        if (text === 'Admin Dashboard') a.href = 'admin.html'; // Specific for admin link

        a.textContent = text;
        a.addEventListener('click', (e) => {
            if (a.href === '#' || a.href.endsWith('#')) e.preventDefault(); // Prevent default for SPA links
            if (onClickAction) {
                onClickAction();
            }
        });
        li.appendChild(a);
        return li;
    }

    /**
     * Displays an error message in a specified container.
     * @param {string} message - The error message to display.
     * @param {HTMLElement} containerElement - The HTML element where the error should be shown.
     *                                        If null, logs to console.
     */
    function displayError(message, containerElement) {
        if (containerElement) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message'; // Add a class for styling
            errorDiv.textContent = message;
            // Clear previous errors in this specific container or prepend/append
            containerElement.innerHTML = ''; // Simple clear, adjust as needed
            containerElement.appendChild(errorDiv);
        } else {
            console.error('Error Display: Container not provided. Message:', message);
        }
    }

    /**
     * Creates a button element with specified text, click handler, and optional classes.
     * @param {string} text - The button text.
     * @param {function} onClickHandler - The function to execute on button click.
     * @param {string|string[]} [cssClasses] - Optional CSS class(es) to add.
     * @returns {HTMLButtonElement} The created button element.
     */
    function createButton(text, onClickHandler, cssClasses = []) {
        const button = document.createElement('button');
        button.textContent = text;
        if (onClickHandler) {
            button.addEventListener('click', onClickHandler);
        }
        if (typeof cssClasses === 'string') {
            button.classList.add(cssClasses);
        } else if (Array.isArray(cssClasses)) {
            cssClasses.forEach(cls => button.classList.add(cls));
        }
        return button;
    }

    /**
     * Displays a toast message.
     * @param {string} message - The message to display.
     * @param {'success'|'error'|'info'} type - The type of toast.
     * @param {number} duration - How long the toast should be visible (in ms).
     */
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger reflow to enable CSS transition
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);
                }
                if (toastContainer.children.length === 0 && document.body.contains(toastContainer)) {
                    document.body.removeChild(toastContainer);
                }
            }, 500); // Matches CSS transition time
        }, duration);
    }

    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    return {
        renderContent,
        updateNavUI,
        createNavItem, // Expose if needed externally, though it's a helper for updateNavUI
        displayError,
        createButton,
        showToast // Expose showToast
    };
})();

// ES6 Exports (can co-exist for future module system adoption)
export function renderContent(html) {
    NerdAcademy.domUtils.renderContent(html);
}
export function updateNavUI(user, callbacks) {
    NerdAcademy.domUtils.updateNavUI(user, callbacks);
}
export function displayError(message, containerElement) {
    NerdAcademy.domUtils.displayError(message, containerElement);
}
export function createButton(text, onClickHandler, cssClasses = []) {
    return NerdAcademy.domUtils.createButton(text, onClickHandler, cssClasses);
}
export function showToast(message, type = 'info', duration = 3000) {
    NerdAcademy.domUtils.showToast(message, type, duration);
}