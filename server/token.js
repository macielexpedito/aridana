import crypto from 'node:crypto'

const b64 = (buf) => Buffer.from(buf).toString('base64url')

function assinar(dados, segredo) {
  return crypto.createHmac('sha256', segredo).update(dados).digest('base64url')
}

export function criarToken(payload, segredo, validadeSegundos) {
  const corpo = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + validadeSegundos }))
  return corpo + '.' + assinar(corpo, segredo)
}

export function verificarToken(token, segredo) {
  if (typeof token !== 'string') return null
  const partes = token.split('.')
  if (partes.length !== 2) return null
  const [corpo, assinatura] = partes

  const esperada = Buffer.from(assinar(corpo, segredo))
  const recebida = Buffer.from(assinatura)
  if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null

  try {
    const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (e) {
    return null
  }
}
