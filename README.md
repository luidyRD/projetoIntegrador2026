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

   Para habilitar os cadastros de artistas independentes, aplique uma vez `backend/database/artistas_independentes.sql` no banco `loginBD`. Para adicionar o link do Spotify, aplique também uma vez `backend/database/spotify_artistas.sql` no banco `loginBD` (inclusive se a migração de artistas independentes já tiver sido aplicada). O formulário aceita opcionalmente a URL HTTPS do perfil do artista no Spotify; quando informada, ela aparece como botão no perfil público do artista.

   Para mostrar um QR Pix estático de uma conta central do projeto, preencha no `backend/.env`:

   ```dotenv
   PIX_KEY=sua-chave-pix
   PIX_RECEIVER_NAME=NOME DO RECEBEDOR
   PIX_CITY=CIDADE
   ```

   Use os dados exatamente como aparecem na conta que receberá os valores. O nome aceita até 25 caracteres e a cidade até 15; ambos devem ser informados sem acentos. Não compartilhe nem comite `backend/.env`. Não é necessário criar uma aplicação Mercado Pago nem aplicar a migração de pagamentos para usar esse QR Pix. As variáveis `MP_*` e a migração `backend/database/pagamentos_artistas.sql` são necessárias somente para os endpoints legados de checkout Mercado Pago.

3. Configure o app:

   ```powershell
   Copy-Item .env.exemplo .env
   ```

   Para o Expo Web, `http://localhost:3000` pode ser usado como `EXPO_PUBLIC_API_URL`. No app nativo, se essa URL estiver configurada, o app tenta usar automaticamente o host do servidor Expo para alcançar a API no computador. Se a conexão falhar, configure o endereço IP local do computador na mesma rede Wi-Fi, por exemplo `http://192.168.0.10:3000` (ou `http://10.0.2.2:3000` no emulador Android).

4. Inicie a API e o Expo em terminais separados:

   ```powershell
   npm run start:backend
   ```

   ```powershell
   npx expo start
   ```

   Para abrir o aplicativo no navegador do mesmo computador, use `npm run web` no lugar de `npx expo start` e acesse `http://localhost:8081`.

   Mantenha o backend rodando durante o uso do app. A API disponibiliza `GET /health`, `GET /pix`, `GET /albuns`, `GET /albuns/:id`, `GET /albuns/:id/avaliacoes`, `POST /albuns/:id/avaliacoes`, `GET /generos`, `GET /generos/:id/albuns`, `GET /artistas`, `GET /artistas/:id`, `GET /artistas-independentes`, `GET /albuns-independentes`, `POST /artistas-independentes`, `POST /auth/registro`, `POST /auth/login`, `GET /auth/perfil` e `PUT /auth/perfil`.

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

As páginas de artistas independentes mostram o QR Pix estático da conta central configurada no `backend/.env`. A pessoa apoiadora escolhe o valor diretamente no aplicativo do banco. O endpoint público `GET /pix` devolve o código Pix e o nome do destinatário para o app montar o QR.

Esse QR não identifica cada apoio nem confirma pagamentos automaticamente. Confira os recebimentos no extrato bancário. A conta que recebe é a conta central indicada por `PIX_KEY`, não a conta do artista exibido. Para usar checkout Mercado Pago com confirmação por webhook, a integração legada ainda exige a migração `backend/database/pagamentos_artistas.sql`, credenciais de uma aplicação e URLs públicas HTTPS configuradas no backend.

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
