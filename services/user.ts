import { apiRequest } from "./api";

export interface Usuario {
    id?: number | string;
    nome: string;
    email: string;
    senha?: string;
    avatarUrl?: string;
    telefone?: string;
    criadoEm?: string;
}

export const userService = {
    async listarTodos(): Promise<Usuario[]> {
        return apiRequest<Usuario[]>("/users", { method: "GET" });
    },

    async buscarPorId(id: number | string): Promise<Usuario> {
        return apiRequest<Usuario>(`/users/${id}`, { method: "GET" });
    },

    async criar(usuario: Omit<Usuario, "id">): Promise<Usuario> {
        return apiRequest<Usuario>("/users", {
            method: "POST",
            body: JSON.stringify(usuario),
        });
    },

    async atualizar(id: number | string, usuario: Partial<Usuario>): Promise<Usuario> {
        return apiRequest<Usuario>(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(usuario),
        });
    },

    async deletar(id: number | string): Promise<{ success: boolean; message?: string } | void> {
        return apiRequest(`/users/${id}`, { method: "DELETE" });
    },
};

export default userService;
