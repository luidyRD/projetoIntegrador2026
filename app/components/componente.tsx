import { View, Text, StyleSheet } from "react-native";

export default function Componente() {
  return (
    <View style={styles.categorias}>
      <Text>Exemplo de componente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  categorias: {
    color: "white",
    backgroundColor: '#000000'
  },
});
