import React from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Album } from "../services/albuns";

type Props = {
    albuns: Album[];
    onRemove?: (albumId: string) => void;
    removendoAlbumId?: string | null;
};

export default function AlbumLista({ albuns, onRemove, removendoAlbumId }: Props) {
    if (!albuns.length) {
        return <Text style={styles.feedback}>Nenhum álbum encontrado.</Text>;
    }

    return (
        <FlatList
            data={albuns}
            keyExtractor={(album) => album.id}
            contentContainerStyle={styles.lista}
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
                            <View style={[styles.imagem, styles.semImagem]}>
                                <Text style={styles.semImagemTexto}>Sem capa</Text>
                            </View>
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
                        {item.ano ? <Text style={styles.ano}>{item.ano}</Text> : null}
                    </View>
                    {onRemove ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remover ${item.titulo} dos favoritos`}
                            accessibilityState={{ disabled: Boolean(removendoAlbumId) }}
                            disabled={Boolean(removendoAlbumId)}
                            onPress={() => onRemove(item.id)}
                            style={styles.botaoRemover}
                        >
                            {removendoAlbumId === item.id ? (
                                <ActivityIndicator color="#e4b600" />
                            ) : (
                                <Ionicons name="heart-dislike-outline" size={22} color="#e4b600" />
                            )}
                        </Pressable>
                    ) : null}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    lista: {
        gap: 14,
        paddingBottom: 24,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#1E1E1E",
        borderRadius: 10,
        padding: 10,
    },
    imagem: {
        width: 78,
        height: 78,
        borderRadius: 6,
    },
    semImagem: {
        backgroundColor: "#292929",
        alignItems: "center",
        justifyContent: "center",
    },
    semImagemTexto: {
        color: "#B3B3B3",
        fontSize: 11,
    },
    detalhes: {
        flex: 1,
        gap: 6,
    },
    botaoRemover: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    titulo: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
    artista: {
        color: "#e4b600",
        fontSize: 14,
    },
    ano: {
        color: "#B3B3B3",
        fontSize: 12,
    },
    feedback: {
        color: "#B3B3B3",
        paddingVertical: 18,
    },
});
