import axios from 'axios';
import { getAccessToken } from './auth';

export const axiosAuth = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

axiosAuth.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
