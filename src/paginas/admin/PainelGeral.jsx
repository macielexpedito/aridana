import { useState, useEffect } from 'react'
import { chamarApi } from '../../componentes/Contas.js'
import { formatBRL } from '../../componentes/Produtos.jsx'

const ROTULO_STATUS = { novo: 'Novos', pago: 'Pagos', enviado: 'Enviados', entregue: 'Entregues', cancelado: 'Cancelados' }

function PainelGeral({ produtos, tratarErro }) {
  const [resumo, setResumo] = useState(null)

  useEffect(() => {
    chamarApi('admin/resumo').then(setResumo).catch((err) => tratarErro(err, 'Não foi possível carregar o resumo.'))
  }, [])

  const baixo = produtos.filter((p) => p.estoque < 10)

  return (
    <div className="p-6" id="secao-painel-geral">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Painel Geral</p>
      <h1 className="font-titulo text-3xl mt-1">Painel Geral</h1>
      <p className="text-xs text-stone-600 mt-1">Resumo da loja com dados do banco.</p>

      {!resumo ? (
        <p className="text-xs text-stone-600 mt-6">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Faturamento</p>
              <p className="font-titulo text-3xl mt-2">{formatBRL(resumo.pedidos.faturamento)}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Pedidos (sem cancelados)</p>
              <p className="font-titulo text-3xl mt-2">{resumo.pedidos.total}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Ticket médio</p>
              <p className="font-titulo text-3xl mt-2">{formatBRL(resumo.pedidos.ticketMedio)}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Clientes</p>
              <p className="font-titulo text-3xl mt-2">{resumo.clientes}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Produtos na vitrine</p>
              <p className="font-titulo text-3xl mt-2">{resumo.produtos.vitrine} <span className="text-base text-pedra">/ {resumo.produtos.total}</span></p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-red-700">Estoque baixo</p>
              <p className="font-titulo text-3xl mt-2">{resumo.produtos.estoqueBaixo}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra mb-3">Pedidos por situação</p>
              <ul className="text-xs space-y-1">
                {Object.keys(ROTULO_STATUS).map((s) => (
                  <li key={s} className="flex justify-between"><span>{ROTULO_STATUS[s]}</span><span className="font-semibold">{resumo.pedidos.porStatus[s] || 0}</span></li>
                ))}
              </ul>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra mb-3">Últimos pedidos</p>
              {resumo.recentes.length === 0 && <p className="text-xs text-stone-600">Nenhum pedido ainda.</p>}
              <ul className="text-xs space-y-1">
                {resumo.recentes.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>{p.numero} · {p.cliente.nome}</span>
                    <span className="font-semibold">{formatBRL(p.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="caixa-branca p-4 mt-4">
            <p className="text-[9px] uppercase tracking-widest text-red-700 mb-3">Peças com estoque baixo (menos de 10)</p>
            {baixo.length === 0 && <p className="text-xs text-stone-600">Nenhuma peça com estoque baixo.</p>}
            <ul className="text-xs space-y-1">
              {baixo.map((p) => (
                <li key={p.id} className="flex justify-between"><span>{p.nome} ({p.ref})</span><span>{p.estoque} un.</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default PainelGeral
