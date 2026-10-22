
const CHAVE_SESSAO = 'aridana_sessao'

function usuarioValido(u) {
  return !!u && typeof u.nome === 'string' && u.nome !== '' && typeof u.email === 'string' && (u.tipo === 'cliente' || u.tipo === 'admin')
}

export function lerSessao() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_SESSAO))
    return usuarioValido(salvo) ? salvo : null
  } catch (e) {
    return null
  }
}

export function salvarSessao(usuario) {
  try {
    if (usuario) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario))
    else localStorage.removeItem(CHAVE_SESSAO)
  } catch (e) {
  }
}

export async function chamarApi(rota, corpo, metodo) {
  let resp
  try {
    resp = await fetch('/api/' + rota, {
      method: metodo || (corpo ? 'POST' : 'GET'),
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      credentials: 'same-origin',
    })
  } catch (e) {
    throw new Error('sem_servidor')
  }
    const dados = await resp.json().catch(() => null)
    if (!resp.ok) throw new Error((dados && dados.erro) || 'erro_servidor')
    if (dados === null) throw new Error('sem_servidor')
    return dados
}

async function comoUsuario(promessa) {
  const usuario = await promessa
  if (!usuarioValido(usuario)) throw new Error('sem_servidor')
  return usuario
}

export function cadastrar(nome, email, senha) {
  return comoUsuario(chamarApi('cadastro', { nome, email, senha }))
}

export function autenticar(email, senha) {
  return comoUsuario(chamarApi('login', { email, senha }))
}

export async function verificarSessao() {
  try {
    const usuario = await chamarApi('me')
    return usuarioValido(usuario) ? usuario : null
  } catch (e) {
    return null
  }
}

export async function encerrarSessao() {
  try {
    await chamarApi('logout', {})
  } catch (e) {
  }
}

export function listarClientes() {
  return chamarApi('admin/clientes')
}

export function listarProdutosAdmin() {
  return chamarApi('admin/produtos')
}

export function editarProduto(id, campos) {
  return chamarApi('admin/produtos/' + encodeURIComponent(id), campos, 'PUT')
}

export function removerProduto(id) {
  return chamarApi('admin/produtos/' + encodeURIComponent(id), null, 'DELETE')
}

export function criarProduto(campos) {
  return chamarApi('admin/produtos', campos)
}

export async function enviarImagem(arquivo) {
  let resp
  try {
    resp = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': arquivo.type },
      body: arquivo,
      credentials: 'same-origin',
    })
  } catch (e) {
    throw new Error('sem_servidor')
  }
  const dados = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(dados.erro || 'erro_servidor')
  return dados.caminho
}
