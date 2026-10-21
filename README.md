# ARIDANA — Moda & Acessórios

Loja virtual feita com React (Vite), React Router e Tailwind CSS (Projeto Integrador SENAI).

## Como rodar
```
npm install
npm run dev
```

## Rotas
| Rota | Página |
|---|---|
| `/` | Início |
| `/feminino`, `/masculino`, `/acessorios` | Categorias com filtros |
| `/busca?q=termo` | Resultado da busca |
| `/produto/:id` | Detalhe do produto |
| `/carrinho` | Carrinho + cálculo de frete (ViaCEP) |
| `/checkout` | Finalizar compra |
| `/pedido` | Pedido realizado |
| `/login` | Entrar e criar conta |
| `/admin` | Painel administrativo (só administrador) |

## Estrutura
- `src/componentes`: Navbar, Footer, ProdutoCard, Mensagens, CalculoFrete, Produtos (dados)
- `src/paginas`: uma página por rota
- `public/img`: fotos recortadas dos protótipos (trocar pelas exportadas do Figma)

## Login com MongoDB (back-end)
Cadastro e login são validados em `server/index.js` (Express + Mongoose + bcryptjs), seguindo o guia da atividade.

1. Inicie o banco: `sudo podman start mongo-local` (sem `sudo` se o container foi criado pelo usuário comum)
2. `npm install`
3. Terminal 1: `npm run server` (API em http://localhost:4000)
4. Terminal 2: `npm run dev` (loja em http://localhost:5173; o Vite repassa `/api` para a porta 4000)

- Banco `aridana_loja`, coleção `usuarios` (nome, email único, senhaHash, tipo)
- Rotas: `POST /api/cadastro` (201/400/409) e `POST /api/login` (200/400/401)
- Administrador criado na primeira execução com os dados do `.env` (padrão `admin@aridana.com` / `aridana123`); troque a senha no `.env` antes de usar de verdade
- Senha: 8 a 72 caracteres, guardada como hash bcrypt

## Segurança do painel administrador
- **Sessão no servidor:** o login emite um token assinado (HMAC-SHA256, 2 h) num cookie `httpOnly` + `SameSite=Lax` (`Secure` em produção). O JavaScript da página não lê o cookie.
- **Rotas protegidas:** `/api/admin/*` passam por `exigirLogin` + `exigirAdmin`; o tipo do usuário é conferido no banco a cada pedido. Sem cookie válido: 401; cliente comum: 403.
- **Front-end:** ao abrir, o React pergunta `GET /api/me`; o localStorage é só cópia visual. Editar o localStorage não abre dados do painel.
- **Força bruta:** 5 falhas de login por e-mail+IP em 15 min bloqueiam (429); cadastro limitado a 10/hora por IP. O tempo de resposta não revela se o e-mail existe.
- **CSRF:** pedidos que alteram dados só valem com `Origin` em `ORIGENS_PERMITIDAS`, além do `SameSite`.
- **Cabeçalhos:** `nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store` na API, corpo limitado a 10 KB.
- **`JWT_SECRET`:** obrigatório no `.env` (mínimo 32 caracteres). Gere um novo para qualquer uso real: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Trocar o segredo desloga todo mundo.
- **Ainda falta para produção:** HTTPS, trocar a senha do admin, limitador compartilhado (o atual é em memória) e logout que invalide tokens já emitidos.


## Catálogo no banco (painel altera a loja)
- Coleção `produtos` no MongoDB, criada na primeira execução a partir de `server/produtos-seed.json` (só quando a coleção está vazia; reiniciar não apaga o que o painel mudou).
- `GET /api/produtos` (público, só itens com vitrine ligada) alimenta a loja. `Produtos.jsx` mantém o catálogo antigo como reserva se o servidor estiver desligado.
- `GET/PUT/DELETE /api/admin/produtos` (só administrador) alimentam o painel. O servidor valida nome, SKU, preço, estoque, etiqueta e vitrine; outros campos são ignorados.
- Para voltar ao catálogo inicial: apague a coleção `produtos` e reinicie `npm run server`.

## Menu do painel administrador
| Item | O que faz (tudo grava no MongoDB) |
|---|---|
| Painel Geral | Faturamento, pedidos, ticket médio, clientes, vitrine, estoque baixo e últimos pedidos |
| Catálogo de Produtos | Editar nome, SKU, preço, estoque e destaque; ligar/desligar vitrine; excluir |
| Gestão de Coleções | Publicar/esconder uma coleção inteira e ajustar preços em lote (-90% a +200%) |
| Pedidos & Vendas | Lista de pedidos da loja, detalhes e mudança de situação (novo, pago, enviado, entregue, cancelado; cancelar devolve ao estoque) |
| Banners & Vitrines | Texto do banner da Home e as 4 peças de "Mais vendidos" |
| Clientes | Busca e remoção de clientes (administrador nunca é removido) |
| Configurações da Loja | Frete grátis a partir de X e valores de frete por região |

- **Pedidos:** o checkout envia os itens ao servidor (`POST /api/pedidos`). O servidor busca o preço no banco, confere e baixa o estoque, calcula frete e desconto Pix e devolve o total. O navegador não define valores.
- **Coleções novas no banco:** `produtos`, `pedidos`, `configuracoes` (e `usuarios`).
- **Ainda fora do painel:** pagamento real (Mercado Pago, próximo passo: o pedido já nasce no servidor, falta o link de pagamento).

## Novo produto, imagens e importação CSV
- **+ Novo produto:** escolha coleção, subcategoria, SKU, preço, estoque, descrição, etiqueta e imagem. O código (f8, m8, a5...) é gerado pelo servidor; SKU repetido é recusado.
- **Imagem:** JPG, PNG ou WEBP até 2 MB. O servidor confere o tipo pelo conteúdo do arquivo, gera o nome e salva em `public/img/uploads/` (fora do Git). O mesmo campo existe na edição de um produto.
- **Importar CSV** (botão ao lado de "+ Novo produto"): baixe o modelo no próprio painel. Colunas obrigatórias: `sku, nome, categoria, preco, estoque`; opcionais: `sub, descricao, etiqueta, imagem, vitrine`.
  - Aceita `;` ou `,` como separador, preço `139,90` ou `139.90`, e arquivos do Excel (UTF-8 ou Windows-1252).
  - "Verificar sem gravar" mostra os erros por linha antes de importar. Linhas válidas entram; as com erro são listadas e não entram.
  - SKU já cadastrado é recusado, a não ser que marque "Atualizar produtos que já existem"; nesse caso, campos opcionais em branco não são alterados.
  - Limites: 500 linhas e 1 MB por arquivo. Imagem na planilha deve ser um caminho da loja, como `/img/blusa.jpg`.
- **Produção:** os uploads ficam em `public/`. Para publicar o site, o servidor que entrega o build precisa servir essa pasta (ou use um armazenamento externo).
