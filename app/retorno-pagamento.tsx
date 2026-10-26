import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ApoioArtista, pagamentosService } from "../services/pagamentos";

export default function RetornoPagamento() {
    const params = useLocalSearchParams<{
        referencia?: string | string[];
        resultado?: string | string[];
        artistaId?: string | string[];
    }>();
    const referencia = Array.isArray(params.referencia)
        ? params.referencia[0]
        : params.referencia;
    const resultado = Array.isArray(params.resultado)
        ? params.resultado[0]
        : params.resultado;
    const artistaId = Array.isArray(params.artistaId)
        ? params.artistaId[0]
        : params.artistaId;
    const [apoio, setApoio] = useState<ApoioArtista | null>(null);
    const [erro, setErro] = useState("");
    const [consultando, setConsultando] = useState(Boolean(referencia));

    useEffect(() => {
        if (!referencia) return undefined;
        let ativo = true;
        let tentativas = 0;
        let temporizador: ReturnType<typeof setTimeout> | undefined;

        const consultar = async () => {
            try {
                const atual = await pagamentosService.obterApoio(referencia);
                if (!ativo) return;
                setApoio(atual);
                if (atual.status === "approved" || tentativas >= 4) {
                    setConsultando(false);
                    return;
                }
            } catch (error) {
                if (!ativo) return;
                setErro(error instanceof Error ? error.message : "Não foi possível consultar o apoio.");
                setConsultando(false);
                return;
            }
            tentativas += 1;
            temporizador = setTimeout(consultar, 2000);
        };

        void consultar();
        return () => {
            ativo = false;
            clearTimeout(temporizador);
        };
    }, [referencia]);

    let mensagem = "Você voltou do Mercado Pago.";
    if (resultado === "conectado") {
        mensagem = "Conta do Mercado Pago conectada. Volte à página do artista para conferir o vínculo.";
    } else if (resultado === "cancelado") {
        mensagem = "A conexão com o Mercado Pago foi cancelada.";
    } else if (resultado === "erro") {
        mensagem = "Não foi possível conectar a conta. Tente novamente na página do artista.";
    } else if (apoio?.status === "approved") {
        mensagem = `Apoio de R$ ${apoio.valor.toFixed(2).replace(".", ",")} confirmado para ${apoio.artista}.`;
    } else if (apoio) {
        mensagem = `O pagamento está ${apoio.status === "pending" ? "aguardando confirmação" : apoio.status}.`;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Retorno do pagamento",
                    headerStyle: { backgroundColor: "#000000" },
                    headerTitleStyle: { color: "#FFFFFF" },
                    headerTintColor: "#FFFFFF",
                }}
            />
            {consultando ? <ActivityIndicator color="#e4b600" /> : null}
            <Text style={styles.mensagem}>{mensagem}</Text>
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            {consultando ? (
                <Text style={styles.ajuda}>A confirmação pode levar alguns instantes.</Text>
            ) : null}
            <Pressable
                style={styles.botao}
                onPress={() => {
                    if (artistaId) {
                        router.replace({
                            pathname: "/artista/[id]",
                            params: { id: artistaId },
                        });
                    } else {
                        router.replace("/");
                    }
                }}
            >
                <Text style={styles.textoBotao}>
                    {artistaId ? "Voltar à página do artista" : "Voltar ao catálogo"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#141414",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    mensagem: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 26,
        marginTop: 16,
    },
    ajuda: {
        color: "#BBBBBB",
        textAlign: "center",
        marginTop: 10,
    },
    erro: {
        color: "#ff8f8f",
        textAlign: "center",
        marginTop: 12,
    },
    botao: {
        backgroundColor: "#e4b600",
        borderRadius: 8,
        padding: 13,
        marginTop: 24,
    },
    textoBotao: {
        color: "#141414",
        fontWeight: "700",
    },
});
