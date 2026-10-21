import { Link, Navigate } from 'react-router-dom'
import { formatBRL } from '../componentes/Produtos.jsx'

const ETAPAS = [
  { titulo: 'Pedido confirmado', texto: 'Recebemos o seu pedido e o pagamento foi registrado.' },
  { titulo: 'Separação em estoque', texto: 'Estamos separando e embalando as suas peças.' },
  { titulo: 'Enviado', texto: 'Você receberá o código de rastreio por e-mail.' },
  { titulo: 'Entregue', texto: 'Previsão de entrega em 3 a 7 dias úteis.' },
]

function Pedido({ pedido }) {
  if (!pedido) return <Navigate to="/" replace />

  const c = pedido.cliente

  return (
    <div className="max-w-[1216px] mx-auto px-6 pt-10" id="pagina-pedido">
      <ol className="flex justify-center items-center gap-3 text-[10px] uppercase tracking-widest text-pedra mb-10" id="etapas-compra">
        <li>Carrinho</li><li>—</li><li>Dados e entrega</li><li>—</li><li className="text-carvao font-semibold">Pagamento concluído</li>
      </ol>

      <div className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-white border border-stone-200 flex items-center justify-center text-3xl text-dourado">✓</div>
        <h1 className="font-titulo text-3xl sm:text-5xl text-marrom mt-6">Pedido realizado com sucesso!</h1>
        <p className="text-sm text-stone-600 mt-4 max-w-xl mx-auto">
          Obrigada pela compra, {c.nome.split(' ')[0]}. Enviamos a confirmação para {c.email}.
        </p>
        <p className="text-xs text-pedra mt-2">Pedido {pedido.numero} · {pedido.data}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 mt-10">
        <div className="flex flex-col gap-6">
          <section className="caixa-branca p-6" id="linha-do-tempo">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-5">Entrega e rastreio</h2>
            <ul className="flex flex-col gap-5">
              {ETAPAS.map((e, i) => (
                <li key={e.titulo} className="flex gap-4">
                  <span className={'w-5 h-5 rounded-full border-2 shrink-0 mt-1 ' + (i === 0 ? 'bg-carvao border-carvao' : 'border-stone-300')} />
                  <div>
                    <p className={'text-sm ' + (i === 0 ? 'font-semibold' : 'text-pedra')}>{e.titulo}</p>
                    <p className="text-xs text-pedra">{e.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="caixa-branca p-6 grid sm:grid-cols-2 gap-6 text-xs" id="dados-entrega">
            <div>
              <h3 className="uppercase tracking-widest font-semibold mb-2">Endereço</h3>
              <p>{c.rua}, {c.numero}</p>
              <p>{c.bairro} — {c.cidade}/{c.uf}</p>
              <p>CEP {c.cep}</p>
            </div>
            <div>
              <h3 className="uppercase tracking-widest font-semibold mb-2">Pagamento</h3>
              <p className="capitalize">{pedido.pagamento === 'cartao' ? 'Cartão de crédito' : pedido.pagamento}</p>
              <p className="text-pedra">Mercado Pago (sandbox)</p>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to="/" className="botao-principal">Continuar comprando</Link>
            <Link to="/feminino" className="botao-contorno">Ver novidades</Link>
          </div>
        </div>

        <aside className="caixa-branca p-6 h-fit" id="resumo-final">
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4">Resumo da compra</h2>
          {pedido.itens.map((item) => (
            <div key={item.chave} className="flex gap-3 py-3 border-b border-stone-100">
              <div className="w-12 h-16 bg-[#e8e2d8] overflow-hidden shrink-0">
                {item.produto.img && <img src={item.produto.img} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-medium">{item.produto.nome}</p>
                <p className="text-pedra">Tam. {item.tamanho} · Qtd {item.qtd}</p>
              </div>
              <span className="text-xs">{formatBRL(item.produto.preco * item.qtd)}</span>
            </div>
          ))}
          <div className="text-sm mt-4 flex flex-col gap-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(pedido.subtotal)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{pedido.frete === 0 ? 'Grátis' : formatBRL(pedido.frete)}</span></div>
            {pedido.desconto > 0 && (
              <div className="flex justify-between"><span>Desconto Pix</span><span>− {formatBRL(pedido.desconto)}</span></div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-stone-200 pt-3">
              <span>Total pago</span><span>{formatBRL(pedido.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Pedido
