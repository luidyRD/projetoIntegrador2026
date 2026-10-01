import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import DadosMusicas from '../../rotaServidor/dados';

export default function Musica() {
  const { id } = useLocalSearchParams();
  const musicId = Array.isArray(id) ? id[0] : id;

  const categorias = DadosMusicas();
  const musicEncontrada = categorias
    .flatMap((categoria) => categoria.albuns ?? [])
    .find((musica: any) => musica.id === musicId);

  if (!musicEncontrada) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Album não encontrado</Text>
      </View>
    );
  }

  const musica: any = musicEncontrada;
  const tags = [musica.ano ?? 'N/A', musica.duracao ?? 'N/A', musica.classificacao ?? 'N/A'];

  return (
    <>
      <Stack.Screen
        options={{
          title: musica.titulo,
          headerStyle: { backgroundColor: '#131212' },
          headerTitleStyle: { color: '#fff' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.imagemContainer}>
            <Image source={{ uri: musica.imagem }} style={styles.imagem} resizeMode="cover" />
            <View style={styles.overlay} />
          </View>

          <View style={styles.detalhesContainer}>
            <Text style={styles.titulo}>{musica.titulo}</Text>

            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View
                  key={`${tag}-${index}`}
                  style={[styles.badge, index === 2 && styles.badgeClassificacao]}
                >
                  <Text style={styles.badgeTexto}>{tag}</Text>
                </View>
              ))}

              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingTexto}>{musica.relevancia ?? 'N/A'}</Text>
              </View>
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  badge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeClassificacao: {
    backgroundColor: '#b31414',
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  ratingTexto: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
});