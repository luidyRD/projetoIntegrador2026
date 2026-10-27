import React, { useEffect, useState } from "react";
import { Link, Stack, router } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { albunsService, Genero } from "../../services/albuns";
import { obterUsuarioSessao } from "../../services/auth";

const maxFaixas = 10;

type FaixaFormulario = {
    id: string;
    titulo: string;
};

const novaFaixa = (): FaixaFormulario => ({
    id: `${Date.now()}-${Math.random()}`,
    titulo: "",
});

function formatarDataLancamento(valor: string) {
    const digitos = valor.replace(/\D/g, "").slice(0, 8);
    if (digitos.length <= 2) {
        return digitos;
    }
    if (digitos.length <= 4) {
        return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export default function CadastroArtistaIndependente() {
    const [logado, setLogado] = useState<boolean | null>(null);
    const [generos, setGeneros] = useState<Genero[]>([]);
    const [nomeArtista, setNomeArtista] = useState("");
    const [pais, setPais] = useState("");
    const [biografia, setBiografia] = useState("");
    const [generoId, setGeneroId] = useState("");
    const [tituloAlbum, setTituloAlbum] = useState("");
    const [dataLancamento, setDataLancamento] = useState("");
    const [capaUrl, setCapaUrl] = useState("");
    const [faixas, setFaixas] = useState<FaixaFormulario[]>([novaFaixa()]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;
        Promise.all([obterUsuarioSessao(), albunsService.listarGeneros()])
            .then(([usuario, listaGeneros]) => {
                if (ativo) {
                    setLogado(Boolean(usuario));
                    setGeneros(listaGeneros);
                }
            })
            .catch((error: unknown) => {
                if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o formulário.");
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });
        return () => {
            ativo = false;
        };
    }, []);

    const atualizarFaixa = (id: string, alteracoes: Partial<FaixaFormulario>) => {
        setFaixas((atuais) =>
            atuais.map((faixa) => faixa.id === id ? { ...faixa, ...alteracoes } : faixa)
        );
    };

    const enviarCadastro = async () => {
        setErro("");
        if (!logado) {
            setErro("Entre na sua conta antes de cadastrar um artista independente.");
            return;
        }
        if (!nomeArtista.trim() || !tituloAlbum.trim() || !generoId) {
            setErro("Preencha o nome do artista, o gênero e o nome do álbum.");
            return;
        }
        if (!faixas.length || faixas.some((faixa) => !faixa.titulo.trim())) {
            setErro("Informe o título de cada faixa.");
            return;
        }
        let dataLancamentoIso = "";
        if (dataLancamento) {
            const correspondencia = dataLancamento.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!correspondencia) {
                setErro("Informe a data no formato DD/MM/AAAA.");
                return;
            }
            const [, dia, mes, ano] = correspondencia;
            const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
            if (
                Number(ano) < 1000 ||
                data.getUTCFullYear() !== Number(ano) ||
                data.getUTCMonth() !== Number(mes) - 1 ||
                data.getUTCDate() !== Number(dia)
            ) {
                setErro("Informe uma data de lançamento válida.");
                return;
            }
            dataLancamentoIso = `${ano}-${mes}-${dia}`;
        }
        if (capaUrl && !/^https:\/\/.+/i.test(capaUrl.trim())) {
            setErro("O endereço da capa deve começar com https://.");
            return;
        }

        setEnviando(true);
        try {
            const resultado = await albunsService.cadastrarArtistaIndependente(
                {
                    nomeArtista: nomeArtista.trim(),
                    pais: pais.trim(),
                    biografia: biografia.trim(),
                    generoId,
                    tituloAlbum: tituloAlbum.trim(),
                    dataLancamento: dataLancamentoIso,
                    capaUrl: capaUrl.trim(),
                },
                faixas.map((faixa) => ({ titulo: faixa.titulo.trim() }))
            );
            router.replace({
                pathname: "/artista/[id]",
                params: { id: resultado.artistaId },
            });
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível cadastrar o artista.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <Stack.Screen options={{ title: "Cadastrar artista independente" }} />
            <Text style={styles.titulo}>Publique seu projeto</Text>
            <Text style={styles.descricao}>
                Informe os dados do artista, do álbum e os títulos das músicas.
            </Text>
            {carregando ? (
                <ActivityIndicator color="#e4b600" style={styles.feedback} />
            ) : !logado ? (
                <View style={styles.loginBox}>
                    <Text style={styles.descricao}>É necessário entrar na sua conta para cadastrar e gerenciar o envio.</Text>
                    <Link href="/login" asChild>
                        <Pressable style={styles.botaoPrincipal}>
                            <Text style={styles.textoBotaoPrincipal}>Entrar na conta</Text>
                        </Pressable>
                    </Link>
                </View>
            ) : (
                <>
                    <Text style={styles.secao}>Informações do artista</Text>
                    <TextInput
                        style={styles.campo}
                        placeholder="Nome artístico *"
                        placeholderTextColor="#8E8E8E"
                        value={nomeArtista}
                        onChangeText={setNomeArtista}
                        maxLength={150}
                    />
                    <TextInput
                        style={styles.campo}
                        placeholder="País"
                        placeholderTextColor="#8E8E8E"
                        value={pais}
                        onChangeText={setPais}
                        maxLength={60}
                    />
                    <TextInput
                        style={[styles.campo, styles.biografia]}
                        placeholder="Biografia ou apresentação do projeto"
                        placeholderTextColor="#8E8E8E"
                        value={biografia}
                        onChangeText={setBiografia}
                        multiline
                        maxLength={3000}
                    />

                    <Text style={styles.secao}>Informações do álbum</Text>
                    <TextInput
                        style={styles.campo}
                        placeholder="Nome do álbum *"
                        placeholderTextColor="#8E8E8E"
                        value={tituloAlbum}
                        onChangeText={setTituloAlbum}
                        maxLength={150}
                    />
                    <TextInput
                        style={styles.campo}
                        placeholder="Data de lançamento (DD/MM/AAAA)"
                        placeholderTextColor="#8E8E8E"
                        value={dataLancamento}
                        onChangeText={(valor) => setDataLancamento(formatarDataLancamento(valor))}
                        maxLength={10}
                        keyboardType="number-pad"
                    />
                    <TextInput
                        style={styles.campo}
                        placeholder="URL HTTPS da capa do álbum (opcional)"
                        placeholderTextColor="#8E8E8E"
                        value={capaUrl}
                        onChangeText={setCapaUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                        maxLength={255}
                    />
                    <Text style={styles.rotulo}>Gênero musical *</Text>
                    <View style={styles.generos}>
                        {generos.map((genero) => (
                            <Pressable
                                key={genero.id}
                                onPress={() => setGeneroId(genero.id)}
                                style={[styles.genero, generoId === genero.id && styles.generoSelecionado]}
                            >
                                <Text style={[styles.textoGenero, generoId === genero.id && styles.textoGeneroSelecionado]}>
                                    {genero.nome}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.faixasTituloLinha}>
                        <View>
                            <Text style={styles.secao}>Músicas</Text>
                            <Text style={styles.dica}>Adicione de 1 a {maxFaixas} faixas.</Text>
                        </View>
                        {faixas.length < maxFaixas ? (
                            <Pressable
                                onPress={() => setFaixas((atuais) => [...atuais, novaFaixa()])}
                                style={styles.botaoAdicionar}
                                accessibilityRole="button"
                                accessibilityLabel="Adicionar faixa"
                            >
                                <Ionicons name="add" size={23} color="#e4b600" />
                            </Pressable>
                        ) : null}
                    </View>

                    {faixas.map((faixa, indice) => (
                        <View key={faixa.id} style={styles.faixaCard}>
                            <View style={styles.faixaCabecalho}>
                                <Text style={styles.rotulo}>Faixa {indice + 1}</Text>
                                {faixas.length > 1 ? (
                                    <Pressable
                                        onPress={() => setFaixas((atuais) => atuais.filter((item) => item.id !== faixa.id))}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Remover faixa ${indice + 1}`}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF7777" />
                                    </Pressable>
                                ) : null}
                            </View>
                            <TextInput
                                style={styles.campo}
                                placeholder="Nome da música *"
                                placeholderTextColor="#8E8E8E"
                                value={faixa.titulo}
                                onChangeText={(titulo) => atualizarFaixa(faixa.id, { titulo })}
                                maxLength={150}
                            />
                        </View>
                    ))}

                    {erro ? <Text style={styles.erro}>{erro}</Text> : null}
                    <Pressable
                        style={[styles.botaoPrincipal, enviando && styles.botaoDesativado]}
                        onPress={() => void enviarCadastro()}
                        disabled={enviando}
                    >
                        {enviando ? (
                            <ActivityIndicator color="#141414" />
                        ) : (
                            <Text style={styles.textoBotaoPrincipal}>Cadastrar artista e álbum</Text>
                        )}
                    </Pressable>
                </>
            )}
            {erro && !logado ? <Text style={styles.erro}>{erro}</Text> : null}
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
        paddingBottom: 36,
        gap: 12,
    },
    titulo: {
        color: "#FFFFFF",
        fontSize: 25,
        fontWeight: "700",
    },
    descricao: {
        color: "#B3B3B3",
        lineHeight: 21,
        marginBottom: 8,
    },
    secao: {
        color: "#FFFFFF",
        fontSize: 19,
        fontWeight: "700",
        marginTop: 12,
    },
    campo: {
        color: "#FFFFFF",
        backgroundColor: "#1E1E1E",
        borderColor: "#373737",
        borderWidth: 1,
        borderRadius: 9,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 15,
    },
    biografia: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    rotulo: {
        color: "#D0D0D0",
        fontWeight: "600",
    },
    generos: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    genero: {
        borderWidth: 1,
        borderColor: "#444444",
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    generoSelecionado: {
        backgroundColor: "#e4b600",
        borderColor: "#e4b600",
    },
    textoGenero: {
        color: "#D0D0D0",
        fontSize: 13,
    },
    textoGeneroSelecionado: {
        color: "#141414",
        fontWeight: "700",
    },
    faixasTituloLinha: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    dica: {
        color: "#8E8E8E",
        fontSize: 12,
        marginTop: 4,
    },
    botaoAdicionar: {
        padding: 8,
    },
    faixaCard: {
        backgroundColor: "#191919",
        borderWidth: 1,
        borderColor: "#303030",
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    faixaCabecalho: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    erro: {
        color: "#FF7777",
        lineHeight: 20,
    },
    feedback: {
        padding: 24,
    },
    loginBox: {
        gap: 12,
        marginTop: 12,
    },
    botaoPrincipal: {
        minHeight: 48,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e4b600",
        borderRadius: 9,
        padding: 14,
        marginTop: 8,
    },
    textoBotaoPrincipal: {
        color: "#141414",
        fontWeight: "700",
        fontSize: 15,
    },
    botaoDesativado: {
        opacity: 0.65,
    },
});
