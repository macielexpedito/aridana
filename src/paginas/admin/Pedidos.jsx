import { Fragment, useState, useEffect } from 'react'
import { chamarApi } from '../../componentes/Contas.js'
import { formatBRL } from '../../componentes/Produtos.jsx'

const STATUS = [
  { chave: 'novo', rotulo: 'Novo' },
  { chave: 'pago', rotulo: 'Pago' },
  { chave: 'enviado', rotulo: 'Enviado' },
  { chave: 'entregue', rotulo: 'Entregue' },
  { chave: 'cancelado', rotulo: 'Cancelado' },
]

function Pedidos({ onMensagem, tratarErro, onProdutosAlterados }) {
  const [pedidos, setPedidos] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [aberto, setAberto] = useState('')

  useEffect(() => {
    chamarApi('admin/pedidos').then(setPedidos).catch((err) => tratarErro(err, 'Não foi possível carregar os pedidos.'))
  }, [])

  async function mudarStatus(pedido, status) {
    if (status === pedido.status) return
    if (status === 'cancelado' && !window.confirm('Cancelar o pedido ' + pedido.numero + '? As peças voltam ao estoque e isso não pode ser desfeito.')) return
    try {
      const salvo = await chamarApi('admin/pedidos/' + pedido.id, { status }, 'PUT')
      setPedidos(pedidos.map((p) => (p.id === salvo.id ? salvo : p)))
      if (status === 'cancelado') onProdutosAlterados()
      onMensagem('Pedido ' + salvo.numero + ' atualizado')
    } catch (err) {
      if (err.message === 'pedido_cancelado') onMensagem('Pedido cancelado não pode mais ser alterado')
      else if (err.message === 'pedido_entregue') onMensagem('Pedido entregue não pode ser cancelado')
      else tratarErro(err, 'Não foi possível atualizar o pedido.')
    }
  }

  const lista = (pedidos || []).filter((p) => filtro === 'todos' || p.status === filtro)

  return (
    <div className="p-6" id="secao-pedidos">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Pedidos &amp; Vendas</p>
      <h1 className="font-titulo text-3xl mt-1">Pedidos &amp; Vendas</h1>
      <p className="text-xs text-stone-600 mt-1">Pedidos feitos na loja. Os valores foram calculados pelo servidor.</p>

      <div className="flex flex-wrap gap-2 mt-6">
        {[{ chave: 'todos', rotulo: 'Todos' }, ...STATUS].map((s) => (
          <button key={s.chave} onClick={() => setFiltro(s.chave)} className={'filtro-pilula ' + (filtro === s.chave ? 'filtro-pilula-ativo' : '')}>
            {s.rotulo}
          </button>
        ))}
      </div>

      <div className="caixa-branca mt-4 overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-[#f6f3ed] text-[9px] uppercase tracking-widest text-pedra">
            <tr>
              <th className="text-left p-3">Pedido</th>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Situação</th>
              <th className="p-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-t border-stone-100">
                  <td className="p-3 font-medium">{p.numero}</td>
                  <td className="p-3">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">{p.cliente.nome}</td>
                  <td className="p-3 font-semibold">{formatBRL(p.total)}</td>
                  <td className="p-3">
                    <select
                      className="campo !py-1"
                      value={p.status}
                      disabled={p.status === 'cancelado'}
                      onChange={(e) => mudarStatus(p, e.target.value)}
                      aria-label={'Situação do pedido ' + p.numero}
                    >
                      {STATUS.map((s) => <option key={s.chave} value={s.chave}>{s.rotulo}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    <button className="underline" onClick={() => setAberto(aberto === p.id ? '' : p.id)}>{aberto === p.id ? 'Fechar' : 'Ver'}</button>
                  </td>
                </tr>
                {aberto === p.id && (
                  <tr className="bg-[#fcf8f0]">
                    <td colSpan={6} className="p-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="uppercase tracking-widest font-semibold mb-1">Cliente</p>
                          <p>{p.cliente.nome} · {p.cliente.email}</p>
                          <p>CPF {p.cliente.cpf || '—'} · Tel. {p.cliente.telefone || '—'}</p>
                          <p className="uppercase tracking-widest font-semibold mt-3 mb-1">Entrega</p>
                          <p>{p.endereco.rua}, {p.endereco.numero} — {p.endereco.bairro}</p>
                          <p>{p.endereco.cidade}/{p.endereco.uf} · CEP {p.endereco.cep}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-widest font-semibold mb-1">Itens ({p.pagamento})</p>
                          {p.itens.map((i, k) => (
                            <p key={k}>{i.qtd}× {i.nome} · Tam. {i.tamanho} · {formatBRL(i.preco * i.qtd)}</p>
                          ))}
                          <p className="mt-2">Subtotal {formatBRL(p.subtotal)} · Frete {formatBRL(p.frete)}{p.desconto > 0 ? ' · Desconto −' + formatBRL(p.desconto) : ''}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {pedidos === null && <p className="p-6 text-center text-pedra">Carregando pedidos...</p>}
        {pedidos !== null && lista.length === 0 && <p className="p-6 text-center text-pedra">Nenhum pedido encontrado.</p>}
      </div>
    </div>
  )
}

export default Pedidos
