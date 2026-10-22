# Projeto Integrador 2026

Aplicativo Expo/React Native de catálogo de álbuns. O catálogo e as avaliações são servidos pela API Node.js e armazenados no MySQL; o aplicativo não mantém uma lista local de álbuns.

## Requisitos

- Node.js 18 ou superior
- MySQL em execução, com o banco `loginBD` e as tabelas `albuns`, `artistas`, `generos`, `musicas`, `avaliacoes_albuns`, `usuarios` e a view `vw_media_albuns`
- Expo Go ou emulador

O banco usado pelo projeto já deve conter o catálogo. As avaliações usam a tabela `avaliacoes_albuns`, que permite uma avaliação por usuário e álbum. Ao avaliar novamente, a nota e o comentário anteriores são atualizados.

## Configuração local

1. Instale as dependências do app e do backend:

   ```powershell
   npm install
   npm install --prefix backend
   ```

2. Configure o backend:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Edite `backend\.env` com os dados do seu MySQL. Defina `AUTH_TOKEN_SECRET` com uma chave aleatória de pelo menos 32 caracteres; não compartilhe nem comite esse arquivo. No banco já existente, aplique uma vez `backend/database/email_unico.sql` e `backend/database/perfil_indexes.sql` para impedir e-mails e nomes de usuário duplicados; bancos criados do zero pelo `login.sql` já têm essas restrições.

   Para salvar álbuns favoritos por conta, aplique também uma vez `backend/database/favoritos_albuns.sql` no banco `loginBD`.

   Para habilitar os cadastros de artistas independentes, aplique também uma vez `backend/database/artistas_independentes.sql` no banco `loginBD`.

   Para habilitar apoio financeiro direto a artistas, aplique depois `backend/database/pagamentos_artistas.sql`. A integração usa checkout do Mercado Pago com Pix/cartão, sem carteira de moedas e sem comissão da plataforma configurada. O Mercado Pago pode cobrar as próprias taxas.

   Configure no `backend/.env` as variáveis `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_OAUTH_REDIRECT_URI`, `MP_OAUTH_RETURN_URL`, `MP_TOKEN_ENCRYPTION_KEY`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_URL`, `MP_CHECKOUT_SUCCESS_URL`, `MP_CHECKOUT_PENDING_URL` e `MP_CHECKOUT_FAILURE_URL`. Crie uma aplicação no Mercado Pago e registre o mesmo endereço de callback HTTPS informado em `MP_OAUTH_REDIRECT_URI`. Webhook e retornos do checkout também precisam estar publicados em HTTPS; `localhost` não recebe notificações do provedor. `MP_OAUTH_RETURN_URL` pode ser `myapp://retorno-pagamento` para retornar ao aplicativo instalado ou uma página HTTPS.

   Gere a chave de criptografia dos tokens com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e mantenha-a privada. O padrão `MP_CHECKOUT_MODE=sandbox` evita cobranças reais durante os testes; altere para `production` somente depois de validar a configuração e as contas recebedoras no ambiente de produção. Nunca coloque credenciais Mercado Pago no app Expo nem compartilhe o arquivo `.env`.

3. Configure o app:

   ```powershell
   Copy-Item .env.exemplo .env
   ```

   Para o Expo Web, `http://localhost:3000` pode ser usado como `EXPO_PUBLIC_API_URL`. Para o emulador Android, use `http://10.0.2.2:3000`. Para um celular físico, use o endereço IP local do computador na rede Wi-Fi, por exemplo `http://192.168.0.10:3000`.

4. Inicie a API e o Expo em terminais separados:

   ```powershell
   npm run start:backend
   ```

   ```powershell
   npx expo start
   ```

   Para abrir o aplicativo no navegador do mesmo computador, use `npm run web` no lugar de `npx expo start` e acesse `http://localhost:8081`.

   A API disponibiliza `GET /health`, `GET /albuns`, `GET /albuns/:id`, `GET /albuns/:id/avaliacoes`, `POST /albuns/:id/avaliacoes`, `GET /generos`, `GET /generos/:id/albuns`, `GET /artistas`, `GET /artistas/:id`, `GET /artistas-independentes`, `GET /albuns-independentes`, `POST /artistas-independentes`, `POST /auth/registro`, `POST /auth/login`, `GET /auth/perfil` e `PUT /auth/perfil`.

Cadastro pede nome, nome de usuário, e-mail e senha; senhas são armazenadas com bcrypt. O botão de perfil da tela inicial acompanha a sessão e abre os dados da conta para alterar nome, nome de usuário, e-mail e senha. A senha atual é exigida para escolher uma nova. É necessário entrar para publicar uma avaliação. O token de acesso fica no armazenamento local do app e expira após sete dias.

## Endpoints do catálogo

