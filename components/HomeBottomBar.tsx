import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeBottomBar() {
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const favoritosAtivos = pathname === "/favoritos";

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para a tela inicial"
                onPress={() => router.replace("/(tabs)")}
                style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
            >
                <Ionicons name="home" size={22} color={!favoritosAtivos ? "#e4b600" : "#B3B3B3"} />
                <Text style={styles.rotulo}>Início</Text>
            </Pressable>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir álbuns favoritos"
                accessibilityState={{ selected: favoritosAtivos }}
                onPress={() => router.push("/favoritos")}
                style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
            >
                <Ionicons
                    name={favoritosAtivos ? "heart" : "heart-outline"}
                    size={22}
                    color={favoritosAtivos ? "#e4b600" : "#B3B3B3"}
                />
                <Text style={[styles.rotulo, favoritosAtivos && styles.rotuloAtivo]}>Favoritos</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#141414",
        borderTopColor: "#333333",
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 8,
        flexDirection: "row",
        justifyContent: "space-around",
    },
    botao: {
        flex: 1,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    pressionado: {
        opacity: 0.7,
    },
    rotulo: {
        color: "#B3B3B3",
        fontSize: 12,
        fontWeight: "500",
    },
    rotuloAtivo: {
        color: "#FFFFFF",
    },
});
