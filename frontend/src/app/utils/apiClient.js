import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9000/api/v1/";

const api = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: {
        // "Content-Type": "application/json", // Removed to allow auto-detection for FormData
    },
});

const getUserToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
};

const getAdminToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("atoken");
};

api.interceptors.request.use(
    (config) => {
        const useAdminToken = config?.meta?.auth === "admin";
        const useUserToken = config?.meta?.auth === "user";

        if (useAdminToken) {
            const token = getAdminToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        if (useUserToken) {
            const token = getUserToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestMeta = error?.config?.meta;
        const skipAuthRedirect = requestMeta?.skipAuthRedirect === true;

        if (status === 401 && typeof window !== "undefined" && !skipAuthRedirect) {
            const isAdminRequest = requestMeta?.auth === "admin";
            const isUserRequest = requestMeta?.auth === "user";

            if (isAdminRequest) {
                localStorage.removeItem("atoken");
                if (window.location.pathname.startsWith("/admin")) {
                    window.location.href = "/admin/";
                }
            }

            if (isUserRequest) {
                localStorage.removeItem("token");
                const protectedUserRoutes = ["/my-profile", "/giveaway/"];
                if (protectedUserRoutes.some((route) => window.location.pathname.startsWith(route))) {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
