import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import AlbumLista from "../../components/AlbumLista";
import { Album, albunsService } from "../../services/albuns";

export default function GeneroDetalhe() {
    const { id } = useLocalSearchParams<{ id: string | string[] }>();
    const generoId = Array.isArray(id) ? id[0] : id;
    const [nome, setNome] = useState("");
    const [albuns, setAlbuns] = useState<Album[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        if (!generoId) {
            setErro("Gênero inválido.");
            setCarregando(false);
            return;
        }
        albunsService.listarPorGenero(generoId)
            .then((resultado) => {
                if (ativo) {
                    setNome(resultado.nome);
                    setAlbuns(resultado.albuns);
                }
            })
            .catch((error: unknown) => {
                if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar o gênero.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [generoId]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: nome || "Gênero" }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
            ) : (
                <>
                    <Text style={styles.titulo}>{nome}</Text>
                    <Text style={styles.subtitulo}>{albuns.length} álbuns</Text>
                    <AlbumLista albuns={albuns} />
                </>
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
        fontSize: 26,
        fontWeight: "700",
    },
    subtitulo: {
        color: "#B3B3B3",
        marginTop: 4,
        marginBottom: 18,
    },
    feedback: {
        color: "#FFFFFF",
        textAlign: "center",
        padding: 24,
    },
});
