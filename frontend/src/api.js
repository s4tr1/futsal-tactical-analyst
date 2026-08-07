import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: false });

api.interceptors.request.use(config => {
  const t = localStorage.getItem('auth_token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
