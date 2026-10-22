import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import AlbumLista from "../../components/AlbumLista";
import { obterUsuarioSessao, UsuarioSessao } from "../../services/auth";
import { Album, Artista, albunsService } from "../../services/albuns";
import { EstadoApoioArtista, pagamentosService } from "../../services/pagamentos";

type ArtistaDetalhe = Artista & { biografia: string | null; albuns: Album[] };

export default function ArtistaDetalhePage() {
    const { id } = useLocalSearchParams<{ id: string | string[] }>();
    const artistaId = Array.isArray(id) ? id[0] : id;
    const [artista, setArtista] = useState<ArtistaDetalhe | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [estadoApoio, setEstadoApoio] = useState<EstadoApoioArtista | null>(null);
    const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
    const [valorApoio, setValorApoio] = useState("10");
    const [feedbackApoio, setFeedbackApoio] = useState("");
    const [processandoApoio, setProcessandoApoio] = useState(false);

    useEffect(() => {
        let ativo = true;
        if (!artistaId) {
            setErro("Artista inválido.");
            setCarregando(false);
            return;
        }
        albunsService.buscarArtista(artistaId)
            .then((resultado) => {
                if (ativo) setArtista(resultado);
            })
            .catch((error: unknown) => {
                if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar o artista.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, [artistaId]);

    useFocusEffect(useCallback(() => {
        if (!artistaId) return undefined;
        let ativo = true;
        Promise.all([
            pagamentosService.obterEstadoArtista(artistaId),
            obterUsuarioSessao(),
        ])
            .then(([estado, sessao]) => {
                if (!ativo) return;
                setEstadoApoio(estado);
                setUsuario(sessao);
                setFeedbackApoio("");
            })
            .catch((error: unknown) => {
                if (ativo) {
                    setFeedbackApoio(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível carregar as opções de apoio."
                    );
                }
            });
        return () => {
            ativo = false;
        };
    }, [artistaId]));

    const conectarConta = async () => {
        if (!artistaId || processandoApoio) return;
        setProcessandoApoio(true);
        setFeedbackApoio("");
        try {
            const resposta = await pagamentosService.iniciarVinculo(artistaId);
            await Linking.openURL(resposta.url);
        } catch (error) {
            setFeedbackApoio(
                error instanceof Error ? error.message : "Não foi possível iniciar a conexão."
            );
        } finally {
            setProcessandoApoio(false);
        }
    };

    const apoiar = async () => {
        if (!artistaId || processandoApoio) return;
        if (!usuario) {
            router.push("/login");
            return;
        }
        const valor = Number(valorApoio.trim().replace(",", "."));
        if (!Number.isFinite(valor) || Math.round(valor * 100) !== valor * 100 || valor < 1 || valor > 1000) {
            setFeedbackApoio("Informe um valor entre R$ 1,00 e R$ 1.000,00.");
            return;
        }
        setProcessandoApoio(true);
        setFeedbackApoio("");
        try {
            const apoio = await pagamentosService.criarApoio(artistaId, valor);
            await Linking.openURL(apoio.checkoutUrl);
        } catch (error) {
            setFeedbackApoio(
                error instanceof Error ? error.message : "Não foi possível iniciar o pagamento."
            );
        } finally {
            setProcessandoApoio(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
            <Stack.Screen options={{ title: artista?.nome || "Artista" }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedback}>{erro}</Text>
            ) : artista ? (
                <>
                    {artista.foto ? (
                        <Image source={{ uri: artista.foto }} style={styles.foto} />
                    ) : null}
                    <Text style={styles.titulo}>{artista.nome}</Text>
                    {artista.pais ? <Text style={styles.pais}>{artista.pais}</Text> : null}
                    {artista.biografia ? <Text style={styles.bio}>{artista.biografia}</Text> : null}
                    {feedbackApoio && !estadoApoio?.independente ? (
                        <Text style={styles.erroApoio}>{feedbackApoio}</Text>
                    ) : null}
                    {estadoApoio?.independente ? (
                        <View style={styles.apoio}>
                            <Text style={styles.subtituloApoio}>Apoie este artista</Text>
                            <Text style={styles.ajudaApoio}>
                                O pagamento é feito diretamente pelo Mercado Pago. As taxas do provedor podem se aplicar.
                            </Text>
                            {estadoApoio.souProprietario ? (
                                estadoApoio.contaVinculada ? (
                                    <Text style={styles.contaVinculada}>Conta de recebimento conectada</Text>
                                ) : (
                                    <Pressable
                                        style={[styles.botao, !estadoApoio.pagamentosConfigurados && styles.botaoDesabilitado]}
                                        onPress={conectarConta}
                                        disabled={processandoApoio || !estadoApoio.pagamentosConfigurados}
                                    >
                                        <Text style={styles.textoBotao}>
                                            {processandoApoio ? "Conectando..." : "Conectar conta do Mercado Pago"}
                                        </Text>
                                    </Pressable>
                                )
                            ) : estadoApoio.contaVinculada && estadoApoio.pagamentosConfigurados ? (
                                <>
                                    <TextInput
                                        style={styles.inputApoio}
                                        value={valorApoio}
                                        onChangeText={setValorApoio}
                                        keyboardType="decimal-pad"
                                        placeholder="Valor em reais (ex.: 10,00)"
                                        placeholderTextColor="#888888"
                                        accessibilityLabel="Valor do apoio em reais"
                                    />
                                    <Pressable
                                        style={styles.botao}
                                        onPress={apoiar}
                                        disabled={processandoApoio}
                                    >
                                        <Text style={styles.textoBotao}>
                                            {processandoApoio ? "Abrindo pagamento..." : "Apoiar com Pix ou cartão"}
                                        </Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Text style={styles.ajudaApoio}>
                                    {estadoApoio.pagamentosConfigurados
                                        ? "Este artista ainda não conectou uma conta de recebimento."
                                        : "Os pagamentos ainda não estão configurados pelo administrador."}
                                </Text>
                            )}
                            {feedbackApoio ? <Text style={styles.erroApoio}>{feedbackApoio}</Text> : null}
                        </View>
                    ) : null}
                    <Text style={styles.subtitulo}>Álbuns ({artista.albuns.length})</Text>
                    <AlbumLista albuns={artista.albuns} />
                </>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#141414",
    },
    conteudo: {
        padding: 16,
    },
    foto: {
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: "#292929",
        marginBottom: 16,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "700",
    },
    pais: {
        color: "#e4b600",
        marginTop: 6,
    },
    bio: {
        color: "#D0D0D0",
        marginTop: 14,
        lineHeight: 22,
    },
    subtitulo: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 28,
        marginBottom: 16,
    },
    feedback: {
        color: "#FFFFFF",
        textAlign: "center",
        padding: 24,
    },
    apoio: {
        backgroundColor: "#202020",
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
    },
    subtituloApoio: {
        color: "#FFFFFF",
        fontSize: 19,
        fontWeight: "700",
    },
    ajudaApoio: {
        color: "#BBBBBB",
        lineHeight: 20,
        marginTop: 8,
    },
    inputApoio: {
        borderWidth: 1,
        borderColor: "#555555",
        borderRadius: 8,
        color: "#FFFFFF",
        padding: 12,
        marginTop: 14,
        marginBottom: 10,
    },
    botao: {
        backgroundColor: "#e4b600",
        borderRadius: 8,
        padding: 13,
        alignItems: "center",
        marginTop: 12,
    },
    botaoDesabilitado: {
        opacity: 0.5,
    },
    textoBotao: {
        color: "#141414",
        fontWeight: "700",
        textAlign: "center",
    },
    contaVinculada: {
        color: "#e4b600",
        fontWeight: "600",
        marginTop: 12,
    },
    erroApoio: {
        color: "#ff8f8f",
        marginTop: 10,
    },
});
