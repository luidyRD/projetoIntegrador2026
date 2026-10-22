import { apiRequest } from "./api";

export interface Produto {
    id?: number | string;
    nome: string;
    preco: number;
    descricao?: string;
    categoria?: string;
    imagemUrl?: string;
    estoque?: number;
    criadoEm?: string;
}

export const produtosService = {
    async listarTodos(): Promise<Produto[]> {
        return apiRequest<Produto[]>("/produtos", { method: "GET" });
    },

    async buscarPorId(id: number | string): Promise<Produto> {
        return apiRequest<Produto>(`/produtos/${id}`, { method: "GET" });
    },

    async criar(produto: Omit<Produto, "id">): Promise<Produto> {
        return apiRequest<Produto>("/produtos", {
            method: "POST",
            body: JSON.stringify(produto),
        });
    },

    async atualizar(id: number | string, produto: Partial<Produto>): Promise<Produto> {
        return apiRequest<Produto>(`/produtos/${id}`, {
            method: "PUT",
            body: JSON.stringify(produto),
        });
    },

    async deletar(id: number | string): Promise<{ success: boolean; message?: string } | void> {
        return apiRequest(`/produtos/${id}`, { method: "DELETE" });
    },
};

export default produtosService;
