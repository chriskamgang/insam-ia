import axios from 'axios';

const api = axios.create({
    baseURL: '',
    headers: { 'Accept': 'application/json' },
});

const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;
