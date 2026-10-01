import { View, StyleSheet, FlatList, Text, Image} from 'react-native';
import InputBusca from '../components/inputBusca';
import { Link } from 'expo-router';
import DadosMusicas from '../rotaServidor/dados';

const categorias = DadosMusicas();
export default function App() {
    return (
        <View style={styles.corFundo}>
         <FlatList
         data={categorias}
         keyExtractor={(item) => item.id}
         srcollEnabled={true}
         renderItem={({ item }) => (
            <View>
                <Text>{item.titulo}</Text>
                <FlatList
                data={item.albuns}
                keyExtractor={(album) => album.id}
                horizontal={true}                
                renderItem={({ item }) => (
                    <Link href={{ pathname: '/components/musica/[id]', params: { id: String(item.id) } } as any}>
                        <Image
                            source={{ uri: item.imagem }}
                            style={styles.imagem}
                            resizeMode="cover"
                        />
                    </Link>
                )}
            />  
            </View>
        )}
         />          
        </View >
    );
}

const styles = StyleSheet.create({
    corFundo: {
        backgroundColor: '#b93737',
    },
    imagem: {
        width: 180,
        height: 180,
    }
});




