import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { criarToken, verificarToken } from './token.js'

const PRODUTOS_INICIAIS = JSON.parse(readFileSync(new URL('./produtos-seed.json', import.meta.url), 'utf8'))

const app = express()
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI

const JWT_SECRET = process.env.JWT_SECRET
const EM_PRODUCAO = process.env.NODE_ENV === 'production'
const VALIDADE_SESSAO = 2 * 60 * 60
const NOME_COOKIE = 'aridana_token'
const ORIGENS = (process.env.ORIGENS_PERMITIDAS || 'http://localhost:5173').split(',').map((o) => o.trim())

if (!JWT_SECRET || JWT_SECRET.length < 32 || /^(troque-por|COLE-AQUI)/.test(JWT_SECRET)) {
  console.error('JWT_SECRET ausente, curto (mínimo 32 caracteres) ou ainda com o texto de exemplo. Gere um com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"')
  process.exit(1)
}

app.disable('x-powered-by')

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store')
  next()
})

app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origem = req.headers.origin
  if (origem && !ORIGENS.includes(origem)) return res.status(403).json({ erro: 'origem_nao_permitida' })
  next()
})

const json10kb = express.json({ limit: '10kb' })
app.use((req, res, next) => (req.path === '/api/admin/produtos/importar' ? next() : json10kb(req, res, next)))

function limitador({ max, janelaMs, chave }) {
  const registros = new Map()
  return {
    bloqueado(req) {
      const k = chave(req)
      const r = registros.get(k)
      if (!r || r.expira < Date.now()) return false
      return r.n >= max
    },
    falha(req) {
      const k = chave(req)
      const r = registros.get(k)
      if (!r || r.expira < Date.now()) registros.set(k, { n: 1, expira: Date.now() + janelaMs })
      else r.n += 1
    },
    limpar(req) {
      registros.delete(chave(req))
    },
  }
}
const tentativasLogin = limitador({
  max: 5,
  janelaMs: 15 * 60 * 1000,
  chave: (req) => req.ip + '|' + String((req.body && req.body.email) || '').trim().toLowerCase(),
})
const tentativasCadastro = limitador({ max: 10, janelaMs: 60 * 60 * 1000, chave: (req) => req.ip })

function lerCookie(req, nome) {
  const cabecalho = req.headers.cookie || ''
  for (const par of cabecalho.split(';')) {
    const i = par.indexOf('=')
    if (i > -1 && par.slice(0, i).trim() === nome) return decodeURIComponent(par.slice(i + 1).trim())
  }
  return null
}

const opcoesCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: EM_PRODUCAO,
  path: '/',
}

function iniciarSessao(res, usuario) {
  const token = criarToken({ id: String(usuario._id), tipo: usuario.tipo }, JWT_SECRET, VALIDADE_SESSAO)
  res.cookie(NOME_COOKIE, token, { ...opcoesCookie, maxAge: VALIDADE_SESSAO * 1000 })
}

async function exigirLogin(req, res, next) {
  const dados = verificarToken(lerCookie(req, NOME_COOKIE), JWT_SECRET)
  if (!dados) return res.status(401).json({ erro: 'nao_autenticado' })
  try {
    const usuario = await Usuario.findById(dados.id)
    if (!usuario) return res.status(401).json({ erro: 'nao_autenticado' })
    req.usuario = usuario
    next()
  } catch (erro) {
    return res.status(401).json({ erro: 'nao_autenticado' })
  }
}

function exigirAdmin(req, res, next) {
  if (!req.usuario || req.usuario.tipo !== 'admin') return res.status(403).json({ erro: 'acesso_negado' })
  next()
}

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
  senhaHash: { type: String, required: true, select: false },
  tipo: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
}, { timestamps: true })
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios')

const produtoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  ref: { type: String, required: true, trim: true, maxlength: 40 },
  nome: { type: String, required: true, trim: true, maxlength: 120 },
  categoria: { type: String, required: true, enum: ['feminino', 'masculino', 'acessorios'] },
  sub: { type: String, default: '' },
  preco: { type: Number, required: true, min: 0 },
  estoque: { type: Number, required: true, min: 0 },
  desc: { type: String, default: '' },
  img: { type: String, default: '' },
  etiqueta: { type: String, enum: ['', 'novo', 'destaque'], default: '' },
  vitrine: { type: Boolean, default: true },
  ordem: { type: Number, default: 0 },
})
const Produto = mongoose.model('Produto', produtoSchema, 'produtos')

