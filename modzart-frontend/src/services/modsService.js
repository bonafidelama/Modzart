import api from './api';

export const modsService = {
    list: (params = '', options = {}) => {
        // If it's already a query string like "user_id=123", use it directly
        // If it's just a search term, format it as a search parameter
        const queryString = params.includes('=') ? params : `search=${params}`;
        return api.get(`/mods/?${queryString}`, options);
    },
    get: (id, options = {}) => api.get(`/mods/${id}`, options),
    getById: (id, options = {}) => api.get(`/mods/${id}`, options),
    create: (formData, options = {}) => api.post('/mods/', formData, options),
    createProject: (projectData, options = {}) => api.post('/mods/project', projectData, options),
    updateProject: (projectData, options = {}) => api.put(`/mods/${projectData.id}`, projectData, options),
    download: (id, options = {}) => api.get(`/mods/${id}/download`, options),
    downloadMod: (id, options = {}) => api.get(`/mods/${id}/download`, options),
    
    // New methods for project-publish page
    uploadVersion: (projectId, versionData, options = {}) => {
        const formData = new FormData();
        if (versionData.file) formData.append('file', versionData.file);
        formData.append('version_number', versionData.version_number);
        formData.append('changelog', versionData.changelog);
        
        return api.post(`/mods/${projectId}/versions`, formData, {
            ...options,
            headers: {
                ...options?.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    getVersions: (projectId, options = {}) => api.get(`/mods/${projectId}/versions`, options),
    
    uploadIcon: (projectId, iconFile, options = {}) => {
        const formData = new FormData();
        formData.append('icon', iconFile);
        
        return api.post(`/mods/${projectId}/icon`, formData, {
            ...options,
            headers: {
                ...options?.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    uploadGalleryImage: (projectId, imageFile, options = {}) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        return api.post(`/mods/${projectId}/gallery`, formData, {
            ...options,
            headers: {
                ...options?.headers,
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    getGalleryImages: (projectId, options = {}) => api.get(`/mods/${projectId}/gallery`, options),
    
    deleteGalleryImage: (projectId, imageId, options = {}) => 
        api.delete(`/mods/${projectId}/gallery/${imageId}`, options),
    
    updateExternalLinks: (projectId, links, options = {}) => 
        api.put(`/mods/${projectId}/links`, { links }, options),
    
    submitForReview: (projectId, options = {}) => 
        api.post(`/mods/${projectId}/submit-review`, {}, options)
};