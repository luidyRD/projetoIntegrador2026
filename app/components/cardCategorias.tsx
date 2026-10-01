import {View, Text, FlatList, StyleSheet} from 'react-native';
import CardMusica from './musica/cardMusica';

export default function CardCategorias({ item }: { item: any }) {
    return (
    <View style={styles.categorias}>
    <Text style={styles.titulo}>{item.titulo}</Text>
    <FlatList
    data={item.filmes}
    keyExtractor={musica => musica.id}
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    renderItem={({ item }) => <CardMusica item={item} />}
    />
    </View>
    );
}
const styles = StyleSheet.create({
    categorias: {
        color: '#fff',
    },
    titulo: {
        color: '#fff',
        fontSize: 20,
        marginLeft: 10,
    },
});