const produtoPublico = (p) => ({
  id: p.codigo, ref: p.ref, nome: p.nome, sub: p.sub, preco: p.preco, estoque: p.estoque,
  desc: p.desc, img: p.img, etiqueta: p.etiqueta, categoria: p.categoria, vitrine: p.vitrine,
})

const configSchema = new mongoose.Schema({
  chave: { type: String, required: true, unique: true },
  freteGratis: { type: Number, default: 199.9 },
  frete: {
    sp: { type: Number, default: 14.9 },
    sulSudeste: { type: Number, default: 21.9 },
    demais: { type: Number, default: 29.9 },
  },
  banner: {
    titulo: { type: String, default: 'MODA PARA\nTODOS OS\nMOMENTOS' },
    subtitulo: { type: String, default: 'Estilo, elegância e praticidade em um só lugar.' },
  },
  maisVendidos: { type: [String], default: ['f2', 'a1', 'm1', 'a2'] },
  contadorPedidos: { type: Number, default: 1000 },
})
const Config = mongoose.model('Config', configSchema, 'configuracoes')

async function lerConfig() {
  return Config.findOneAndUpdate({ chave: 'loja' }, { $setOnInsert: { chave: 'loja' } }, { new: true, upsert: true, setDefaultsOnInsert: true })
}

const configPublica = (c) => ({
  freteGratis: c.freteGratis,
  frete: { sp: c.frete.sp, sulSudeste: c.frete.sulSudeste, demais: c.frete.demais },
  banner: { titulo: c.banner.titulo, subtitulo: c.banner.subtitulo },
  maisVendidos: c.maisVendidos,
})

function calcularFrete(uf, subtotal, c) {
  if (subtotal >= c.freteGratis) return 0
  if (uf === 'SP') return c.frete.sp
  if (['RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(uf)) return c.frete.sulSudeste
  return c.frete.demais
}

const STATUS_PEDIDO = ['novo', 'pago', 'enviado', 'entregue', 'cancelado']
const pedidoSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  cliente: {
    nome: { type: String, required: true, maxlength: 120 },
    email: { type: String, required: true, maxlength: 120 },
    cpf: { type: String, default: '', maxlength: 20 },
    telefone: { type: String, default: '', maxlength: 30 },
  },
  endereco: {
    cep: { type: String, required: true },
    rua: { type: String, required: true, maxlength: 160 },
    numero: { type: String, required: true, maxlength: 20 },
    bairro: { type: String, default: '', maxlength: 120 },
    cidade: { type: String, required: true, maxlength: 120 },
    uf: { type: String, required: true, maxlength: 2 },
  },
  pagamento: { type: String, enum: ['pix', 'cartao', 'boleto'], required: true },
  itens: [{
    codigo: String, ref: String, nome: String, preco: Number, qtd: Number, tamanho: String, cor: String,
  }],
  subtotal: Number,
  frete: Number,
  desconto: Number,
  total: Number,
  status: { type: String, enum: STATUS_PEDIDO, default: 'novo' },
}, { timestamps: true })
const Pedido = mongoose.model('Pedido', pedidoSchema, 'pedidos')

const pedidoAdmin = (p) => ({
  id: String(p._id), numero: p.numero, criadoEm: p.createdAt, status: p.status, pagamento: p.pagamento,
  cliente: p.cliente, endereco: p.endereco, itens: p.itens, subtotal: p.subtotal, frete: p.frete,
  desconto: p.desconto, total: p.total,
})

const HASH_FALSO = bcrypt.hashSync('senha-que-nunca-sera-usada', 10)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const textoValido = (v) => typeof v === 'string' && v.trim().length > 0

const publico = (u) => ({ nome: u.nome, email: u.email, tipo: u.tipo })

