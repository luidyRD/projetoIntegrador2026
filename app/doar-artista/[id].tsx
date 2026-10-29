import React, { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { Stack, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DadosPix, EstadoApoioArtista, pagamentosService } from "../../services/pagamentos";

export default function DoarArtistaPage() {
    const { id } = useLocalSearchParams<{ id: string | string[] }>();
    const artistaId = Array.isArray(id) ? id[0] : id;
    const [estadoApoio, setEstadoApoio] = useState<EstadoApoioArtista | null>(null);
    const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        let ativo = true;
        if (!artistaId) {
            setErro("Artista inválido.");
            setCarregando(false);
            return;
        }

        const carregarApoio = async () => {
            try {
                const estado = await pagamentosService.obterEstadoArtista(artistaId);
                if (!ativo) return;
                setEstadoApoio(estado);
                if (estado.independente && estado.pixConfigurado) {
                    const pix = await pagamentosService.obterPix();
                    if (ativo) setDadosPix(pix);
                }
            } catch (error) {
                if (ativo) {
                    setErro(error instanceof Error ? error.message : "Não foi possível carregar os dados de doação.");
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        };

        void carregarApoio();
        return () => {
            ativo = false;
        };
    }, [artistaId]);

    const copiarPix = async () => {
        if (!dadosPix) return;
        try {
            await Clipboard.setStringAsync(dadosPix.payload);
            setFeedback("Código Pix copiado. Confira o destinatário antes de pagar.");
        } catch (error) {
            setFeedback(error instanceof Error ? error.message : "Não foi possível copiar o código Pix.");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
            <Stack.Screen options={{ title: "Doar ao artista" }} />
            {carregando ? (
                <ActivityIndicator color="#e4b600" />
            ) : erro ? (
                <Text style={styles.feedbackErro}>{erro}</Text>
            ) : estadoApoio?.independente ? (
                <View style={styles.cartao}>
                    <Text style={styles.titulo}>Apoie este artista</Text>
                    <Text style={styles.descricao}>
                        O valor será enviado para a conta central do projeto, não diretamente para o artista.
                        Escaneie o QR Code ou copie o código e escolha o valor no seu banco.
                    </Text>
                    {estadoApoio.pixConfigurado && dadosPix ? (
                        <>
                            <View style={styles.qrContainer}>
                                <QRCode value={dadosPix.payload} size={220} />
                            </View>
                            <Text style={styles.destinatario}>
                                Destinatário: {dadosPix.receiverName}
                            </Text>
                            <Pressable
                                style={styles.botao}
                                onPress={() => void copiarPix()}
                                accessibilityRole="button"
                            >
                                <Text style={styles.textoBotao}>Copiar código Pix</Text>
                            </Pressable>
                            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
                            <Text style={styles.aviso}>
                                Este QR não identifica automaticamente o pagamento. A confirmação deve ser feita manualmente no banco.
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.descricao}>
                            O Pix ainda não foi configurado pelo administrador.
                        </Text>
                    )}
                </View>
            ) : (
                <Text style={styles.feedbackErro}>As doações não estão disponíveis para este artista.</Text>
            )}
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
        flexGrow: 1,
    },
    cartao: {
        backgroundColor: "#202020",
        borderRadius: 12,
        padding: 16,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
    },
    descricao: {
        color: "#BBBBBB",
        lineHeight: 20,
        marginTop: 10,
    },
    qrContainer: {
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 8,
        marginTop: 22,
    },
    destinatario: {
        color: "#FFFFFF",
        textAlign: "center",
        marginTop: 14,
    },
    botao: {
        backgroundColor: "#e4b600",
        borderRadius: 8,
        padding: 13,
        alignItems: "center",
        marginTop: 14,
    },
    textoBotao: {
        color: "#141414",
        fontWeight: "700",
        textAlign: "center",
    },
    aviso: {
        color: "#BBBBBB",
        lineHeight: 20,
        marginTop: 16,
    },
    feedback: {
        color: "#BBBBBB",
        marginTop: 12,
        textAlign: "center",
    },
    feedbackErro: {
        color: "#ff8f8f",
        textAlign: "center",
        padding: 24,
    },
});
