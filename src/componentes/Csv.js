
export const COLUNAS = [
  { campo: 'ref', obrigatoria: true, nomes: ['ref', 'sku', 'codigo sku', 'codigo', 'referencia'] },
  { campo: 'nome', obrigatoria: true, nomes: ['nome', 'produto', 'nome da peca'] },
  { campo: 'categoria', obrigatoria: true, nomes: ['categoria', 'colecao'] },
  { campo: 'preco', obrigatoria: true, nomes: ['preco', 'preco de venda', 'valor'] },
  { campo: 'estoque', obrigatoria: true, nomes: ['estoque', 'quantidade', 'qtd'] },
  { campo: 'sub', obrigatoria: false, nomes: ['sub', 'subcategoria', 'tipo'] },
  { campo: 'desc', obrigatoria: false, nomes: ['desc', 'descricao'] },
  { campo: 'etiqueta', obrigatoria: false, nomes: ['etiqueta', 'selo'] },
  { campo: 'img', obrigatoria: false, nomes: ['img', 'imagem', 'foto'] },
  { campo: 'vitrine', obrigatoria: false, nomes: ['vitrine', 'ativo', 'visivel'] },
]

const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

export function lerCsv(texto) {
  const limpo = texto.replace(/^﻿/, '')
  const primeira = limpo.split(/\r?\n/)[0] || ''
  const delimitador = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ','

  const linhas = []
  let linha = []
  let celula = ''
  let aspas = false
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i]
    if (aspas) {
      if (c === '"' && limpo[i + 1] === '"') { celula += '"'; i++ }
      else if (c === '"') aspas = false
      else celula += c
    } else if (c === '"') aspas = true
    else if (c === delimitador) { linha.push(celula); celula = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpo[i + 1] === '\n') i++
      linha.push(celula); celula = ''
      linhas.push(linha); linha = []
    } else celula += c
  }
  if (celula !== '' || linha.length) { linha.push(celula); linhas.push(linha) }
  return linhas.filter((l) => l.some((c) => c.trim() !== ''))
}

export async function textoDoArquivo(arquivo) {
  const bytes = await arquivo.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch (e) {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

export function planilhaParaProdutos(texto) {
  const matriz = lerCsv(texto)
  if (matriz.length === 0) return { linhas: [], faltando: COLUNAS.filter((c) => c.obrigatoria).map((c) => c.campo), ignoradas: [] }

  const cabecalho = matriz[0].map(semAcento)
  const indice = {}
  const ignoradas = []
  cabecalho.forEach((nome, i) => {
    const col = COLUNAS.find((c) => c.nomes.includes(nome))
    if (col && indice[col.campo] === undefined) indice[col.campo] = i
    else if (nome !== '') ignoradas.push(matriz[0][i].trim())
  })
  const faltando = COLUNAS.filter((c) => c.obrigatoria && indice[c.campo] === undefined).map((c) => c.campo)

  const linhas = matriz.slice(1).map((celulas) => {
    const obj = {}
    for (const campo of Object.keys(indice)) obj[campo] = (celulas[indice[campo]] || '').trim()
    return obj
  })
  return { linhas, faltando, ignoradas }
}

export const MODELO_CSV =
  'sku;nome;categoria;sub;preco;estoque;descricao;etiqueta;imagem;vitrine\n' +
  'AR-90001;Blusa Exemplo;feminino;blusas;139,90;20;Blusa de algodão com caimento reto;novo;;sim\n' +
  'AR-90002;Colar Exemplo;acessorios;joias;89,90;15;Colar dourado delicado;;;sim\n'
