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
         renderItem={({ item }) => (<Text>{item.titulo}</Text>)}
         />          
        </View >
    );
}

const styles = StyleSheet.create({
    corFundo: {
        backgroundColor: '#131212',
    }
});




