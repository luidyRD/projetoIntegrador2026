import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Artista, albunsService } from "../services/albuns";

export default function ArtistasIndependentesPage() {
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        albunsService.listarArtistasIndependentes()
            .then((resultado) => {
                if (ativo) setArtistas(resultado);
            })
            .catch((error: unknown) => {
                if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar artistas.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Artistas independentes" }} />
            <Text style={styles.titulo}>Descubra artistas independentes</Text>
            <Text style={styles.descricao}>
                Conheça novos projetos e publique seu artista, álbum e músicas.
            </Text>
            <Link href="/artista-independente/cadastro" asChild>
                <Pressable style={styles.botaoCadastro}>
                    <Ionicons name="add-circle-outline" size={21} color="#141414" />
                    <Text style={styles.textoBotao}>Cadastrar artista independente</Text>
                </Pressable>
            </Link>
            {carregando ? (
                <ActivityIndicator color="#e4b600" style={styles.feedback} />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
            ) : artistas.length === 0 ? (
                <Text style={styles.feedback}>Ainda não há artistas cadastrados. Seja o primeiro!</Text>
            ) : (
                <FlatList
                    data={artistas}
                    keyExtractor={(artista) => artista.id}
                    contentContainerStyle={styles.lista}
                    renderItem={({ item }) => (
                        <Link
                            href={{ pathname: "/artista/[id]", params: { id: item.id } }}
                            style={styles.card}
                        >
                            {item.foto ? (
                                <Image source={{ uri: item.foto }} style={styles.foto} />
                            ) : (
                                <View style={[styles.foto, styles.fotoVazia]}>
                                    <Ionicons name="musical-notes" size={22} color="#B3B3B3" />
                                </View>
                            )}
                            <View style={styles.detalhes}>
                                <Text style={styles.nome}>{item.nome}</Text>
                                <Text style={styles.total}>
                                    {item.pais ? `${item.pais} · ` : ""}{item.totalAlbuns} álbuns
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#B3B3B3" />
                        </Link>
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
    titulo: {
        color: "#FFFFFF",
        fontSize: 25,
        fontWeight: "700",
    },
    descricao: {
        color: "#B3B3B3",
        lineHeight: 21,
        marginTop: 8,
    },
    botaoCadastro: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#e4b600",
        borderRadius: 10,
        padding: 14,
        marginTop: 18,
        marginBottom: 22,
    },
    textoBotao: {
        color: "#141414",
        fontWeight: "700",
    },
    lista: {
        gap: 12,
        paddingBottom: 24,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#1E1E1E",
    },
    foto: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },
    fotoVazia: {
        backgroundColor: "#292929",
        alignItems: "center",
        justifyContent: "center",
    },
    detalhes: {
        flex: 1,
    },
    nome: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    total: {
        color: "#B3B3B3",
        marginTop: 4,
    },
    feedback: {
        color: "#B3B3B3",
        textAlign: "center",
        padding: 24,
    },
});
