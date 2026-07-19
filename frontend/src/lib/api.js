import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("arikosk_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default client;

export const publicApi = {
    listCategories: () => client.get("/menu/categories").then((r) => r.data),
    listItems: () => client.get("/menu/items").then((r) => r.data),
};

export const authApi = {
    login: (email, password) =>
        client.post("/auth/login", { email, password }).then((r) => r.data),
    me: () => client.get("/auth/me").then((r) => r.data),
    logout: () => client.post("/auth/logout").then((r) => r.data),
};

export const adminApi = {
    list: () => client.get("/admin/menu/items").then((r) => r.data),
    create: (payload) =>
        client.post("/admin/menu/items", payload).then((r) => r.data),
    update: (id, payload) =>
        client.put(`/admin/menu/items/${id}`, payload).then((r) => r.data),
    remove: (id) =>
        client.delete(`/admin/menu/items/${id}`).then((r) => r.data),
};
