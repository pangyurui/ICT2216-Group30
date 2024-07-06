import axios from 'axios';
import { getAccessToken } from './auth';

export const axiosAuth = axios.create({
    baseURL: 'https://ict2216group30.store/api/',
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
