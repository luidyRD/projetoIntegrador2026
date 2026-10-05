import {View, Text, FlatList, StyleSheet} from 'react-native';
import CardAlbum from './musica/cardMusica';

export default function CardCategorias({ item }: { item: any }) {
    return (
    <View style={styles.categorias}>
    <Text style={styles.titulo}>{item.titulo}</Text>
    <FlatList
    data={item.albuns}
    keyExtractor={album => album.id}
    horizontal={true}
    showsHorizontalScrollIndicator={false}
    renderItem={({ item }) => <CardAlbum item={item} />}
    />
    </View>
    );
}
const styles = StyleSheet.create({
    categorias: {
        backgroundColor: '#e90000',
    },
    titulo: {
        color: '#fff',
        fontSize: 23,
        marginLeft: 10,
    },
});