- `GET /albuns?busca=termo`: lista os álbuns agrupados por gênero.
- `GET /albuns/:id`: retorna os dados, a média das avaliações e as faixas cadastradas.
- `GET /albuns/:id/avaliacoes`: lista as avaliações públicas do álbum.
- `POST /albuns/:id/avaliacoes`: cria ou atualiza a avaliação do usuário autenticado; requer `{ "nota": 1, "comentario": "..." }`.
- `GET /generos`: lista os gêneros em ordem alfabética.
- `GET /generos/:id/albuns`: lista todos os álbuns de um gênero.
- `GET /artistas?busca=termo`: lista artistas ou filtra por nome/álbum.
- `GET /artistas/:id`: retorna os dados do artista e seus álbuns.
- `GET /artistas-independentes`: lista os artistas cadastrados pela comunidade.
- `GET /albuns-independentes`: lista os álbuns independentes agrupados por artista para os destaques do início.
- `POST /artistas-independentes`: exige autenticação e recebe um formulário multipart com dados do artista/álbum e de 1 a 10 arquivos de áudio. Aceita MP3, M4A, AAC, WAV, OGG, FLAC e WEBM, até 25 MB por faixa.

Os arquivos enviados ficam em `backend/uploads/audio/` (pasta ignorada pelo Git) e são servidos por `GET /midias/audio/:arquivo`. Para usar em outros dispositivos da rede, configure o app para apontar ao endereço de rede do computador que executa a API; os uploads ficam armazenados localmente nesse servidor.

## Apoio financeiro direto

O artista independente conecta a própria conta Mercado Pago na página do perfil público do artista. A pessoa apoiadora escolhe um valor entre R$ 1,00 e R$ 1.000,00 e conclui o pagamento no checkout hospedado pelo Mercado Pago, que apresenta os métodos disponíveis para aquela conta, incluindo Pix e cartão quando habilitados. O app não coleta dados de cartão nem armazena saldo.

- `GET /artistas/:id/apoio`: informa se o artista é independente, se vinculou uma conta e se o ambiente de pagamentos está configurado.
- `POST /artistas/:id/pagamentos/conectar`: autenticado; cria o fluxo OAuth apenas para o proprietário do artista.
- `POST /artistas/:id/apoios`: autenticado; cria um checkout em reais e retorna o link hospedado.
- `GET /apoios/:referencia`: autenticado; consulta o estado somente para quem iniciou aquele apoio.
- `POST /webhooks/mercadopago`: valida a assinatura e consulta o pagamento na API do provedor antes de atualizar seu estado no MySQL.

Tokens OAuth são cifrados no banco com AES-256-GCM. Para aceitar apoio real, além da migração, é necessário configurar a aplicação e as URLs HTTPS públicas no Mercado Pago, fornecer o segredo do webhook e testar primeiro em sandbox. O estado de retorno do checkout não substitui a confirmação do webhook.

## Capas, faixas e álbuns internacionais

O script `backend/scripts/enriquecer_catalogo.js` consulta a API pública de busca do iTunes para preencher capas e faixas em falta e acrescentar álbuns internacionais populares. Ele preserva capas e faixas já existentes e procura duplicatas antes de inserir. Para executar, com o MySQL configurado e acessível:

```powershell
npm run catalogo:enriquecer --prefix backend
```

Para preencher somente as capas ausentes, sem adicionar álbuns ou faixas (usa busca concorrente no Deezer e só atualiza correspondências seguras):

```powershell
npm run catalogo:enriquecer --prefix backend -- --covers-only
```

Se ainda houver álbuns sem correspondência, faça uma segunda busca pelo iTunes:

```powershell
npm run catalogo:enriquecer --prefix backend -- --covers-only --itunes
```

O script precisa de acesso à internet para consultar capas e faixas. Se um álbum não tiver correspondência segura, ele é reportado sem ser inserido.

Para completar os álbuns de estúdio e projetos colaborativos de Kanye West que faltam no catálogo, incluindo capas e faixas:

```powershell
node backend\scripts\adicionar_albuns_kanye.js --execute
```

O script preserva os álbuns e avaliações existentes e adiciona somente títulos ausentes, incluindo *Watch the Throne*, *KIDS SEE GHOSTS*, *VULTURES 1*, *VULTURES 2* e *BULLY*. As capas e faixas são consultadas no iTunes e Deezer.

Para adicionar a discografia de estúdio do Mr. Bungle, incluindo *The Raging Wrath of the Easter Bunny Demo*, com capas e faixas:

```powershell
node backend\scripts\adicionar_albuns_mr_bungle.js --execute
```

Esse script cria o artista se ele ainda não existir e preserva álbuns e faixas já cadastrados.

Para adicionar os sete álbuns de estúdio do Faith No More com suas capas e faixas:

```powershell
node backend\scripts\adicionar_albuns_faith_no_more.js --execute
```

O script usa o catálogo Deezer, não duplica álbuns e preserva faixas que já existam.

Para adicionar os oito álbuns de estúdio do Avenged Sevenfold com suas capas e faixas:

```powershell
node backend\scripts\adicionar_albuns_avenged_sevenfold.js --execute
```

O script confere que cada resultado do Deezer é o álbum completo, não duplica álbuns e preserva faixas já cadastradas.

O arquivo `backend/.env.example` documenta a configuração de conexão. As credenciais do MySQL ficam somente no backend, nunca no aplicativo.
