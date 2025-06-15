// Module for JWT related utility functions

/**
 * Basic JWT decoder to get the payload.
 * WARNING: This does NOT validate the signature or expiration. 
 * It's only for extracting claims client-side after the server has validated the token.
 * @param {string} token - The JWT string.
 * @returns {object|null} - The parsed payload object or null on error.
 */
export function decodeJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null; // Check if token has payload part

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
}

/**
 * Checks if a JWT token is expired or close to expiring.
 * @param {string} token - The JWT string.
 * @param {number} [thresholdSeconds=60] - Seconds before actual expiry to consider it expired.
 * @returns {boolean} - True if expired or within threshold, false otherwise.
 */
export function isTokenExpired(token, thresholdSeconds = 60) {
    const payload = decodeJwt(token);
    if (!payload || typeof payload.exp !== 'number') {
        return true; // Cannot determine expiry, assume expired/invalid
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < (nowInSeconds + thresholdSeconds);
}

// --- Start of NerdAcademy.jwtUtils namespace population ---
window.NerdAcademy = window.NerdAcademy || {};
window.NerdAcademy.jwtUtils = {
    decodeJwt, //: decodeJwt, // if function name was different
    isTokenExpired //: isTokenExpired
};
// --- End of NerdAcademy.jwtUtils namespace population ---