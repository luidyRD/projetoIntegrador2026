import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Link, Tabs, useLocalSearchParams } from "expo-router";
import { albunsService, Album, Artista, Categoria } from "../../../../services/albuns";

export default function Busca() {
    const { query } = useLocalSearchParams<{ query: string | string[] }>();
    const termo = Array.isArray(query) ? query[0] : query;
    const [albuns, setAlbuns] = useState<Album[]>([]);
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro("");
        Promise.all([albunsService.listar(termo), albunsService.listarArtistas(termo)])
            .then(([categorias, artistasEncontrados]: [Categoria[], Artista[]]) => {
                if (ativo) {
                    setAlbuns(categorias.flatMap((categoria) => categoria.albuns));
                    setArtistas(artistasEncontrados);
                }
            })
            .catch((error: unknown) => {
                if (ativo) {
                    setErro(error instanceof Error ? error.message : "Não foi possível buscar.");
                }
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [termo]);

    return (
        <View style={styles.container}>
            <Tabs.Screen options={{ title: `Busca: ${termo ?? ""}` }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
            ) : albuns.length === 0 && artistas.length === 0 ? (
                <Text style={styles.feedback}>Nenhum resultado para “{termo}”.</Text>
            ) : (
                <FlatList
                    data={albuns}
                    keyExtractor={(item) => `album-${item.id}`}
                    contentContainerStyle={styles.lista}
                    ListHeaderComponent={
                        artistas.length ? (
                            <View style={styles.secao}>
                                <Text style={styles.secaoTitulo}>Artistas</Text>
                                {artistas.map((artista) => (
                                    <Link
                                        key={artista.id}
                                        href={{
                                            pathname: "/artista/[id]",
                                            params: { id: artista.id },
                                        }}
                                        style={styles.resultadoArtista}
                                    >
                                        <Text style={styles.titulo}>{artista.nome}</Text>
                                        <Text style={styles.artista}>{artista.totalAlbuns} álbuns</Text>
                                    </Link>
                                ))}
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        albuns.length ? <Text style={styles.secaoTitulo}>Álbuns</Text> : null
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Link
                                href={{
                                    pathname: "/components/musica/[id]",
                                    params: { id: item.id },
                                } as any}
                            >
                                {item.imagem ? (
                                    <Image source={{ uri: item.imagem }} style={styles.imagem} />
                                ) : (
                                    <View style={[styles.imagem, styles.semImagem]} />
                                )}
                            </Link>
                            <View style={styles.detalhes}>
                                <Link
                                    href={{
                                        pathname: "/components/musica/[id]",
                                        params: { id: item.id },
                                    } as any}
                                >
                                    <Text style={styles.titulo}>{item.titulo}</Text>
                                </Link>
                                <Link
                                    href={{
                                        pathname: "/artista/[id]",
                                        params: { id: item.artistaId },
                                    }}
                                >
                                    <Text style={styles.artista}>{item.artista}</Text>
                                </Link>
                                {item.generoId ? (
                                    <Link
                                        href={{
                                            pathname: "/genero/[id]",
                                            params: { id: item.generoId },
                                        }}
                                    >
                                        <Text style={styles.artista}>{item.genero}</Text>
                                    </Link>
                                ) : null}
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#141414",
        padding: 16,
    },
    lista: {
        gap: 12,
    },
    secao: {
        gap: 12,
        marginBottom: 8,
    },
    secaoTitulo: {
        color: "#FFFFFF",
        fontSize: 21,
        fontWeight: "700",
        marginTop: 8,
    },
    resultadoArtista: {
        padding: 12,
        backgroundColor: "#1E1E1E",
        borderRadius: 8,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    imagem: {
        width: 76,
        height: 76,
        borderRadius: 6,
    },
    semImagem: {
        backgroundColor: "#252525",
    },
    detalhes: {
        flex: 1,
        gap: 4,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    artista: {
        color: "#B3B3B3",
        fontSize: 13,
    },
    feedback: {
        color: "#FFFFFF",
        textAlign: "center",
        padding: 24,
    },
});
