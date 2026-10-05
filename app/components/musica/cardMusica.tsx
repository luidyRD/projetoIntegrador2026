import {Image, StyleSheet } from 'react-native';
import {Link} from 'expo-router';

export default function CardAlbum({ item }: { item: any }) {
    return (
        <Link href={{ pathname: '/components/musica/[id]', params: { id: String(item.id) } } as any}>
            <Image
                source={{ uri: item.imagem }}
                style={styles.album}
            />
        </Link>
    );
}
const styles = StyleSheet.create({
    album: {
        width: 160,
        height: 160,
        borderRadius: 5,
        margin: 10,
        justifyContent: 'flex-end',
        padding: 10,
    },
});