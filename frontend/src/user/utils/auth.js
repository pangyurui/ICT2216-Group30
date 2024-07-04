// auth.js

import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const getAccessToken = async () => {
    const access_token = localStorage.getItem('access_token');
    if (access_token && !isTokenExpired(access_token)) {
        localStorage.setItem('isLoggedIn', 'true'); // Set isLoggedIn to true
        return access_token;
    } else {
        try {
            const newAccessToken = await refreshToken();
            localStorage.setItem('isLoggedIn', 'true'); // Set isLoggedIn to true
            return newAccessToken;
        } catch (err) {
            console.error('Failed to refresh token:', err);
            clearAuth(); // Clear authentication state on failure
            return null;
        }
    }
};

const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
        return true;
    }
    return false;
};

const refreshToken = async () => {
    // Implement your token refresh logic here
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
        clearAuth();
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post('/api/refresh-token', { refresh_token });
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        return access_token;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        clearAuth();
        throw error;
    }
};

export const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isLoggedIn');
};
