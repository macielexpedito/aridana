import { useEffect, useState } from 'react'
import { chamarApi } from './Contas.js'

const LINK_MP = /^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.br)?\//

function AguardandoPagamento({ numero, chave, pix }) {
  const [status, setStatus] = useState('novo')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (status !== 'novo') return
    const rota = 'pagamento/' + encodeURIComponent(numero) + '?chave=' + encodeURIComponent(chave)
    const id = setInterval(async () => {
      try {
        const r = await chamarApi(rota)
        if (r.status !== 'novo') setStatus(r.status)
      } catch (e) {}
    }, 5000)
    return () => clearInterval(id)
  }, [status, numero, chave])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.qrCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (e) {}
  }

  if (status === 'pago') {
    return (
      <div className="caixa-branca p-6 mt-8 text-center" id="pagamento-confirmado" role="status">
        <p className="text-sm font-semibold text-green-800">Pagamento confirmado!</p>
        <p className="text-xs text-pedra mt-1">Já estamos separando o seu pedido.</p>
      </div>
    )
  }

  if (status === 'cancelado') {
    return (
      <div className="caixa-branca p-6 mt-8 text-center" id="pagamento-cancelado" role="alert">
        <p className="text-sm font-semibold text-red-700">O pagamento não foi concluído e o pedido foi cancelado.</p>
        <p className="text-xs text-pedra mt-1">Você pode refazer a compra quando quiser.</p>
      </div>
    )
  }

  return (
    <div className="caixa-branca p-6 mt-8 text-center" id="aguardando-pagamento" role="status">
      {pix && pix.qrCodeBase64 ? (
        <>
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold">Pague com Pix</h2>
          <p className="text-xs text-pedra mt-2">Abra o app do seu banco, escolha pagar com Pix e leia o QR Code ou use o código copia e cola.</p>
          <img src={'data:image/png;base64,' + pix.qrCodeBase64} alt="QR Code do Pix" className="w-48 h-48 mx-auto mt-4" />
          {pix.qrCode && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input readOnly className="campo flex-1 text-xs" value={pix.qrCode} aria-label="Código Pix copia e cola" />
              <button type="button" className="botao-principal" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar código'}</button>
            </div>
          )}
          {pix.ticketUrl && LINK_MP.test(pix.ticketUrl) && (
            <p className="mt-3"><a className="text-xs underline text-pedra" href={pix.ticketUrl} target="_blank" rel="noopener noreferrer">Abrir instruções de pagamento</a></p>
          )}
        </>
      ) : (
        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold">Estamos confirmando o seu pagamento</h2>
      )}
      <p className="text-[11px] text-pedra mt-4">Esta tela se atualiza sozinha quando o pagamento for confirmado.</p>
    </div>
  )
}

export default AguardandoPagamento
