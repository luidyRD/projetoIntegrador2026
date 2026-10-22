import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Text, Image, ActivityIndicator, Pressable } from 'react-native';
import InputBusca from '../components/inputBusca';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { albunsService, ArtistaIndependenteComAlbuns, Categoria } from '../../services/albuns';
import { obterUsuarioSessao, UsuarioSessao } from '../../services/auth';
import { observarSessao } from '../../services/session';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

export default function App() {
    const [fontsLoaded] = useFonts({ PlusJakartaSans_700Bold });
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [abaRanking, setAbaRanking] = useState<'maisAvaliados' | 'melhorMedia'>('maisAvaliados');
    const [albunsIndependentes, setAlbunsIndependentes] = useState<ArtistaIndependenteComAlbuns[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [carregandoIndependentes, setCarregandoIndependentes] = useState(true);
    const [erro, setErro] = useState('');
    const [erroIndependentes, setErroIndependentes] = useState('');
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);

    const albunsMaisAvaliados = useMemo(() => {
        return categorias
            .flatMap((categoria) => categoria.albuns)
            .filter((album) => album.totalAvaliacoes > 0)
            .sort((a, b) =>
                b.totalAvaliacoes - a.totalAvaliacoes ||
                (b.mediaNota ?? 0) - (a.mediaNota ?? 0) ||
                a.titulo.localeCompare(b.titulo)
            )
            .slice(0, 10);
    }, [categorias]);

    const albunsMelhorMedia = useMemo(() => {
        return categorias
            .flatMap((categoria) => categoria.albuns)
            .filter((album) => album.totalAvaliacoes > 0 && album.mediaNota !== null)
            .sort((a, b) =>
                (b.mediaNota ?? 0) - (a.mediaNota ?? 0) ||
                b.totalAvaliacoes - a.totalAvaliacoes ||
                a.titulo.localeCompare(b.titulo)
            )
            .slice(0, 10);
    }, [categorias]);

    const carregarAlbuns = useCallback(async () => {
        setCarregando(true);
        setErro('');
        try {
            setCategorias(await albunsService.listar());
        } catch (error) {
            setErro(error instanceof Error ? error.message : 'Não foi possível carregar os álbuns.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        void carregarAlbuns();
    }, [carregarAlbuns]);

    const carregarAlbunsIndependentes = useCallback(async () => {
        setCarregandoIndependentes(true);
        setErroIndependentes('');
        try {
            setAlbunsIndependentes(await albunsService.listarAlbunsIndependentes());
        } catch (error) {
            setErroIndependentes(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível carregar os álbuns independentes.'
            );
        } finally {
            setCarregandoIndependentes(false);
        }
    }, []);

    useEffect(() => {
        void carregarAlbunsIndependentes();
    }, [carregarAlbunsIndependentes]);

    useEffect(() => {
        let ativo = true;
        const cancelarObservacao = observarSessao((dados) => {
            setUsuario(dados);
        });
        obterUsuarioSessao()
            .then((dados) => {
                if (ativo) setUsuario(dados);
            })
            .catch((error: unknown) => {
                console.error('Não foi possível ler a sessão:', error);
            });
        return () => {
            ativo = false;
            cancelarObservacao();
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
                ListHeaderComponent={
                    <>
                        <InputBusca />
                        <View style={styles.linksCabecalho}>
                            <Link href="/artistas" asChild>
                                <Pressable style={styles.botaoPerfil}>
                                    <Ionicons name="mic-outline" size={20} color="#e4b600" />
                                    <Text style={styles.linkConta}>Artistas</Text>
                                </Pressable>
                            </Link>
                            <Link href={usuario ? "/perfil" : "/login"} asChild>
                                <Pressable style={styles.botaoPerfil}>
                                    <Ionicons
                                        name={usuario ? "person-circle-outline" : "person-outline"}
                                        size={20}
                                        color="#e4b600"
                                    />
                                    <Text style={styles.linkConta}>
                                        {usuario ? `Perfil · @${usuario.username}` : "Entrar ou criar conta"}
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                        <View style={styles.destaquesIndependentes}>
                            <View style={styles.destaqueCabecalho}>
                                <View style={styles.destaqueTituloLinha}>
                                    <Ionicons name="sparkles" size={20} color="#e4b600" />
                                    <Text style={styles.destaqueTitulo}>Destaques independentes</Text>
                                </View>
                                <Text style={styles.destaqueDescricao}>
                                    Álbuns de artistas independentes da comunidade
                                </Text>
                                <View style={styles.acoesIndependentes}>
                                    <Link href="/artistas-independentes" asChild>
                                        <Pressable style={styles.botaoDestaque}>
                                            <Text style={styles.textoBotaoDestaque}>Ver artistas</Text>
                                        </Pressable>
                                    </Link>
                                    <Link href="/artista-independente/cadastro" asChild>
                                        <Pressable style={styles.botaoCadastrar}>
                                            <Ionicons name="add" size={17} color="#141414" />
                                            <Text style={styles.textoBotaoCadastrar}>Cadastrar artista</Text>
                                        </Pressable>
                                    </Link>
                                </View>
                            </View>
                            {carregandoIndependentes ? (
                                <ActivityIndicator color="#e4b600" style={styles.feedbackIndependentes} />
                            ) : erroIndependentes ? (
                                <Text style={styles.feedbackIndependentes}>{erroIndependentes}</Text>
                            ) : albunsIndependentes.length === 0 ? (
                                <Text style={styles.feedbackIndependentes}>
                                    Ainda não há álbuns independentes. Cadastre o primeiro projeto!
                                </Text>
                            ) : (
                                albunsIndependentes.map((artista) => (
                                    <View key={artista.id} style={styles.linhaArtistaIndependente}>
                                        <Link
                                            href={{
                                                pathname: "/artista/[id]",
                                                params: { id: artista.id },
                                            }}
                                        >
                                            <Text style={styles.nomeArtistaIndependente}>{artista.nome}</Text>
                                        </Link>
                                        <FlatList
                                            data={artista.albuns}
                                            keyExtractor={(album) => album.id}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            renderItem={({ item: album }) => (
                                                <View style={styles.albumCard}>
                                                    <Link
                                                        href={{
                                                            pathname: '/components/musica/[id]',
                                                            params: { id: album.id },
                                                        } as any}
                                                    >
                                                        {album.imagem ? (
                                                            <Image
                                                                source={{ uri: album.imagem }}
                                                                style={styles.imagem}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <View style={[styles.imagem, styles.semImagem]}>
                                                                <Text style={styles.semImagemTexto}>Sem capa</Text>
                                                            </View>
                                                        )}
                                                        <Text style={styles.albumTitulo}>{album.titulo}</Text>
                                                    </Link>
                                                    <Text style={styles.albumArtista}>{album.genero ?? 'Álbum independente'}</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                ))
                            )}
                        </View>
                    {categorias.length > 0 ? (
                        <View style={styles.ranking}>
                            <Text style={styles.rankingTitulo}>Álbuns em destaque</Text>
                            <View style={styles.abasRanking}>
                                <Pressable
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: abaRanking === 'maisAvaliados' }}
                                    onPress={() => setAbaRanking('maisAvaliados')}
                                    style={[
                                        styles.abaRanking,
                                        abaRanking === 'maisAvaliados' && styles.abaRankingAtiva,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.textoAbaRanking,
                                            abaRanking === 'maisAvaliados' && styles.textoAbaRankingAtiva,
                                        ]}
                                    >
                                        Mais avaliados
                                    </Text>
                                </Pressable>
                                <Pressable
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: abaRanking === 'melhorMedia' }}
                                    onPress={() => setAbaRanking('melhorMedia')}
                                    style={[
                                        styles.abaRanking,
                                        abaRanking === 'melhorMedia' && styles.abaRankingAtiva,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.textoAbaRanking,
                                            abaRanking === 'melhorMedia' && styles.textoAbaRankingAtiva,
                                        ]}
                                    >
                                        Melhor média
                                    </Text>
                                </Pressable>
                            </View>
                            {(() => {
                                const albuns = abaRanking === 'maisAvaliados'
                                    ? albunsMaisAvaliados
                                    : albunsMelhorMedia;
                                return albuns.length ? (
                                    <FlatList
                                        data={albuns}
                                        keyExtractor={(album) => album.id}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        renderItem={({ item }) => (
                                            <View style={styles.albumCard}>
                                                <Link
                                                    href={{
                                                        pathname: '/components/musica/[id]',
                                                        params: { id: item.id },
                                                    } as any}
                                                >
                                                    {item.imagem ? (
                                                        <Image
                                                            source={{ uri: item.imagem }}
                                                            style={styles.imagem}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View style={[styles.imagem, styles.semImagem]}>
                                                            <Text style={styles.semImagemTexto}>Sem capa</Text>
                                                        </View>
                                                    )}
                                                    <Text style={styles.albumTitulo}>{item.titulo}</Text>
                                                </Link>
                                                <Link
                                                    href={{
                                                        pathname: '/artista/[id]',
                                                        params: { id: item.artistaId },
                                                    }}
                                                >
                                                    <Text style={styles.albumArtista}>{item.artista}</Text>
                                                </Link>
                                                <Text style={styles.notaAlbum}>
                                                    {abaRanking === 'maisAvaliados'
                                                        ? `${item.totalAvaliacoes} avaliações`
                                                        : `★ ${(item.mediaNota ?? 0).toFixed(1)} · ${item.totalAvaliacoes} avaliações`}
                                                </Text>
                                            </View>
                                        )}
                                    />
                                ) : (
                                    <Text style={styles.semRanking}>
                                        Ainda não há álbuns avaliados.
                                    </Text>
                                );
                            })()}
                        </View>
                    ) : null}
                    </>
                }
                ListEmptyComponent={
                    carregando ? (
                        <ActivityIndicator color="#e4b600" style={styles.feedback} />
                    ) : (
                        <Text style={styles.feedback} onPress={carregarAlbuns}>
                            {erro || 'Nenhum álbum encontrado. Toque para atualizar.'}
                        </Text>
                    )
                }
                renderItem={({ item }) => (
                    <View>
                        <Link href={{ pathname: "/genero/[id]", params: { id: item.id } }}>
                            <Text style={styles.titulo}>{item.titulo}</Text>
                        </Link>
                        <FlatList
                            data={item.albuns}
                            keyExtractor={(album) => album.id}
                            horizontal
                            renderItem={({ item: album }) => (
                                <View style={styles.albumCard}>
                                    <Link
                                        href={{
                                            pathname: '/components/musica/[id]',
                                            params: { id: album.id },
                                        } as any}
                                    >
                                        {album.imagem ? (
                                            <Image
                                                source={{ uri: album.imagem }}
                                                style={styles.imagem}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.imagem, styles.semImagem]}>
                                                <Text style={styles.semImagemTexto}>Sem capa</Text>
                                            </View>
                                        )}
                                        <Text style={styles.albumTitulo}>{album.titulo}</Text>
                                    </Link>
                                    <Link
                                        href={{
                                            pathname: "/artista/[id]",
                                            params: { id: album.artistaId },
                                        }}
                                    >
                                        <Text style={styles.albumArtista}>{album.artista}</Text>
                                    </Link>
                                </View>
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
    semImagem: {
        backgroundColor: '#252525',
        alignItems: 'center',
        justifyContent: 'center',
    },
    semImagemTexto: {
        color: '#B3B3B3',
    },
    albumTitulo: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        marginTop: 6,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    albumArtista: {
        color: '#B3B3B3',
        fontSize: 13,
        marginTop: 2,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    feedback: {
        color: '#FFFFFF',
        textAlign: 'center',
        padding: 24,
    },
    linkConta: {
        color: '#e4b600',
        fontSize: 14,
        fontWeight: '600',
    },
    botaoPerfil: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    linksCabecalho: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    destaquesIndependentes: {
        marginHorizontal: 10,
        marginTop: 8,
        marginBottom: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: '#1B1910',
        borderWidth: 1,
        borderColor: '#806A0B',
        borderRadius: 12,
    },
    destaqueCabecalho: {
        marginBottom: 8,
    },
    destaqueTituloLinha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    destaqueTitulo: {
        color: '#F3D14A',
        fontSize: 19,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    destaqueDescricao: {
        color: '#C6BC91',
        fontSize: 13,
        marginTop: 4,
    },
    acoesIndependentes: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
    },
    botaoDestaque: {
        borderWidth: 1,
        borderColor: '#806A0B',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    textoBotaoDestaque: {
        color: '#F3D14A',
        fontSize: 13,
        fontWeight: '600',
    },
    botaoCadastrar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: 18,
        backgroundColor: '#e4b600',
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    textoBotaoCadastrar: {
        color: '#141414',
        fontSize: 13,
        fontWeight: '700',
    },
    linhaArtistaIndependente: {
        marginTop: 10,
    },
    nomeArtistaIndependente: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    feedbackIndependentes: {
        color: '#C6BC91',
        paddingVertical: 16,
        textAlign: 'center',
    },
    ranking: {
        marginHorizontal: 10,
        marginTop: 8,
        marginBottom: 18,
    },
    rankingTitulo: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_700Bold',
        marginBottom: 10,
    },
    abasRanking: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#444444',
        marginBottom: 8,
    },
    abaRanking: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    abaRankingAtiva: {
        borderBottomColor: '#e4b600',
    },
    textoAbaRanking: {
        color: '#B3B3B3',
        fontSize: 14,
        fontWeight: '600',
    },
    textoAbaRankingAtiva: {
        color: '#F3D14A',
    },
    notaAlbum: {
        color: '#e4b600',
        fontSize: 12,
        marginTop: 4,
    },
    semRanking: {
        color: '#B3B3B3',
        paddingVertical: 16,
    },
});
