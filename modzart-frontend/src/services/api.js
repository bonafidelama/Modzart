import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true,
    // Add timeout to prevent hanging requests
    timeout: 10000
});

// Safely check if we're in a browser environment before accessing localStorage
const isBrowser = typeof window !== 'undefined';

api.interceptors.request.use((config) => {
    if (isBrowser) {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Add a response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        // Handle network errors more gracefully
        if (error.message === 'Network Error') {
            console.error('Cannot connect to the backend. Please ensure the backend server is running.');
        }
        return Promise.reject(error);
    }
);

export default api;