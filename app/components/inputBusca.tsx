import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface InputBuscaProps {
    placeholder?: string;
}

export default function InputBusca({ placeholder = "Termo da Busca..." }: InputBuscaProps = {}) {
    const [texto, setTexto] = useState("");

    const handleBuscar = () => {
        const termo = texto.trim();
        if (!termo) return;

        //essa linha abaixo fecha o teclado do celular
        Keyboard.dismiss();

        //essa linha abaixo redireciona para a rota /rotas/busca/[query]
        router.push({
            pathname: "/rotas/busca/[query]",
            params: { query: termo },
        } as any);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={texto}
                    onChangeText={setTexto}
                    returnKeyType="search"
                    onSubmitEditing={handleBuscar}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {texto.length > 0 && (
                    <TouchableOpacity
                        style={styles.botaoLimpar}
                        onPress={() => setTexto("")}
                        activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={styles.botaoBusca}
                onPress={handleBuscar}
                activeOpacity={0.8}
            >
                <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 8,
        width: "100%",
    },
    inputWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E293B",
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#334155",
    },
    input: {
        flex: 1,
        height: 40,
        color: "#F8FAFC",
        fontSize: 15,
    },
    botaoLimpar: {
        padding: 4,
    },
    botaoBusca: {
        backgroundColor: "#e4b600",
        width: 44,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
