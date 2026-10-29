import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

function obterApiUrl(): string {
    const urlConfigurada = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    const apiUrl = new URL(urlConfigurada);
    const hostLocal = ["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname);

    if (Platform.OS !== "web" && hostLocal) {
        const hostExpo = Constants.expoConfig?.hostUri;
        if (hostExpo) {
            const hostnameExpo = new URL(`http://${hostExpo}`).hostname;
            if (!["localhost", "127.0.0.1", "[::1]"].includes(hostnameExpo)) {
                apiUrl.hostname = hostnameExpo;
            }
        }
    }

    return apiUrl.toString().replace(/\/+$/, "");
}

const API_URL = obterApiUrl();
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
