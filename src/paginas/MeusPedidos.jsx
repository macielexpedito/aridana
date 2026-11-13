import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatBRL } from '../componentes/Produtos.jsx'

const ETAPAS = ['novo', 'pago', 'enviado', 'entregue']
const ROTULOS = {
  novo: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

function MeusPedidos() {
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    async function carregar() {
      try {
        const r = await fetch('/api/meus-pedidos', { credentials: 'same-origin' })
        if (!r.ok) throw new Error('falha')
        const dados = await r.json()
        if (vivo) { setPedidos(dados); setErro(false) }
      } catch (e) {
        if (vivo) setErro(true)
      }
    }
    carregar()
    const t = setInterval(carregar, 15000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl mb-6">Meus pedidos</h1>
      {erro && <p className="text-sm text-red-700" role="alert">Não foi possível carregar seus pedidos. Tente de novo.</p>}
      {!pedidos && !erro && <p className="text-sm text-stone-600">Carregando...</p>}
      {pedidos && pedidos.length === 0 && (
        <p className="text-sm text-stone-600">
          Você ainda não tem pedidos. <Link to="/" className="underline">Ver produtos</Link>
        </p>
      )}
      <div className="flex flex-col gap-4">
        {(pedidos || []).map((p) => {
          const etapa = ETAPAS.indexOf(p.status)
          return (
            <article key={p.numero} className="border border-stone-200 p-4 bg-white">
              <div className="flex justify-between gap-3 flex-wrap">
                <strong>{p.numero}</strong>
                <span className="text-xs text-stone-500">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-sm mt-1">
                Status: <strong>{ROTULOS[p.status] || p.status}</strong>
                {p.pagamento === 'pix' && p.status === 'novo' && ' (Pix vence em 1 hora)'}
              </p>
              {p.status !== 'cancelado' && (
                <ol className="flex gap-2 mt-3 text-[11px] uppercase tracking-wider">
                  {ETAPAS.map((e, i) => (
                    <li key={e} className={'flex-1 border-t-2 pt-1 ' + (i <= etapa ? 'border-carvao text-carvao' : 'border-stone-200 text-stone-400')}>
                      {ROTULOS[e]}
                    </li>
                  ))}
                </ol>
              )}
              <ul className="mt-3 text-xs text-stone-700">
                {p.itens.map((i, n) => (
                  <li key={n}>{i.qtd}x {i.nome}{i.tamanho ? ' · ' + i.tamanho : ''}{i.cor ? ' · ' + i.cor : ''}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-right">Total: <strong>{formatBRL(p.total)}</strong></p>
            </article>
          )
        })}
      </div>
    </main>
  )
}

export default MeusPedidos