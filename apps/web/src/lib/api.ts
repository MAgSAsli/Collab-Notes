import axios from "axios";

const api = axios.create({
  baseURL: "",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const storage = localStorage.getItem("auth-storage");
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

export default api;
