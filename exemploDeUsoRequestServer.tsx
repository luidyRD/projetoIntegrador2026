import { useEffect, useState } from "react";
import produtosService, { Produto } from "@/services/produtos";
export default function MinhaTela() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    useEffect(() => {
        async function carregar() {
            try {
                const dados = await produtosService.listarTodos();
                setProdutos(dados);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
            }
        }
        carregar();

        async function addProdutos() {
            const novoProduto: Omit<Produto, "id"> = {
                nome: "Produto de Exemplo",
                categoria: "Eletrônicos",
                preco: 99.90,
                descricao: "Produto criado via API!",
                imagemUrl: "https://example.com/image.jpg",
                estoque: 10,
            };
            const produtoCriado = await produtosService.criar(novoProduto);
            console.log("Produto criado:", produtoCriado);
        }
        addProdutos();
    }, []);
    // ...
}