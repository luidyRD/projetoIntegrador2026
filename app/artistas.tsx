import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { Artista, albunsService } from "../services/albuns";

export default function ArtistasPage() {
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        albunsService.listarArtistas()
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
            <Stack.Screen options={{ title: "Artistas" }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
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
                                <View style={[styles.foto, styles.fotoVazia]} />
                            )}
                            <View>
                                <Text style={styles.nome}>{item.nome}</Text>
                                <Text style={styles.total}>{item.totalAlbuns} álbuns</Text>
                            </View>
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
        color: "#FFFFFF",
        textAlign: "center",
        padding: 24,
    },
});
