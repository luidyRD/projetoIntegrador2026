import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { authService, UsuarioSessao } from "../services/auth";

export default function Perfil() {
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
    const [nome, setNome] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [feedback, setFeedback] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        let ativo = true;
        authService.perfil()
            .then((dados) => {
                if (ativo) {
                    setUsuario(dados);
                    setNome(dados.nome);
                    setUsername(dados.username);
                    setEmail(dados.email);
                }
            })
            .catch((error: unknown) => {
                if (!ativo) return;
                if (error instanceof Error && error.message.includes("Entre na sua conta")) {
                    void authService.sair();
                    router.replace("/login");
                    return;
                }
                setFeedback(error instanceof Error ? error.message : "Não foi possível carregar o perfil.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => {
            ativo = false;
        };
    }, []);

    const salvar = async () => {
        if (!usuario || salvando) return;
        setFeedback("");

        if (!nome.trim() || !username.trim() || !email.trim()) {
            setFeedback("Preencha nome, nome de usuário e e-mail.");
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
        if (novaSenha || senhaAtual || confirmarSenha) {
            if (!senhaAtual) {
                setFeedback("Digite sua senha atual para alterá-la.");
                return;
            }
            if (novaSenha.length < 8) {
                setFeedback("A nova senha deve ter pelo menos 8 caracteres.");
                return;
            }
            if (novaSenha !== confirmarSenha) {
                setFeedback("A confirmação da nova senha não confere.");
                return;
            }
        }

        setSalvando(true);
        try {
            const atualizado = await authService.atualizarPerfil({
                nome: nome.trim(),
                username: username.trim(),
                email: email.trim(),
                ...(novaSenha ? { senhaAtual, novaSenha } : {}),
            });
            setUsuario(atualizado);
            setNome(atualizado.nome);
            setUsername(atualizado.username);
            setEmail(atualizado.email);
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");
            setFeedback("Perfil atualizado com sucesso.");
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
        } finally {
            setSalvando(false);
        }
    };

    const sair = async () => {
        try {
            await authService.sair();
            router.replace("/");
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : "Não foi possível sair da conta.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: "Meu perfil",
                    headerStyle: { backgroundColor: "#141414" },
                    headerTitleStyle: { color: "#FFFFFF" },
                    headerTintColor: "#FFFFFF",
                }}
            />
            {carregando ? (
                <View style={styles.carregando}>
                    <ActivityIndicator color="#e4b600" />
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.conteudo}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={38} color="#141414" />
                        </View>
                        <Text style={styles.titulo}>Dados da conta</Text>

                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>Nome</Text>
                            <TextInput
                                style={styles.input}
                                value={nome}
                                onChangeText={setNome}
                                maxLength={50}
                                autoCapitalize="words"
                            />
                        </View>
                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>Nome de usuário</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                maxLength={30}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>E-mail</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                maxLength={30}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <Text style={[styles.titulo, styles.tituloSenha]}>Alterar senha</Text>
                        <Text style={styles.ajuda}>
                            Deixe os campos vazios se não quiser alterar sua senha.
                        </Text>
                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>Senha atual</Text>
                            <TextInput
                                style={styles.input}
                                value={senhaAtual}
                                onChangeText={setSenhaAtual}
                                secureTextEntry
                                autoComplete="current-password"
                            />
                        </View>
                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>Nova senha</Text>
                            <TextInput
                                style={styles.input}
                                value={novaSenha}
                                onChangeText={setNovaSenha}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                        </View>
                        <View style={styles.campo}>
                            <Text style={styles.rotulo}>Confirme a nova senha</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmarSenha}
                                onChangeText={setConfirmarSenha}
                                secureTextEntry
                                autoComplete="new-password"
                            />
                        </View>

                        {feedback ? (
                            <Text
                                accessibilityLiveRegion="polite"
                                style={feedback === "Perfil atualizado com sucesso." ? styles.sucesso : styles.erro}
                            >
                                {feedback}
                            </Text>
                        ) : null}

                        <Pressable
                            style={({ pressed }) => [styles.botaoSalvar, pressed && styles.pressionado]}
                            onPress={salvar}
                            disabled={salvando || !usuario}
                        >
                            <Text style={styles.textoBotao}>
                                {salvando ? "Salvando..." : "Salvar alterações"}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.botaoSair, pressed && styles.pressionado]}
                            onPress={sair}
                        >
                            <Text style={styles.textoSair}>Sair da conta</Text>
                        </Pressable>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#141414",
    },
    flex: {
        flex: 1,
    },
    carregando: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    conteudo: {
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        padding: 24,
        paddingBottom: 48,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#e4b600",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginVertical: 12,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 16,
    },
    tituloSenha: {
        marginTop: 24,
        marginBottom: 4,
    },
    ajuda: {
        color: "#B3B3B3",
        fontSize: 13,
        marginBottom: 14,
    },
    campo: {
        gap: 7,
        marginBottom: 14,
    },
    rotulo: {
        color: "#F8FAFC",
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        backgroundColor: "#1E293B",
        color: "#FFFFFF",
        paddingHorizontal: 14,
        fontSize: 15,
    },
    erro: {
        color: "#FF7777",
        fontSize: 14,
        marginBottom: 12,
    },
    sucesso: {
        color: "#9BE7A5",
        fontSize: 14,
        marginBottom: 12,
    },
    botaoSalvar: {
        minHeight: 52,
        borderRadius: 10,
        backgroundColor: "#e4b600",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    textoBotao: {
        color: "#141414",
        fontSize: 15,
        fontWeight: "700",
    },
    botaoSair: {
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    textoSair: {
        color: "#FF7777",
        fontSize: 15,
        fontWeight: "600",
    },
    pressionado: {
        opacity: 0.75,
    },
});
