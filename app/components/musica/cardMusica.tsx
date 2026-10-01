import {Image, StyleSheet } from 'react-native';
import {Link} from 'expo-router';

export default function CardMusica({ item }: { item: any }) {
    return (
        <Link href={`/components/musica/${item.id}`}>
        <Image
        source={{ uri: item.imagem }}
        style={styles.musica}
        />
        </Link>
    );
}
const styles = StyleSheet.create({
    musica: {
        width: 180,
        height: 180,
        borderRadius: 5,
        margin: 5,
        justifyContent: 'flex-end',
        padding: 10,
    },
});