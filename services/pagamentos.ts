import { apiRequest } from "./api";

export type EstadoApoioArtista = {
    independente: boolean;
    contaVinculada: boolean;
    souProprietario: boolean;
    pagamentosConfigurados: boolean;
    pixConfigurado: boolean;
};

export type DadosPix = {
    payload: string;
    receiverName: string;
};

export type ApoioArtista = {
    referencia: string;
    artista: string;
    valor: number;
    status: string;
    statusDetalhe: string | null;
    criadoEm: string;
};

export const pagamentosService = {
    obterPix(): Promise<DadosPix> {
        return apiRequest("/pix");
    },

    obterEstadoArtista(id: string): Promise<EstadoApoioArtista> {
        return apiRequest(`/artistas/${encodeURIComponent(id)}/apoio`);
    },

    iniciarVinculo(id: string): Promise<{ url: string }> {
        return apiRequest(`/artistas/${encodeURIComponent(id)}/pagamentos/conectar`, {
            method: "POST",
        });
    },

    criarApoio(
        id: string,
        valor: number
    ): Promise<{ referencia: string; checkoutUrl: string }> {
        return apiRequest(`/artistas/${encodeURIComponent(id)}/apoios`, {
            method: "POST",
            body: JSON.stringify({ valor }),
        });
    },

    obterApoio(referencia: string): Promise<ApoioArtista> {
        return apiRequest(`/apoios/${encodeURIComponent(referencia)}`);
    },
};
