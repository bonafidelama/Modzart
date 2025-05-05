import api from './api';

export const authService = {
    login: (username, password) => 
        api.post('/auth/token', `username=${username}&password=${password}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }),
    register: (userData) => api.post('/users/', userData),
    getCurrentUser: () => api.get('/users/me'),
    updateProfile: (userData) => api.put('/users/me', userData)
};