import { apiRequest } from "./api";

export type Album = {
    id: string;
    titulo: string;
    artista: string;
    ano: string | null;
    genero: string | null;
    imagem: string | null;
    mediaNota: number | null;
    totalAvaliacoes: number;
    artistaId: string;
    generoId: string | null;
    musicas?: Musica[];
};

export type Musica = {
    id: number;
    titulo: string;
    numeroFaixa: number;
    duracaoSegundos: number | null;
    audioUrl: string | null;
};

export type Artista = {
    id: string;
    nome: string;
    pais: string | null;
    foto: string | null;
    totalAlbuns: number;
    biografia?: string | null;
    albuns?: Album[];
};

export type Categoria = {
    id: string;
    titulo: string;
    albuns: Album[];
};

export type ArtistaIndependenteComAlbuns = {
    id: string;
    nome: string;
    albuns: Album[];
};

export type Genero = {
    id: string;
    nome: string;
};

export type Avaliacao = {
    id: number;
    nota: number;
    comentario: string;
    autor: string;
    criadoEm: string;
};

export const favoritosService = {
    listar(): Promise<Album[]> {
        return apiRequest<Album[]>("/favoritos");
    },

    obterEstado(albumId: string): Promise<{ favorito: boolean }> {
        return apiRequest<{ favorito: boolean }>(
            `/albuns/${encodeURIComponent(albumId)}/favorito`
        );
    },

    adicionar(albumId: string): Promise<{ favorito: boolean }> {
        return apiRequest<{ favorito: boolean }>(
            `/albuns/${encodeURIComponent(albumId)}/favorito`,
            { method: "POST" }
        );
    },

    remover(albumId: string): Promise<{ favorito: boolean }> {
        return apiRequest<{ favorito: boolean }>(
            `/albuns/${encodeURIComponent(albumId)}/favorito`,
            { method: "DELETE" }
        );
    },
};

export const albunsService = {
    listar(busca?: string): Promise<Categoria[]> {
        const query = busca?.trim()
            ? `?busca=${encodeURIComponent(busca.trim())}`
            : "";
        return apiRequest<Categoria[]>(`/albuns${query}`);
    },

    buscarPorId(id: string): Promise<Album> {
        return apiRequest<Album>(`/albuns/${encodeURIComponent(id)}`);
    },

    listarPorGenero(id: string): Promise<{ id: string; nome: string; albuns: Album[] }> {
        return apiRequest(`/generos/${encodeURIComponent(id)}/albuns`);
    },

    listarGeneros(): Promise<Genero[]> {
        return apiRequest<Genero[]>("/generos");
    },

    listarArtistas(busca?: string): Promise<Artista[]> {
        const query = busca?.trim()
            ? `?busca=${encodeURIComponent(busca.trim())}`
            : "";
        return apiRequest<Artista[]>(`/artistas${query}`);
    },

    listarArtistasIndependentes(): Promise<Artista[]> {
        return apiRequest<Artista[]>("/artistas-independentes");
    },

    listarAlbunsIndependentes(): Promise<ArtistaIndependenteComAlbuns[]> {
        return apiRequest<ArtistaIndependenteComAlbuns[]>("/albuns-independentes");
    },

    async cadastrarArtistaIndependente(
        lancamento: {
            nomeArtista: string;
            pais: string;
            biografia: string;
            generoId: string;
            tituloAlbum: string;
            dataLancamento: string;
            capaUrl: string;
        },
        faixas: { titulo: string; arquivo: Blob; nomeArquivo: string }[]
    ): Promise<{ artistaId: string; albumId: string; message: string }> {
        const formulario = new FormData();
        formulario.append(
            "lancamento",
            JSON.stringify({
                ...lancamento,
                faixas: faixas.map((faixa, indice) => ({
                    titulo: faixa.titulo,
                    fieldName: `audio_${indice}`,
                })),
            })
        );
        faixas.forEach((faixa, indice) => {
            formulario.append(`audio_${indice}`, faixa.arquivo, faixa.nomeArquivo);
        });
        return apiRequest("/artistas-independentes", {
            method: "POST",
            body: formulario,
        });
    },

    buscarArtista(id: string): Promise<Artista & { biografia: string | null; albuns: Album[] }> {
        return apiRequest(`/artistas/${encodeURIComponent(id)}`);
    },

    listarAvaliacoes(id: string): Promise<Avaliacao[]> {
        return apiRequest<Avaliacao[]>(
            `/albuns/${encodeURIComponent(id)}/avaliacoes`
        );
    },

    avaliar(
        id: string,
        avaliacao: { nota: number; comentario: string }
    ): Promise<Avaliacao> {
        return apiRequest<Avaliacao>(
            `/albuns/${encodeURIComponent(id)}/avaliacoes`,
            {
                method: "POST",
                body: JSON.stringify(avaliacao),
            }
        );
    },
};
