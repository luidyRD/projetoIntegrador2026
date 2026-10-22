import type { UsuarioSessao } from "./auth";

type Listener = (usuario: UsuarioSessao | null) => void;

const listeners = new Set<Listener>();

export function avisarMudancaSessao(usuario: UsuarioSessao | null): void {
    listeners.forEach((listener) => listener(usuario));
}

export function observarSessao(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
