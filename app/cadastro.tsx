import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../services/auth";

export default function Cadastro() {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [enviando, setEnviando] = useState(false);

    const handleCadastro = async () => {
        if (enviando) return;
        if (!name.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
            setFeedback("Preencha todos os campos para continuar.");
            return;
        }

        if (!/^[\p{L}\p{N}._-]{3,30}$/u.test(username.trim())) {
            setFeedback("O nome de usuário deve ter de 3 a 30 caracteres (letras, números, ponto, hífen ou sublinhado).");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setFeedback("Digite um e-mail válido.");
            return;
        }

        if (password.length < 8) {
            setFeedback("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setFeedback("As senhas não coincidem.");
            return;
        }

        setEnviando(true);
        try {
            await authService.cadastrar({
                nome: name.trim(),
                username: username.trim(),
                email: email.trim(),
                senha: password,
            });
            router.replace("/");
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : "Não foi possível criar sua conta.");
        } finally {
            setEnviando(false);
        }
    };

    const clearFeedback = () => setFeedback("");

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.brandIcon}>
                            <Ionicons name="musical-notes" size={27} color="#141414" />
                        </View>

                        <View style={styles.heading}>
                            <Text style={styles.title}>Crie sua conta</Text>
                            <Text style={styles.subtitle}>
                                Prepare-se para encontrar sua próxima música favorita.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Nome</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Como podemos te chamar?"
                                        placeholderTextColor="#64748B"
                                        value={name}
                                        onChangeText={(value) => {
                                            setName(value);
                                            clearFeedback();
                                        }}
                                        autoCapitalize="words"
                                        autoComplete="name"
                                        textContentType="name"
                                        returnKeyType="next"
                                        maxLength={50}
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Nome de usuário</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="at-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Seu nome de usuário"
                                        placeholderTextColor="#64748B"
                                        value={username}
                                        onChangeText={(value) => {
                                            setUsername(value);
                                            clearFeedback();
                                        }}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        maxLength={30}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>E-mail</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="voce@exemplo.com"
                                        placeholderTextColor="#64748B"
                                        value={email}
                                        onChangeText={(value) => {
                                            setEmail(value);
                                            clearFeedback();
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="email"
                                        textContentType="emailAddress"
                                        returnKeyType="next"
                                        maxLength={30}
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Senha</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pelo menos 8 caracteres"
                                        placeholderTextColor="#64748B"
                                        value={password}
                                        onChangeText={(value) => {
                                            setPassword(value);
                                            clearFeedback();
                                        }}
                                        secureTextEntry={!passwordVisible}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                        returnKeyType="next"
                                    />
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                                        onPress={() => setPasswordVisible((visible) => !visible)}
                                        hitSlop={8}
                                    >
                                        <Ionicons
                                            name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Confirme sua senha</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Digite sua senha novamente"
                                        placeholderTextColor="#64748B"
                                        value={confirmPassword}
                                        onChangeText={(value) => {
                                            setConfirmPassword(value);
                                            clearFeedback();
                                        }}
                                        secureTextEntry={!passwordVisible}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                        returnKeyType="done"
                                        onSubmitEditing={handleCadastro}
                                    />
                                </View>
                            </View>

                            {feedback ? (
                                <Text accessibilityLiveRegion="polite" style={styles.feedback}>
                                    {feedback}
                                </Text>
                            ) : null}

                            <Pressable
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    pressed && styles.submitButtonPressed,
                                ]}
                                onPress={handleCadastro}
                                disabled={enviando}
                            >
                                <Text style={styles.submitButtonText}>
                                    {enviando ? "Criando conta..." : "Criar conta"}
                                </Text>
                                <Ionicons name="arrow-forward" size={19} color="#141414" />
                            </Pressable>
                        </View>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Já tem uma conta?</Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => router.push("/login")}
                            >
                                <Text style={styles.textLink}>Entrar</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#141414",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
    },
    content: {
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
        paddingHorizontal: 28,
        paddingVertical: 28,
    },
    brandIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "#e4b600",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 24,
    },
    heading: {
        marginBottom: 24,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 29,
        lineHeight: 36,
        fontWeight: "700",
        textAlign: "center",
    },
    subtitle: {
        color: "#B3B3B3",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginTop: 10,
    },
    form: {
        gap: 16,
    },
    field: {
        gap: 9,
    },
    label: {
        color: "#F8FAFC",
        fontSize: 14,
        fontWeight: "600",
    },
    inputWrapper: {
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingHorizontal: 15,
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 12,
    },
    input: {
        flex: 1,
        height: "100%",
        color: "#F8FAFC",
        fontSize: 15,
    },
    feedback: {
        color: "#FBBF24",
        fontSize: 13,
        lineHeight: 19,
        marginTop: -4,
    },
    submitButton: {
        minHeight: 54,
        backgroundColor: "#e4b600",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 2,
    },
    submitButtonPressed: {
        opacity: 0.82,
    },
    submitButtonText: {
        color: "#141414",
        fontSize: 16,
        fontWeight: "700",
    },
    loginRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 26,
    },
    loginText: {
        color: "#B3B3B3",
        fontSize: 14,
    },
    textLink: {
        color: "#e4b600",
        fontSize: 14,
        fontWeight: "600",
    },
});
