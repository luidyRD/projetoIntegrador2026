import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack, useFocusEffect } from "expo-router";
import AlbumLista from "../components/AlbumLista";
import { UsuarioSessao, obterUsuarioSessao } from "../services/auth";
import { Album, favoritosService } from "../services/albuns";

export default function FavoritosPage() {
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
    const [albuns, setAlbuns] = useState<Album[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const sessao = await obterUsuarioSessao();
            setUsuario(sessao);
            setAlbuns(sessao ? await favoritosService.listar() : []);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível carregar os favoritos.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void carregar();
        }, [carregar])
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Favoritos",
                    headerStyle: { backgroundColor: "#141414" },
                    headerTitleStyle: { color: "#FFFFFF" },
                    headerTintColor: "#FFFFFF",
                }}
            />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <View style={styles.estado}>
                    <Text style={styles.feedback}>{erro}</Text>
                    <Pressable onPress={() => void carregar()} style={styles.botao}>
                        <Text style={styles.textoBotao}>Tentar novamente</Text>
                    </Pressable>
                </View>
            ) : usuario ? (
                <>
                    <Text style={styles.titulo}>Seus álbuns favoritos</Text>
                    {albuns.length ? (
                        <AlbumLista albuns={albuns} />
                    ) : (
                        <Text style={styles.feedback}>
                            Você ainda não favoritou nenhum álbum. Abra um álbum e toque no coração para salvá-lo aqui.
                        </Text>
                    )}
                </>
            ) : (
                <View style={styles.estado}>
                    <Text style={styles.titulo}>Entre para ver seus favoritos</Text>
                    <Text style={styles.feedback}>
                        Seus álbuns favoritos ficam salvos na sua conta.
                    </Text>
                    <Link href="/login" asChild>
                        <Pressable style={styles.botao}>
                            <Text style={styles.textoBotao}>Entrar</Text>
                        </Pressable>
                    </Link>
                </View>
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
    estado: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 16,
    },
    feedback: {
        color: "#B3B3B3",
        textAlign: "center",
        lineHeight: 22,
        paddingVertical: 18,
    },
    botao: {
        backgroundColor: "#e4b600",
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    textoBotao: {
        color: "#141414",
        fontWeight: "700",
    },
});
