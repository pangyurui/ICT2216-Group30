import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const getAccessToken = async () => {
    const access_token = localStorage.getItem('access_token');
    if (access_token && !isTokenExpired(access_token)) {
        localStorage.setItem('isLoggedIn', 'true');
        return access_token;
    } else {
        try {
            const newAccessToken = await refreshToken();
            localStorage.setItem('isLoggedIn', 'true');
            return newAccessToken;
        } catch (err) {
            clearAuth();
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
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
        clearAuth();
    }

    try {
        const response = await axios.post('https://ict2216group30.store/api/token/refresh/', { refresh_token });
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        return access_token;
    } catch (error) {
        clearAuth();
    }
};

export const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isLoggedIn');
};
