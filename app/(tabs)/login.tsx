import { Ionicons } from "@expo/vector-icons";
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

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [feedback, setFeedback] = useState("");

    const handleLogin = () => {
        if (!email.trim() || !password) {
            setFeedback("Preencha seu e-mail e sua senha para continuar.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setFeedback("Digite um e-mail válido.");
            return;
        }

        setFeedback("A autenticação ainda não está conectada ao aplicativo.");
    };

    const updateEmail = (value: string) => {
        setEmail(value);
        setFeedback("");
    };

    const updatePassword = (value: string) => {
        setPassword(value);
        setFeedback("");
    };

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
                        <View style={styles.brand}>
                        </View>

                        <View style={styles.heading}>
                            <Text style={styles.title}>Login
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.field}>
                                <Text style={styles.label}>E-mail</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="voce@exemplo.com"
                                        placeholderTextColor="#64748B"
                                        value={email}
                                        onChangeText={updateEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="email"
                                        textContentType="emailAddress"
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Senha</Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        onPress={() => setFeedback("A recuperação de senha ainda não está disponível.")}
                                        hitSlop={8}
                                    >
                                        <Text style={styles.textLink}>Esqueceu a senha?</Text>
                                    </Pressable>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={19} color="#94A3B8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Sua senha"
                                        placeholderTextColor="#64748B"
                                        value={password}
                                        onChangeText={updatePassword}
                                        secureTextEntry={!passwordVisible}
                                        autoCapitalize="none"
                                        autoComplete="password"
                                        textContentType="password"
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
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

                            {feedback ? (
                                <Text accessibilityLiveRegion="polite" style={styles.feedback}>
                                    {feedback}
                                </Text>
                            ) : null}

                            <Pressable
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.loginButton,
                                    pressed && styles.loginButtonPressed,
                                ]}
                                onPress={handleLogin}
                            >
                                <Text style={styles.loginButtonText}>Entrar</Text>
                                <Ionicons name="arrow-forward" size={19} color="#141414" />
                            </Pressable>
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OU</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.signupRow}>
                            <Text style={styles.signupText}>Ainda não tem uma conta?</Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setFeedback("O cadastro ainda não está disponível.")}
                            >
                                <Text style={styles.textLink}>Criar conta</Text>
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
        paddingVertical: 36,
    },
    brand: {
        alignItems: "center",
        marginBottom: 42,
    },
    brandIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "#e4b600",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    brandName: {
        color: "#e4b600",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 3,
    },
    heading: {
        marginBottom: 30,
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
        gap: 20,
    },
    field: {
        gap: 9,
    },
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
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
    textLink: {
        color: "#e4b600",
        fontSize: 13,
        fontWeight: "600",
    },
    feedback: {
        color: "#FBBF24",
        fontSize: 13,
        lineHeight: 19,
        marginTop: -8,
    },
    loginButton: {
        minHeight: 54,
        backgroundColor: "#e4b600",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 4,
    },
    loginButtonPressed: {
        opacity: 0.82,
    },
    loginButtonText: {
        color: "#141414",
        fontSize: 16,
        fontWeight: "700",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginVertical: 26,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#334155",
    },
    dividerText: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1,
    },
    signupRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    signupText: {
        color: "#B3B3B3",
        fontSize: 14,
    },
    footer: {
        color: "#475569",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 2,
        textAlign: "center",
        marginTop: 48,
    },
});
