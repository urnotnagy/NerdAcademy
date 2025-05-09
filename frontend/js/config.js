// Configuration for the NerdAcademy frontend

// For ES6 module consumption
const API_BASE_URL_CONST = 'https://localhost:7118/api'; // Updated to match the URL from the error log
const JWT_KEY_CONST = 'authToken'; // Key for storing JWT in localStorage

// For global namespace consumption (IIFEs)
window.NerdAcademy = window.NerdAcademy || {};
window.NerdAcademy.Config = {
    API_BASE_URL: API_BASE_URL_CONST,
    jwtKey: JWT_KEY_CONST
};

// You can add other configuration variables here if needed
// For example, if you had different environments:
// const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://api.nerdacademy.com/api' : 'https://localhost:7118/api';