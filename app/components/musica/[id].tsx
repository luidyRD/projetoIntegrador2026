import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import DadosAlbuns, { carregarDadosAlbunsComCapa } from '../../rotaServidor/dados';

export default function AlbumDetalhe() {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [avaliacoes, setAvaliacoes] = useState<{ nota: number; comentario: string }[]>([]);
  const [erroAvaliacao, setErroAvaliacao] = useState('');
  const { id } = useLocalSearchParams();
  const albumId = Array.isArray(id) ? id[0] : id;

  const categorias = DadosAlbuns();
  const [albumAtual, setAlbumAtual] = useState(
    categorias
      .flatMap((categoria) => categoria.albuns)
      .find((album) => album.id === albumId) ?? null
  );

  useEffect(() => {
    let ativo = true;

    carregarDadosAlbunsComCapa().then((dados) => {
      const encontrado = dados
        .flatMap((categoria) => categoria.albuns)
        .find((album) => album.id === albumId);

      if (ativo) {
        setAlbumAtual(encontrado ?? null);
      }
    });

    return () => {
      ativo = false;
    };
  }, [albumId]);

  if (!albumAtual) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Album não encontrado</Text>
      </View>
    );
  }

  const album = albumAtual;

  const adicionarAvaliacao = () => {
    const texto = comentario.trim();
    if (nota === 0 || !texto) {
      setErroAvaliacao('Selecione uma nota e escreva um comentário.');
      return;
    }

    Keyboard.dismiss();
    setAvaliacoes((atuais) => [{ nota, comentario: texto }, ...atuais]);
    setNota(0);
    setComentario('');
    setErroAvaliacao('');
  };

  console.log('validar login');


  //let logado=false;

 // if(!logado){
  //  return (
     // <View style={styles.container}>
      //  <Text style={styles.titulo}>Você precisa estar logado para acessar esta página.</Text>
     // </View>
  //  );
 // }


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
            <Image source={{ uri: album.imagem }} style={styles.imagem} resizeMode="cover" />
            <View style={styles.overlay} />
          </View>

          <View style={styles.detalhesContainer}>
            <Text style={styles.titulo}>{album.titulo}</Text>
            <Text style={styles.artista}>{album.artista}</Text>
            <View style={styles.informacoesContainer}>
              <View style={styles.informacao}>
                <Text style={styles.rotulo}>Lançamento</Text>
                <Text style={styles.valor}>{album.ano}</Text>
              </View>
              <View style={styles.informacao}>
                <Text style={styles.rotulo}>Gênero</Text>
                <Text style={styles.valor}>{album.genero}</Text>
              </View>
            </View>
          </View>

          <View style={styles.avaliacaoContainer}>
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
                    color="#FFD700"
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
              }}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            {erroAvaliacao ? <Text style={styles.erroAvaliacao}>{erroAvaliacao}</Text> : null}

            <TouchableOpacity
              style={styles.botaoAvaliar}
              onPress={adicionarAvaliacao}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotaoAvaliar}>Adicionar avaliação</Text>
            </TouchableOpacity>

            {avaliacoes.length > 0 && (
              <View style={styles.listaAvaliacoes}>
                <Text style={styles.subtitulo}>Sua avaliação nesta sessão</Text>
                {avaliacoes.map((avaliacao, index) => (
                  <View key={`${index}-${avaliacao.nota}`} style={styles.avaliacao}>
                    <View style={styles.estrelasAvaliacao}>
                      {Array.from({ length: avaliacao.nota }, (_, estrela) => (
                        <Ionicons key={estrela} name="star" size={16} color="#FFD700" />
                      ))}
                    </View>
                    <Text style={styles.textoAvaliacao}>{avaliacao.comentario}</Text>
                  </View>
                ))}
              </View>
            )}
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
  botaoAvaliar: {
    alignItems: 'center',
    backgroundColor: '#e4b600',
    borderRadius: 10,
    marginTop: 14,
    paddingVertical: 12,
  },
  textoBotaoAvaliar: {
    color: '#131212',
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
});