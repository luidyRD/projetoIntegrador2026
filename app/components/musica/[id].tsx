import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { Album, albunsService, Avaliacao, favoritosService } from '../../../services/albuns';
import { obterUsuarioSessao, UsuarioSessao } from '../../../services/auth';
import { observarSessao } from '../../../services/session';
import { API_URL } from '../../../services/api';

export default function AlbumDetalhe() {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [erroAvaliacao, setErroAvaliacao] = useState('');
  const [mensagemAvaliacao, setMensagemAvaliacao] = useState('');
  const [album, setAlbum] = useState<Album | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [erroAudio, setErroAudio] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [carregandoFavorito, setCarregandoFavorito] = useState(true);
  const [alterandoFavorito, setAlterandoFavorito] = useState(false);
  const [erroFavorito, setErroFavorito] = useState('');
  const [mensagemFavorito, setMensagemFavorito] = useState('');
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const albumId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let ativo = true;
    if (!albumId) {
      setErroCarregamento('Identificador do álbum inválido.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErroCarregamento('');
    Promise.all([
      albunsService.buscarPorId(albumId),
      albunsService.listarAvaliacoes(albumId),
    ])
      .then(([albumEncontrado, dadosAvaliacoes]) => {
        if (ativo) {
          setAlbum(albumEncontrado);
          setAvaliacoes(dadosAvaliacoes);
        }
      })
      .catch((error: unknown) => {
        if (ativo) {
          setErroCarregamento(
            error instanceof Error ? error.message : 'Não foi possível carregar o álbum.'
          );
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [albumId]);

  useEffect(() => {
    let ativo = true;
    const sincronizarSessao = async (sessao: UsuarioSessao | null) => {
      if (!ativo) return;
      setUsuario(sessao);
      setErroFavorito('');
      setMensagemFavorito('');
      if (!sessao || !albumId) {
        setFavorito(false);
        setCarregandoFavorito(false);
        return;
      }

      setCarregandoFavorito(true);
      try {
        const estado = await favoritosService.obterEstado(albumId);
        if (ativo) setFavorito(estado.favorito);
      } catch (error) {
        if (ativo) {
          setErroFavorito(
            error instanceof Error ? error.message : 'Não foi possível verificar o favorito.'
          );
        }
      } finally {
        if (ativo) setCarregandoFavorito(false);
      }
    };
    const cancelarObservacao = observarSessao((sessao) => {
      void sincronizarSessao(sessao);
    });
    obterUsuarioSessao()
      .then(sincronizarSessao)
      .catch((error: unknown) => {
        if (ativo) {
          setErroFavorito(
            error instanceof Error ? error.message : 'Não foi possível verificar sua sessão.'
          );
          setCarregandoFavorito(false);
        }
      });

    return () => {
      ativo = false;
      cancelarObservacao();
    };
  }, [albumId]);

  const alternarFavorito = async () => {
    if (!albumId || alterandoFavorito) return;
    if (!usuario) {
      router.push('/login');
      return;
    }

    setAlterandoFavorito(true);
    setErroFavorito('');
    setMensagemFavorito('');
    try {
      const estado = favorito
        ? await favoritosService.remover(albumId)
        : await favoritosService.adicionar(albumId);
      setFavorito(estado.favorito);
      setMensagemFavorito(
        estado.favorito ? 'Álbum adicionado aos favoritos.' : 'Álbum removido dos favoritos.'
      );
    } catch (error) {
      setErroFavorito(
        error instanceof Error ? error.message : 'Não foi possível atualizar seus favoritos.'
      );
    } finally {
      setAlterandoFavorito(false);
    }
  };

  const adicionarAvaliacao = async () => {
    const texto = comentario.trim();
    if (nota === 0 || !texto) {
      setErroAvaliacao('Selecione uma nota e escreva um comentário.');
      return;
    }
    if (!albumId || enviando) {
      return;
    }

    Keyboard.dismiss();
    setEnviando(true);
    setErroAvaliacao('');
    setMensagemAvaliacao('');
    try {
      await albunsService.avaliar(albumId, { nota, comentario: texto });
      const [dadosAvaliacoes, albumAtualizado] = await Promise.all([
        albunsService.listarAvaliacoes(albumId),
        albunsService.buscarPorId(albumId),
      ]);
      setAvaliacoes(dadosAvaliacoes);
      setAlbum(albumAtualizado);
      setNota(0);
      setComentario('');
      setMensagemAvaliacao('Sua avaliação foi salva.');
    } catch (error) {
      setErroAvaliacao(
        error instanceof Error ? error.message : 'Não foi possível salvar sua avaliação.'
      );
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <View style={[styles.container, styles.estadoContainer]}>
        <ActivityIndicator color="#e4b600" />
      </View>
    );
  }

  if (erroCarregamento) {
    return (
      <View style={[styles.container, styles.estadoContainer]}>
        <Text style={styles.textoAvaliacao}>{erroCarregamento}</Text>
      </View>
    );
  }

  if (!album) {
    return (
      <View style={[styles.container, styles.estadoContainer]}>
        <Text style={styles.titulo}>Álbum não encontrado.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: album.titulo,
          headerStyle: { backgroundColor: '#131212' },
          headerTitleStyle: { color: '#fff' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.imagemContainer}>
            {album.imagem ? (
              <Image source={{ uri: album.imagem }} style={styles.imagem} resizeMode="cover" />
            ) : (
              <View style={[styles.imagem, styles.semImagem]} />
            )}
            <View style={styles.overlay} />
          </View>

          <View style={styles.detalhesContainer}>
            <Text style={styles.titulo}>{album.titulo}</Text>
            <Link
              href={{
                pathname: '/artista/[id]',
                params: { id: album.artistaId },
              }}
            >
              <Text style={styles.artista}>{album.artista}</Text>
            </Link>
            <TouchableOpacity
              style={[styles.botaoFavorito, (carregandoFavorito || alterandoFavorito) && styles.botaoDesativado]}
              onPress={alternarFavorito}
              disabled={carregandoFavorito || alterandoFavorito}
              accessibilityRole="button"
              accessibilityLabel={
                favorito ? 'Remover álbum dos favoritos' : 'Adicionar álbum aos favoritos'
              }
              accessibilityState={{ selected: favorito, disabled: carregandoFavorito || alterandoFavorito }}
            >
              <Ionicons
                name={favorito ? 'heart' : 'heart-outline'}
                size={21}
                color="#e4b600"
              />
              <Text style={styles.textoBotaoFavorito}>
                {alterandoFavorito
                  ? 'Salvando...'
                  : !usuario
                    ? 'Entre para favoritar'
                    : favorito
                      ? 'Remover dos favoritos'
                      : 'Favoritar álbum'}
              </Text>
            </TouchableOpacity>
            {erroFavorito ? <Text style={styles.erroAvaliacao}>{erroFavorito}</Text> : null}
            {mensagemFavorito ? <Text style={styles.mensagemAvaliacao}>{mensagemFavorito}</Text> : null}
            <View style={styles.informacoesContainer}>
              <View style={styles.informacao}>
                <Text style={styles.rotulo}>Lançamento</Text>
                <Text style={styles.valor}>{album.ano ?? 'Não informado'}</Text>
              </View>
              <View style={styles.informacao}>
                <Text style={styles.rotulo}>Gênero</Text>
                {album.generoId ? (
                  <Link href={{ pathname: '/genero/[id]', params: { id: album.generoId } }}>
                    <Text style={styles.valor}>{album.genero}</Text>
                  </Link>
                ) : (
                  <Text style={styles.valor}>{album.genero ?? 'Outros'}</Text>
                )}
              </View>
            </View>
            <Text style={styles.mediaNota}>
              {album.mediaNota === null
                ? 'Ainda sem avaliações'
                : `Nota média: ${album.mediaNota.toFixed(1)} (${album.totalAvaliacoes} avaliações)`}
            </Text>
          </View>

          <View style={styles.faixasContainer}>
            <Text style={styles.subtitulo}>Músicas ({album.musicas?.length ?? 0})</Text>
            {!album.musicas?.length ? (
              <Text style={styles.rotulo}>A lista de músicas ainda não está disponível.</Text>
            ) : (
              album.musicas.map((musica) => (
                <View key={musica.id} style={styles.faixa}>
                  <Text style={styles.numeroFaixa}>
                    {String(musica.numeroFaixa).padStart(2, '0')}
                  </Text>
                  <Text style={styles.nomeFaixa}>{musica.titulo}</Text>
                  {musica.audioUrl ? (
                    <TouchableOpacity
                      onPress={() => {
                        setErroAudio('');
                        Linking.openURL(`${API_URL}${musica.audioUrl}`).catch(() => {
                          setErroAudio('Não foi possível abrir este arquivo de áudio.');
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Ouvir ${musica.titulo}`}
                    >
                      <Ionicons name="play-circle-outline" size={25} color="#e4b600" />
                    </TouchableOpacity>
                  ) : null}
                  {musica.duracaoSegundos ? (
                    <Text style={styles.duracaoFaixa}>
                      {Math.floor(musica.duracaoSegundos / 60)}:
                      {String(musica.duracaoSegundos % 60).padStart(2, '0')}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
            {erroAudio ? <Text style={styles.erroAvaliacao}>{erroAudio}</Text> : null}
          </View>

          <View style={styles.avaliacaoContainer}>
            {usuario ? (
              <>
                <Text style={styles.subtitulo}>Avalie este álbum</Text>
                <Text style={styles.rotuloNota}>Sua nota</Text>
                <View style={styles.estrelasContainer}>
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <TouchableOpacity
                      key={estrela}
                      onPress={() => {
                        setNota(estrela);
                        setErroAvaliacao('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Dar ${estrela} ${estrela === 1 ? 'estrela' : 'estrelas'}`}
                    >
                      <Ionicons
                        name={estrela <= nota ? 'star' : 'star-outline'}
                        size={30}
                        color="#ebbd00"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.campoComentario}
                  placeholder="Escreva sua avaliação..."
                  placeholderTextColor="#B3B3B3"
                  value={comentario}
                  onChangeText={(texto) => {
                    setComentario(texto);
                    setErroAvaliacao('');
                    setMensagemAvaliacao('');
                  }}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />

                {erroAvaliacao ? <Text style={styles.erroAvaliacao}>{erroAvaliacao}</Text> : null}
                {mensagemAvaliacao ? (
                  <Text style={styles.mensagemAvaliacao}>{mensagemAvaliacao}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.botaoAvaliar, enviando && styles.botaoDesativado]}
                  onPress={adicionarAvaliacao}
                  activeOpacity={0.8}
                  disabled={enviando}
                >
                  <Text style={styles.textoBotaoAvaliar}>
                    {enviando ? 'Salvando...' : 'Adicionar avaliação'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.subtitulo}>Entre para avaliar este álbum</Text>
                <TouchableOpacity
                  style={styles.botaoAvaliar}
                  onPress={() => router.push('/login')}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotaoAvaliar}>Entrar</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.listaAvaliacoes}>
              <Text style={styles.subtitulo}>Avaliações ({avaliacoes.length})</Text>
              {avaliacoes.length === 0 ? (
                <Text style={styles.rotulo}>Este álbum ainda não tem avaliações.</Text>
              ) : (
                avaliacoes.map((avaliacao) => (
                  <View key={avaliacao.id} style={styles.avaliacao}>
                    <Text style={styles.autorAvaliacao}>{avaliacao.autor}</Text>
                    <View style={styles.estrelasAvaliacao}>
                      {Array.from({ length: avaliacao.nota }, (_, estrela) => (
                        <Ionicons key={estrela} name="star" size={16} color="#FFD700" />
                      ))}
                    </View>
                    <Text style={styles.textoAvaliacao}>{avaliacao.comentario}</Text>
                    <Text style={styles.dataAvaliacao}>
                      {new Date(avaliacao.criadoEm).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131212',
  },
  estadoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  innerContainer: {
    padding: 16,
  },
  imagemContainer: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
  },
  imagem: {
    width: '100%',
    height: 420,
  },
  semImagem: {
    backgroundColor: '#252525',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  detalhesContainer: {
    marginTop: 20,
  },
  titulo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  artista: {
    color: '#B3B3B3',
    fontSize: 18,
    marginTop: 6,
  },
  botaoFavorito: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#252525',
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textoBotaoFavorito: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  informacoesContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  informacao: {
    gap: 4,
  },
  rotulo: {
    color: '#B3B3B3',
    fontSize: 13,
  },
  valor: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaNota: {
    color: '#e4b600',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  faixasContainer: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  numeroFaixa: {
    color: '#B3B3B3',
    width: 26,
    textAlign: 'right',
  },
  nomeFaixa: {
    color: '#FFFFFF',
    fontSize: 15,
    flex: 1,
  },
  duracaoFaixa: {
    color: '#B3B3B3',
    fontSize: 13,
  },
  avaliacaoContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  subtitulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  rotuloNota: {
    color: '#B3B3B3',
    fontSize: 14,
    marginBottom: 8,
  },
  estrelasContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  campoComentario: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    backgroundColor: '#1F1F1F',
    fontSize: 15,
  },
  erroAvaliacao: {
    color: '#FF7777',
    fontSize: 14,
    marginTop: 8,
  },
  mensagemAvaliacao: {
    color: '#9BE7A5',
    fontSize: 14,
    marginTop: 8,
  },
  botaoAvaliar: {
    alignItems: 'center',
    backgroundColor: '#e4b600',
    borderRadius: 10,
    marginTop: 14,
    paddingVertical: 12,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  textoBotaoAvaliar: {
    color: '#141414',
    fontSize: 15,
    fontWeight: '700',
  },
  listaAvaliacoes: {
    marginTop: 28,
  },
  avaliacao: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingVertical: 14,
  },
  autorAvaliacao: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  estrelasAvaliacao: {
    flexDirection: 'row',
    gap: 3,
  },
  textoAvaliacao: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  dataAvaliacao: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 6,
  },
});
