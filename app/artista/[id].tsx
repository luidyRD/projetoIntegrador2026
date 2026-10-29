import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
} from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import AlbumLista from "../../components/AlbumLista";
import { Album, Artista, albunsService } from "../../services/albuns";
import { EstadoApoioArtista, pagamentosService } from "../../services/pagamentos";

type ArtistaDetalhe = Artista & { biografia: string | null; albuns: Album[] };

export default function ArtistaDetalhePage() {
    const { id } = useLocalSearchParams<{ id: string | string[] }>();
    const artistaId = Array.isArray(id) ? id[0] : id;
    const [artista, setArtista] = useState<ArtistaDetalhe | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [estadoApoio, setEstadoApoio] = useState<EstadoApoioArtista | null>(null);
    const [feedbackApoio, setFeedbackApoio] = useState("");

    useEffect(() => {
        let ativo = true;
        if (!artistaId) {
            setErro("Artista inválido.");
            setCarregando(false);
            return;
        }
        albunsService.buscarArtista(artistaId)
            .then((resultado) => {
                if (ativo) setArtista(resultado);
            })
            .catch((error: unknown) => {
                if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar o artista.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [artistaId]);

    useFocusEffect(useCallback(() => {
        if (!artistaId) return undefined;
        let ativo = true;
        pagamentosService.obterEstadoArtista(artistaId)
            .then((estado) => {
                if (!ativo) return;
                setEstadoApoio(estado);
                setFeedbackApoio("");
            })
            .catch((error: unknown) => {
                if (ativo) {
                    setFeedbackApoio(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar as opções de apoio."
                    );
                }
            });
        return () => {
            ativo = false;
        };
    }, [artistaId]));

    const abrirSpotify = async () => {
        if (!artista?.spotifyUrl) return;
        try {
            const url = new URL(artista.spotifyUrl);
            if (
                url.protocol !== "https:" ||
                url.hostname !== "open.spotify.com" ||
                !/^\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?artist\/[^/]+\/?$/i.test(url.pathname)
            ) {
                throw new Error("invalid Spotify URL");
            }
            await Linking.openURL(url.toString());
        } catch {
            Alert.alert("Spotify", "Não foi possível abrir o perfil do artista no Spotify.");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
            <Stack.Screen options={{ title: artista?.nome || "Artista" }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
            ) : artista ? (
                <>
                    {artista.foto ? (
                        <Image source={{ uri: artista.foto }} style={styles.foto} />
                    ) : null}
                    <Text style={styles.titulo}>{artista.nome}</Text>
                    {artista.pais ? <Text style={styles.pais}>{artista.pais}</Text> : null}
                    {artista.biografia ? <Text style={styles.bio}>{artista.biografia}</Text> : null}
                    {artista.spotifyUrl ? (
                        <Pressable
                            style={styles.botaoSpotify}
                            onPress={() => void abrirSpotify()}
                            accessibilityRole="button"
                        >
                            <Text style={styles.textoBotaoSpotify}>Ouvir no Spotify</Text>
                        </Pressable>
                    ) : null}
                    {feedbackApoio && !estadoApoio?.independente ? (
                        <Text style={styles.erroApoio}>{feedbackApoio}</Text>
                    ) : null}
                    <Text style={styles.subtitulo}>Álbuns ({artista.albuns.length})</Text>
                    <AlbumLista albuns={artista.albuns} />
                    {estadoApoio?.independente ? (
                        <Pressable
                            style={styles.botaoDoar}
                            onPress={() => router.push({
                                pathname: "/doar-artista/[id]",
                                params: { id: artistaId },
                            })}
                            accessibilityRole="button"
                        >
                            <Text style={styles.textoBotaoDoar}>Doar ao artista</Text>
                        </Pressable>
                    ) : null}
                </>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#141414",
    },
    conteudo: {
        padding: 16,
    },
    foto: {
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: "#292929",
        marginBottom: 16,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "700",
    },
    pais: {
        color: "#e4b600",
        marginTop: 6,
    },
    bio: {
        color: "#D0D0D0",
        marginTop: 14,
        lineHeight: 22,
    },
    botaoSpotify: {
        alignSelf: "flex-start",
        backgroundColor: "#e4b600",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 16,
    },
    textoBotaoSpotify: {
        color: "#141414",
        fontWeight: "700",
    },
    subtitulo: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 28,
        marginBottom: 16,
    },
    feedback: {
        color: "#FFFFFF",
        textAlign: "center",
        padding: 24,
    },
    botaoDoar: {
        backgroundColor: "#e4b600",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 28,
        marginBottom: 16,
    },
    textoBotaoDoar: {
        color: "#141414",
        fontWeight: "700",
        textAlign: "center",
        fontSize: 16,
    },
    erroApoio: {
        color: "#ff8f8f",
        marginTop: 10,
    },
    avisoPix: {
        color: "#BBBBBB",
        lineHeight: 20,
        marginTop: 14,
    },
});
