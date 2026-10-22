import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, SESSION_TOKEN_KEY } from "./api";
import { avisarMudancaSessao } from "./session";

const SESSION_USER_KEY = "sessao.usuario";

export type UsuarioSessao = {
    id: number;
    nome: string;
    username: string;
    email: string;
};

type RespostaAutenticacao = {
    token: string;
    usuario: UsuarioSessao;
};

async function guardarSessao(resposta: RespostaAutenticacao) {
    await AsyncStorage.multiSet([
        [SESSION_TOKEN_KEY, resposta.token],
        [SESSION_USER_KEY, JSON.stringify(resposta.usuario)],
    ]);
    avisarMudancaSessao(resposta.usuario);
    return resposta.usuario;
}

export async function obterUsuarioSessao(): Promise<UsuarioSessao | null> {
    const dados = await AsyncStorage.getItem(SESSION_USER_KEY);
    if (!dados) {
        return null;
    }

    try {
        const usuario: Partial<UsuarioSessao> = JSON.parse(dados);
        if (
            typeof usuario.id !== "number" ||
            typeof usuario.nome !== "string" ||
            typeof usuario.email !== "string"
        ) {
            throw new Error("Dados de sessão inválidos.");
        }
        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            username:
                typeof usuario.username === "string"
                    ? usuario.username
                    : usuario.email.split("@")[0].slice(0, 30),
        };
    } catch {
        await AsyncStorage.multiRemove([SESSION_USER_KEY, SESSION_TOKEN_KEY]);
        return null;
    }
}

export const authService = {
    async cadastrar(dados: {
        nome: string;
        username: string;
        email: string;
        senha: string;
    }): Promise<UsuarioSessao> {
        const resposta = await apiRequest<RespostaAutenticacao>(
            "/auth/registro",
            {
                method: "POST",
                body: JSON.stringify(dados),
            }
        );
        return guardarSessao(resposta);
    },

    async perfil(): Promise<UsuarioSessao> {
        const usuario = await apiRequest<UsuarioSessao>("/auth/perfil");
        await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(usuario));
        avisarMudancaSessao(usuario);
        return usuario;
    },

    async atualizarPerfil(dados: {
        nome: string;
        username: string;
        email: string;
        senhaAtual?: string;
        novaSenha?: string;
    }): Promise<UsuarioSessao> {
        const usuario = await apiRequest<UsuarioSessao>("/auth/perfil", {
            method: "PUT",
            body: JSON.stringify(dados),
        });
        await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(usuario));
        avisarMudancaSessao(usuario);
        return usuario;
    },

    async entrar(dados: {
        email: string;
        senha: string;
    }): Promise<UsuarioSessao> {
        const resposta = await apiRequest<RespostaAutenticacao>("/auth/login", {
            method: "POST",
            body: JSON.stringify(dados),
        });
        return guardarSessao(resposta);
    },

    async sair(): Promise<void> {
        await AsyncStorage.multiRemove([SESSION_USER_KEY, SESSION_TOKEN_KEY]);
        avisarMudancaSessao(null);
    },
};
