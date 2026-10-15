import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, Image } from 'react-native';
import InputBusca from '../components/inputBusca';
import { Link } from 'expo-router';
import { useFonts } from 'expo-font';
import DadosAlbuns, { Categoria, carregarDadosAlbunsComCapa } from '../rotaServidor/dados';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

export default function App() {
    const [fontsLoaded] = useFonts({ PlusJakartaSans_700Bold });
    const [categorias, setCategorias] = useState<Categoria[]>(DadosAlbuns());

    useEffect(() => {
        let ativo = true;

        carregarDadosAlbunsComCapa().then((dados) => {
            if (ativo) {
                setCategorias(dados);
            }
        });

        return () => {
            ativo = false;
        };
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.corFundo}>
            <FlatList
                data={categorias}
                keyExtractor={(item) => item.id}
                style={styles.lista}
                ListHeaderComponent={<InputBusca />}
                renderItem={({ item }) => (
                    <View>
                        <Text style={styles.titulo}>{item.titulo}</Text>
                        <FlatList
                            data={item.albuns}
                            keyExtractor={(album) => album.id}
                            horizontal={true}
                            renderItem={({ item }) => (
                                <Link href={{ pathname: '/components/musica/[id]', params: { id: String(item.id) } } as any}>
                                    <View style={styles.albumCard}>
                                        <Image
                                            source={{ uri: item.imagem }}
                                            style={styles.imagem}
                                            resizeMode="cover"
                                        />
                                        <Text style={styles.albumTitulo}>{item.titulo}</Text>
                                        <Text style={styles.albumArtista}>{item.artista}</Text>
                                    </View>
                                </Link>
                            )}
                        />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    corFundo: {
        flex: 1,
        backgroundColor: '#141414',
        paddingTop: 10,
        paddingHorizontal: 5,
    },
    lista: {
        flex: 1,
    },
    titulo: {
        color: '#FFFFFF',
        fontSize: 23,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    albumCard: {
        width: 180,
        marginRight: 12,
        marginVertical: 8,
    },
    imagem: {
        width: 180,
        height: 180,
        borderRadius: 5,
    },
    albumTitulo: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        marginTop: 6,
        fontFamily: 'PlusJakartaSans_700Bold'
    },
    albumArtista: {
        color: '#B3B3B3',
        fontSize: 13,
        marginTop: 2,
        fontFamily: 'PlusJakartaSans_700Bold'
    },
});