app.post('/api/cadastro', async (req, res) => {
  if (tentativasCadastro.bloqueado(req)) return res.status(429).json({ erro: 'muitas_tentativas' })
  tentativasCadastro.falha(req)
  const { nome, email, senha } = req.body || {}

  if (!textoValido(nome)) return res.status(400).json({ erro: 'nome_invalido' })
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) return res.status(400).json({ erro: 'email_invalido' })
  if (typeof senha !== 'string' || senha.length < 8) return res.status(400).json({ erro: 'senha_curta' })
  if (bcrypt.truncates(senha)) return res.status(400).json({ erro: 'senha_longa' })

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const novo = await Usuario.create({ nome, email: email.trim().toLowerCase(), senhaHash, tipo: 'cliente' })
    iniciarSessao(res, novo)
    return res.status(201).json(publico(novo))
  } catch (erro) {
    if (erro && erro.code === 11000) return res.status(409).json({ erro: 'email_em_uso' })
    if (erro && erro.name === 'ValidationError') return res.status(400).json({ erro: 'dados_invalidos' })
    console.error('Erro no cadastro:', erro)
    return res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body || {}
  if (!textoValido(email) || typeof senha !== 'string' || senha.length === 0) {
    return res.status(400).json({ erro: 'dados_invalidos' })
  }
  if (tentativasLogin.bloqueado(req)) return res.status(429).json({ erro: 'muitas_tentativas' })

  try {
    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select('+senhaHash')
    const ok = await bcrypt.compare(senha, usuario ? usuario.senhaHash : HASH_FALSO)
    if (!usuario || !ok) {
      tentativasLogin.falha(req)
      return res.status(401).json({ erro: 'credenciais_invalidas' })
    }
    tentativasLogin.limpar(req)
    iniciarSessao(res, usuario)
    return res.json(publico(usuario))
  } catch (erro) {
    console.error('Erro no login:', erro)
    return res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/me', exigirLogin, (req, res) => res.json(publico(req.usuario)))

app.post('/api/logout', (req, res) => {
  res.clearCookie(NOME_COOKIE, opcoesCookie)
  res.json({ ok: true })
})

app.get('/api/admin/clientes', exigirLogin, exigirAdmin, async (req, res) => {
  try {
    const total = await Usuario.countDocuments({ tipo: 'cliente' })
    const todos = await Usuario.find({ tipo: 'cliente' }).sort({ _id: -1 }).limit(500)
    const lista = todos.map((u) => ({ id: String(u._id), nome: u.nome, email: u.email, criadoEm: u.createdAt || null }))
    res.json({ total, recentes: lista.slice(0, 10), lista })
  } catch (erro) {
    console.error('Erro ao listar clientes:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/produtos', async (req, res) => {
  try {
    const lista = await Produto.find({ vitrine: true }).sort({ ordem: 1 })
    res.json(lista.map(produtoPublico))
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/admin/produtos', exigirLogin, exigirAdmin, async (req, res) => {
  try {
    const lista = await Produto.find().sort({ ordem: 1 })
    res.json(lista.map(produtoPublico))
  } catch (erro) {
    console.error('Erro ao listar produtos (admin):', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

function validarEdicao(corpo) {
  const dados = {}
  const c = corpo || {}
  if ('nome' in c) {
    if (!textoValido(c.nome) || c.nome.trim().length > 120) return { erro: 'nome_invalido' }
    dados.nome = c.nome.trim()
  }
  if ('ref' in c) {
    if (!textoValido(c.ref) || c.ref.trim().length > 40) return { erro: 'ref_invalida' }
    dados.ref = c.ref.trim()
  }
  if ('preco' in c) {
    if (typeof c.preco !== 'number' || !Number.isFinite(c.preco) || c.preco < 0 || c.preco > 100000) return { erro: 'preco_invalido' }
    dados.preco = Math.round(c.preco * 100) / 100
  }
  if ('estoque' in c) {
    if (!Number.isInteger(c.estoque) || c.estoque < 0 || c.estoque > 100000) return { erro: 'estoque_invalido' }
    dados.estoque = c.estoque
  }
  if ('etiqueta' in c) {
    if (!['', 'novo', 'destaque'].includes(c.etiqueta)) return { erro: 'etiqueta_invalida' }
    dados.etiqueta = c.etiqueta
  }
  if ('vitrine' in c) {
    if (typeof c.vitrine !== 'boolean') return { erro: 'vitrine_invalida' }
    dados.vitrine = c.vitrine
  }
  if ('desc' in c) {
    if (typeof c.desc !== 'string' || c.desc.length > 1000) return { erro: 'desc_invalida' }
    dados.desc = c.desc.trim()
  }
  if ('img' in c) {
    if (!imgSegura(c.img)) return { erro: 'img_invalida' }
    dados.img = c.img
  }
  if ('sub' in c) {
    if (typeof c.sub !== 'string') return { erro: 'sub_invalida' }
    dados.sub = semAcento(c.sub)
  }
  if (Object.keys(dados).length === 0) return { erro: 'nada_para_alterar' }
  return { dados }
}

app.put('/api/admin/produtos/:codigo', exigirLogin, exigirAdmin, async (req, res) => {
  const { dados, erro } = validarEdicao(req.body)
  if (erro) return res.status(400).json({ erro })
  try {
    if ('sub' in dados && dados.sub !== '') {
      const atual = await Produto.findOne({ codigo: String(req.params.codigo) })
      if (!atual) return res.status(404).json({ erro: 'nao_encontrado' })
      if (!SUBS[atual.categoria].includes(dados.sub)) return res.status(400).json({ erro: 'sub_invalida' })
    }
    const produto = await Produto.findOneAndUpdate({ codigo: String(req.params.codigo) }, { $set: dados }, { new: true, runValidators: true })
    if (!produto) return res.status(404).json({ erro: 'nao_encontrado' })
    res.json(produtoPublico(produto))
  } catch (e) {
    console.error('Erro ao editar produto:', e)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.delete('/api/admin/produtos/:codigo', exigirLogin, exigirAdmin, async (req, res) => {
  try {
    const removido = await Produto.findOneAndDelete({ codigo: String(req.params.codigo) })
    if (!removido) return res.status(404).json({ erro: 'nao_encontrado' })
    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao remover produto:', e)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/loja', async (req, res) => {
  try {
    res.json(configPublica(await lerConfig()))
  } catch (erro) {
    console.error('Erro ao ler configurações:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

const numeroValido = (n, min, max) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max

app.put('/api/admin/config', exigirLogin, exigirAdmin, async (req, res) => {
  const c = req.body || {}
  const set = {}
  if ('freteGratis' in c) {
    if (!numeroValido(c.freteGratis, 0, 100000)) return res.status(400).json({ erro: 'frete_gratis_invalido' })
    set.freteGratis = Math.round(c.freteGratis * 100) / 100
  }
  if ('frete' in c) {
    const f = c.frete || {}
    for (const regiao of ['sp', 'sulSudeste', 'demais']) {
      if (!numeroValido(f[regiao], 0, 1000)) return res.status(400).json({ erro: 'frete_invalido' })
      set['frete.' + regiao] = Math.round(f[regiao] * 100) / 100
    }
  }
  if ('banner' in c) {
    const b = c.banner || {}
    if (!textoValido(b.titulo) || b.titulo.length > 120) return res.status(400).json({ erro: 'banner_invalido' })
    if (typeof b.subtitulo !== 'string' || b.subtitulo.length > 200) return res.status(400).json({ erro: 'banner_invalido' })
    set['banner.titulo'] = b.titulo.trim()
    set['banner.subtitulo'] = b.subtitulo.trim()
  }
  if ('maisVendidos' in c) {
    const ids = c.maisVendidos
    if (!Array.isArray(ids) || ids.length !== 4 || ids.some((i) => typeof i !== 'string') || new Set(ids).size !== 4) {
      return res.status(400).json({ erro: 'mais_vendidos_invalido' })
    }
    if ((await Produto.countDocuments({ codigo: { $in: ids } })) !== 4) return res.status(400).json({ erro: 'mais_vendidos_invalido' })
    set.maisVendidos = ids
  }
  if (Object.keys(set).length === 0) return res.status(400).json({ erro: 'nada_para_alterar' })
  try {
    await lerConfig()
    const nova = await Config.findOneAndUpdate({ chave: 'loja' }, { $set: set }, { new: true, runValidators: true })
    res.json(configPublica(nova))
  } catch (erro) {
    console.error('Erro ao salvar configurações:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

const tentativasPedido = limitador({ max: 20, janelaMs: 60 * 60 * 1000, chave: (req) => req.ip })

app.post('/api/pedidos', async (req, res) => {
  if (tentativasPedido.bloqueado(req)) return res.status(429).json({ erro: 'muitas_tentativas' })
  tentativasPedido.falha(req)

  const { cliente, endereco, pagamento, itens } = req.body || {}
  const cl = cliente || {}
  const en = endereco || {}
  const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

  if (!textoValido(cl.nome) || typeof cl.email !== 'string' || !EMAIL_REGEX.test(cl.email.trim())) return res.status(400).json({ erro: 'cliente_invalido' })
  const cep = texto(en.cep, 20).replace(/\D/g, '')
  const uf = texto(en.uf, 2).toUpperCase()
  if (cep.length !== 8 || uf.length !== 2 || !textoValido(en.rua) || !textoValido(en.numero) || !textoValido(en.cidade)) return res.status(400).json({ erro: 'endereco_invalido' })
  if (!['pix', 'cartao', 'boleto'].includes(pagamento)) return res.status(400).json({ erro: 'pagamento_invalido' })
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 50) return res.status(400).json({ erro: 'itens_invalidos' })

  const linhas = []
  for (const i of itens) {
    if (!i || typeof i.id !== 'string' || !Number.isInteger(i.qtd) || i.qtd < 1 || i.qtd > 20) return res.status(400).json({ erro: 'itens_invalidos' })
    linhas.push({ codigo: i.id, qtd: i.qtd, tamanho: texto(i.tamanho, 10), cor: texto(i.cor, 40) })
  }

  const baixados = []
  async function desfazer() {
    for (const b of baixados) await Produto.updateOne({ codigo: b.codigo }, { $inc: { estoque: b.qtd } })
  }

  try {
    const detalhes = []
    for (const l of linhas) {
      const produto = await Produto.findOneAndUpdate(
        { codigo: l.codigo, vitrine: true, estoque: { $gte: l.qtd } },
        { $inc: { estoque: -l.qtd } },
        { new: true }
      )
      if (!produto) {
        await desfazer()
        const existe = await Produto.findOne({ codigo: l.codigo, vitrine: true })
        return res.status(existe ? 409 : 400).json({ erro: existe ? 'sem_estoque' : 'produto_indisponivel', produto: existe ? existe.nome : l.codigo })
      }
      baixados.push({ codigo: l.codigo, qtd: l.qtd })
      detalhes.push({ codigo: produto.codigo, ref: produto.ref, nome: produto.nome, preco: produto.preco, qtd: l.qtd, tamanho: l.tamanho, cor: l.cor })
    }

    const config = await lerConfig()
    const subtotal = Math.round(detalhes.reduce((soma, d) => soma + d.preco * d.qtd, 0) * 100) / 100
    const frete = calcularFrete(uf, subtotal, config)
    const desconto = pagamento === 'pix' ? Math.round(subtotal * 5) / 100 : 0
    const total = Math.round((subtotal + frete - desconto) * 100) / 100

    const contador = await Config.findOneAndUpdate({ chave: 'loja' }, { $inc: { contadorPedidos: 1 } }, { new: true })
    const pedido = await Pedido.create({
      numero: 'AR-' + contador.contadorPedidos,
      cliente: { nome: texto(cl.nome, 120), email: cl.email.trim().toLowerCase(), cpf: texto(cl.cpf, 20), telefone: texto(cl.telefone, 30) },
      endereco: { cep, rua: texto(en.rua, 160), numero: texto(en.numero, 20), bairro: texto(en.bairro, 120), cidade: texto(en.cidade, 120), uf },
      pagamento, itens: detalhes, subtotal, frete, desconto, total,
    })
    return res.status(201).json({
      numero: pedido.numero,
      data: pedido.createdAt.toLocaleDateString('pt-BR'),
      subtotal, frete, desconto, total,
    })
  } catch (erro) {
    await desfazer().catch(() => {})
    console.error('Erro ao criar pedido:', erro)
    return res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/admin/pedidos', exigirLogin, exigirAdmin, async (req, res) => {
  try {
    const lista = await Pedido.find().sort({ createdAt: -1 }).limit(200)
    res.json(lista.map(pedidoAdmin))
  } catch (erro) {
    console.error('Erro ao listar pedidos:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.put('/api/admin/pedidos/:id', exigirLogin, exigirAdmin, async (req, res) => {
  const { status } = req.body || {}
  if (!STATUS_PEDIDO.includes(status)) return res.status(400).json({ erro: 'status_invalido' })
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ erro: 'nao_encontrado' })
  try {
    const pedido = await Pedido.findById(req.params.id)
    if (!pedido) return res.status(404).json({ erro: 'nao_encontrado' })
    if (pedido.status === 'cancelado') return res.status(400).json({ erro: 'pedido_cancelado' })
    if (status === 'cancelado' && pedido.status === 'entregue') return res.status(400).json({ erro: 'pedido_entregue' })
    if (status === 'cancelado') {
      for (const i of pedido.itens) await Produto.updateOne({ codigo: i.codigo }, { $inc: { estoque: i.qtd } })
    }
    pedido.status = status
    await pedido.save()
    res.json(pedidoAdmin(pedido))
  } catch (erro) {
    console.error('Erro ao alterar pedido:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

const CATEGORIAS = ['feminino', 'masculino', 'acessorios']

app.post('/api/admin/colecoes/:categoria/vitrine', exigirLogin, exigirAdmin, async (req, res) => {
  const { vitrine } = req.body || {}
  if (!CATEGORIAS.includes(req.params.categoria) || typeof vitrine !== 'boolean') return res.status(400).json({ erro: 'dados_invalidos' })
  try {
    const r = await Produto.updateMany({ categoria: req.params.categoria }, { $set: { vitrine } })
    res.json({ alterados: r.modifiedCount })
  } catch (erro) {
    console.error('Erro na vitrine da coleção:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.post('/api/admin/colecoes/:categoria/preco', exigirLogin, exigirAdmin, async (req, res) => {
  const { percentual } = req.body || {}
  if (!CATEGORIAS.includes(req.params.categoria) || !numeroValido(percentual, -90, 200) || percentual === 0) return res.status(400).json({ erro: 'percentual_invalido' })
  try {
    const fator = 1 + percentual / 100
    const produtos = await Produto.find({ categoria: req.params.categoria })
    const operacoes = []
    for (const p of produtos) {
      const novo = Math.round(p.preco * fator * 100) / 100
      if (novo > 100000) return res.status(400).json({ erro: 'preco_invalido' })
      operacoes.push({ updateOne: { filter: { _id: p._id }, update: { $set: { preco: novo } } } })
    }
    if (operacoes.length) await Produto.bulkWrite(operacoes)
    res.json({ alterados: operacoes.length })
  } catch (erro) {
    console.error('Erro no ajuste de preço:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.get('/api/admin/resumo', exigirLogin, exigirAdmin, async (req, res) => {
  try {
    const [produtos, clientes, pedidos, recentes] = await Promise.all([
      Produto.find(),
      Usuario.countDocuments({ tipo: 'cliente' }),
      Pedido.find({ status: { $ne: 'cancelado' } }),
      Pedido.find().sort({ createdAt: -1 }).limit(5),
    ])
    const porStatus = {}
    for (const s of STATUS_PEDIDO) porStatus[s] = await Pedido.countDocuments({ status: s })
    const faturamento = pedidos.reduce((soma, p) => soma + p.total, 0)
    res.json({
      produtos: { total: produtos.length, vitrine: produtos.filter((p) => p.vitrine).length, estoqueBaixo: produtos.filter((p) => p.estoque < 10).length },
      clientes,
      pedidos: { total: pedidos.length, porStatus, faturamento: Math.round(faturamento * 100) / 100, ticketMedio: pedidos.length ? Math.round((faturamento / pedidos.length) * 100) / 100 : 0 },
      recentes: recentes.map(pedidoAdmin),
    })
  } catch (erro) {
    console.error('Erro no resumo:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.delete('/api/admin/clientes/:id', exigirLogin, exigirAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ erro: 'nao_encontrado' })
  try {
    const removido = await Usuario.findOneAndDelete({ _id: req.params.id, tipo: 'cliente' })
    if (!removido) return res.status(404).json({ erro: 'nao_encontrado' })
    res.json({ ok: true })
  } catch (erro) {
    console.error('Erro ao remover cliente:', erro)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

const SUBS = {
  feminino: ['vestidos', 'blusas', 'calcas', 'saias', 'conjuntos'],
  masculino: ['camisas', 'calcas', 'jaquetas', 'calcados'],
  acessorios: ['joias', 'bolsas', 'oculos', 'relogios', 'cintos'],
}
const PREFIXO = { feminino: 'f', masculino: 'm', acessorios: 'a' }

const semAcento = (v) => String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

function lerPreco(v) {
  if (typeof v === 'number') return v
  let t = String(v == null ? '' : v).trim().replace(/^R\$\s*/i, '')
  if (t === '') return NaN
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

function lerInteiro(v) {
  if (typeof v === 'number') return v
  const t = String(v == null ? '' : v).trim()
  return /^\d+$/.test(t) ? Number(t) : NaN
}

function lerVitrine(v) {
  if (typeof v === 'boolean') return v
  const t = semAcento(v)
  if (['sim', 's', 'true', '1', 'ativo'].includes(t)) return true
  if (['nao', 'n', 'false', '0', 'inativo'].includes(t)) return false
  return undefined
}

const IMG_VALIDA = /^\/img\/[A-Za-z0-9_\-./]+$/
const imgSegura = (v) => v === '' || (typeof v === 'string' && v.length <= 200 && IMG_VALIDA.test(v) && !v.includes('..'))

function validarProduto(l) {
  const c = l || {}
  const nome = String(c.nome == null ? '' : c.nome).trim()
  const ref = String(c.ref == null ? '' : c.ref).trim()
  const categoria = semAcento(c.categoria)
  if (!nome || nome.length > 120) return { erro: 'Nome vazio ou com mais de 120 caracteres' }
  if (!ref || ref.length > 40) return { erro: 'SKU vazio ou com mais de 40 caracteres' }
  if (!CATEGORIAS.includes(categoria)) return { erro: 'Categoria deve ser feminino, masculino ou acessorios' }
  const preco = lerPreco(c.preco)
  if (!numeroValido(preco, 0, 100000)) return { erro: 'Preço inválido (use números, ex.: 139,90)' }
  const estoque = lerInteiro(c.estoque)
  if (!Number.isInteger(estoque) || estoque < 0 || estoque > 100000) return { erro: 'Estoque deve ser um número inteiro, de 0 a 100000' }

  const dados = { nome, ref, categoria, preco: Math.round(preco * 100) / 100, estoque }

  const sub = semAcento(c.sub)
  if (sub !== '') {
    if (!SUBS[categoria].includes(sub)) return { erro: 'Subcategoria "' + sub + '" não existe em ' + categoria + ' (' + SUBS[categoria].join(', ') + ')' }
    dados.sub = sub
  }
  const desc = String(c.desc == null ? '' : c.desc).trim()
  if (desc.length > 1000) return { erro: 'Descrição com mais de 1000 caracteres' }
  if (desc !== '') dados.desc = desc

  const etiqueta = semAcento(c.etiqueta)
  if (!['', 'novo', 'destaque'].includes(etiqueta)) return { erro: 'Etiqueta deve ser novo, destaque ou vazia' }
  if (etiqueta !== '') dados.etiqueta = etiqueta

  const img = String(c.img == null ? '' : c.img).trim()
  if (!imgSegura(img)) return { erro: 'Imagem deve ser um caminho da loja, como /img/nome.jpg' }
  if (img !== '') dados.img = img

  const vitrine = lerVitrine(c.vitrine)
  if (vitrine !== undefined) dados.vitrine = vitrine
  return { dados }
}

async function numeradores() {
  const todos = await Produto.find({}, 'codigo ordem ref')
  const maximos = { f: 0, m: 0, a: 0 }
  let ordem = -1
  for (const p of todos) {
    const m = /^([fma])(\d+)$/.exec(p.codigo)
    if (m) maximos[m[1]] = Math.max(maximos[m[1]], Number(m[2]))
    ordem = Math.max(ordem, p.ordem || 0)
  }
  return {
    todos,
    proximo(categoria) {
      const k = PREFIXO[categoria]
      maximos[k] += 1
      ordem += 1
      return { codigo: k + maximos[k], ordem }
    },
  }
}

app.post('/api/admin/produtos', exigirLogin, exigirAdmin, async (req, res) => {
  const { dados, erro } = validarProduto(req.body)
  if (erro) return res.status(400).json({ erro: 'dados_invalidos', mensagem: erro })
  try {
    const num = await numeradores()
    if (num.todos.some((p) => p.ref.toLowerCase() === dados.ref.toLowerCase())) {
      return res.status(409).json({ erro: 'ref_em_uso', mensagem: 'Já existe um produto com este SKU' })
    }
    const criado = await Produto.create({ ...dados, ...num.proximo(dados.categoria) })
    res.status(201).json(produtoPublico(criado))
  } catch (e) {
    console.error('Erro ao criar produto:', e)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

app.post('/api/admin/produtos/importar', exigirLogin, exigirAdmin, express.json({ limit: '1mb' }), async (req, res) => {
  const { linhas, atualizar, simular } = req.body || {}
  if (!Array.isArray(linhas) || linhas.length === 0 || linhas.length > 500) {
    return res.status(400).json({ erro: 'linhas_invalidas', mensagem: 'Envie de 1 a 500 linhas' })
  }
  try {
    const num = await numeradores()
    const porRef = new Map(num.todos.map((p) => [p.ref.toLowerCase(), p]))
    const vistos = new Set()
    const erros = []
    const novos = []
    const alteracoes = []

    linhas.forEach((linha, i) => {
      const numeroLinha = i + 2
      const { dados, erro } = validarProduto(linha)
      if (erro) return erros.push({ linha: numeroLinha, mensagem: erro })
      const chave = dados.ref.toLowerCase()
      if (vistos.has(chave)) return erros.push({ linha: numeroLinha, mensagem: 'SKU repetido dentro do arquivo' })
      vistos.add(chave)
      const existente = porRef.get(chave)
      if (!existente) return novos.push(dados)
      if (atualizar !== true) return erros.push({ linha: numeroLinha, mensagem: 'SKU já cadastrado (marque "atualizar existentes" para alterá-lo)' })
      alteracoes.push({ id: existente._id, dados })
    })

    if (simular !== true) {
      const docs = novos.map((d) => ({ ...d, ...num.proximo(d.categoria) }))
      if (docs.length) await Produto.insertMany(docs)
      if (alteracoes.length) {
        await Produto.bulkWrite(alteracoes.map((a) => ({ updateOne: { filter: { _id: a.id }, update: { $set: a.dados } } })))
      }
    }
    res.json({ simulado: simular === true, criados: novos.length, atualizados: alteracoes.length, erros })
  } catch (e) {
    console.error('Erro na importação:', e)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

const PASTA_UPLOADS = fileURLToPath(new URL('../public/img/uploads/', import.meta.url))

function tipoDaImagem(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return null
}

app.post('/api/admin/upload', exigirLogin, exigirAdmin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' }), async (req, res) => {
  const buf = req.body
  if (!Buffer.isBuffer(buf) || buf.length === 0) return res.status(400).json({ erro: 'arquivo_invalido', mensagem: 'Envie uma imagem JPG, PNG ou WEBP' })
  const ext = tipoDaImagem(buf)
  if (!ext) return res.status(400).json({ erro: 'arquivo_invalido', mensagem: 'O arquivo não é uma imagem JPG, PNG ou WEBP' })
  try {
    await mkdir(PASTA_UPLOADS, { recursive: true })
    const nome = crypto.randomBytes(10).toString('hex') + '.' + ext
    await writeFile(PASTA_UPLOADS + nome, buf)
    res.status(201).json({ caminho: '/img/uploads/' + nome })
  } catch (e) {
    console.error('Erro no upload:', e)
    res.status(500).json({ erro: 'erro_servidor' })
  }
})

async function criarAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@aridana.com').toLowerCase()
  const senha = process.env.ADMIN_SENHA || 'aridana123'
  const nome = process.env.ADMIN_NOME || 'Helena Vasconcelos'
  if (await Usuario.exists({ email })) return
  await Usuario.create({ nome, email, senhaHash: await bcrypt.hash(senha, 10), tipo: 'admin' })
  console.log('Administrador criado:', email)
}

async function criarProdutosIniciais() {
  if (await Produto.estimatedDocumentCount() > 0) return
  await Produto.insertMany(PRODUTOS_INICIAIS.map(({ id, ...resto }) => ({ codigo: id, ...resto })))
  console.log('Catálogo inicial criado:', PRODUTOS_INICIAIS.length, 'produtos')
}

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ erro: 'arquivo_grande' })
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'dados_invalidos' })
  console.error('Erro não tratado:', err)
  res.status(500).json({ erro: 'erro_servidor' })
})

async function iniciar() {
  if (!MONGO_URI) {
    console.error('MONGO_URI não definida. Confira o arquivo .env na pasta do projeto.')
    process.exit(1)
  }
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Conectado ao MongoDB.')
    await Usuario.init()
    await criarAdmin()
    await Produto.init()
    await criarProdutosIniciais()
    await Config.init()
    await Pedido.init()
    await lerConfig()
    app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`))
  } catch (erro) {
    console.error('Falha ao iniciar:', erro.message)
    console.error('Confira se o container mongo-local está ativo e a porta 27017 publicada.')
    process.exit(1)
  }
}

iniciar()
