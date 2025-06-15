// Module for rendering Login and Register page UI

import { renderContent } from '../ui/domUtils.js';
import { handleLogin, handleRegister } from '../auth/auth.js'; // Need handlers for form submission

/**
 * Renders the Login page form.
 * Attaches the handleLogin event listener.
 * @param {function} onLoginSuccess - Callback function when login succeeds.
 * @param {function} onLoginError - Callback function when login fails.
 */
export function loadLoginPage(onLoginSuccess, onLoginError) {
    const loginHtml = `
        <h2>Login</h2>
        <form id="login-form">
            <div><label for="login-email">Email:</label><input type="email" id="login-email" name="email" required></div>
            <div><label for="login-password">Password:</label><input type="password" id="login-password" name="password" required></div>
            <button type="submit">Login</button>
        </form>
        <div id="login-message" class="message-area"></div>
    `;
    renderContent(loginHtml);
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => handleLogin(event, onLoginSuccess, onLoginError));
    } else {
        console.error("Login form not found after rendering.");
    }
}

/**
 * Renders the Register page form.
 * Attaches the handleRegister event listener.
 * @param {function} onRegisterSuccess - Callback function when registration succeeds.
 * @param {function} onRegisterError - Callback function when registration fails.
 */
export function loadRegisterPage(onRegisterSuccess, onRegisterError) {
    const registerHtml = `
        <h2>Register</h2>
        <form id="register-form">
            <div><label for="register-firstname">First Name:</label><input type="text" id="register-firstname" name="firstName" required></div>
            <div><label for="register-lastname">Last Name:</label><input type="text" id="register-lastname" name="lastName" required></div>
            <div><label for="register-email">Email:</label><input type="email" id="register-email" name="email" required></div>
            <div><label for="register-password">Password:</label><input type="password" id="register-password" name="password" required></div>
            <div>
                <label for="register-role">Role:</label>
                <select id="register-role" name="role">
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                </select>
            </div>
            <button type="submit">Register</button>
        </form>
        <div id="register-message" class="message-area"></div>
    `;
    renderContent(registerHtml);

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => handleRegister(event, onRegisterSuccess, onRegisterError));
    } else {
        console.error("Register form not found after rendering.");
    }
}