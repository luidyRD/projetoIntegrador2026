import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = (
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");
const SESSION_TOKEN_KEY = "sessao.token";

type ApiErrorResponse = {
    message?: string;
};

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    const headers = new Headers(options.headers);
    if (
        options.body !== undefined &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch {
        throw new Error(
            `Não foi possível conectar à API em ${API_URL}. Confira se o backend está rodando e se o endereço está correto para este dispositivo.`
        );
    }

    if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
            const errorBody = (await response.json()) as ApiErrorResponse;
            if (errorBody.message) {
                errorMessage = errorBody.message;
            }
        } catch {
            errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export { API_URL, SESSION_TOKEN_KEY };
