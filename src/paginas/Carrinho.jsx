import { Link, useNavigate } from 'react-router-dom'
import CalculoFrete from '../componentes/CalculoFrete.jsx'
import { formatBRL, calcularFrete } from '../componentes/Produtos.jsx'

function Carrinho({ itens, subtotal, endereco, onEndereco, onAlterar, onRemover }) {
  const navegar = useNavigate()

  const frete = endereco ? calcularFrete(endereco.uf, subtotal) : null
  const total = subtotal + (frete || 0)

  if (itens.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 pt-16 text-center" id="carrinho-vazio">
        <h1 className="titulo-pagina">Sua sacola</h1>
        <p className="subtitulo-pagina mt-4">Seu carrinho está esperando por você.</p>
        <Link to="/feminino" className="botao-principal inline-block mt-8">Ver produtos</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1216px] mx-auto px-6 pt-12" id="pagina-carrinho">
      <div className="text-center">
        <h1 className="titulo-pagina">Seu carrinho</h1>
        <p className="subtitulo-pagina mt-2">Confira os produtos antes de finalizar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 mt-10">
        <section className="caixa-branca" id="lista-itens">
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_30px] gap-4 px-6 py-3 border-b border-stone-200 text-[10px] uppercase tracking-widest text-pedra">
            <span>Produto</span>
            <span className="text-center">Quantidade</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>

          {itens.map((item) => (
            <div
              key={item.chave}
              className="grid grid-cols-[72px_1fr] sm:grid-cols-[72px_1fr_120px_100px_30px] gap-4 items-center px-6 py-5 border-b border-stone-100"
            >
              <div className="w-[72px] h-[90px] bg-[#e8e2d8] overflow-hidden">
                {item.produto.img && <img src={item.produto.img} alt="" className="w-full h-full object-cover" />}
              </div>

              <div>
                <Link to={'/produto/' + item.produto.id} className="text-sm font-medium hover:underline">
                  {item.produto.nome}
                </Link>
                <p className="text-[11px] text-pedra mt-1">
                  Tam. {item.tamanho} · {item.cor}
                </p>
                <p className="text-[11px] text-pedra">{formatBRL(item.produto.preco)} cada</p>
              </div>

              <div className="flex items-center justify-center border border-stone-300 w-fit mx-auto">
                <button className="w-7 h-8" onClick={() => onAlterar(item.chave, -1)} aria-label="Diminuir">−</button>
                <span className="w-7 text-center text-xs">{item.qtd}</span>
                <button className="w-7 h-8" onClick={() => onAlterar(item.chave, 1)} aria-label="Aumentar">+</button>
              </div>

              <p className="text-sm font-semibold text-right">{formatBRL(item.produto.preco * item.qtd)}</p>

              <button className="text-stone-400 hover:text-red-700 text-lg" onClick={() => onRemover(item.chave)} aria-label="Remover">
                ×
              </button>
            </div>
          ))}

          <div className="px-6 py-4">
            <Link to="/" className="text-xs underline text-pedra">← Continuar comprando</Link>
          </div>
        </section>

        <aside className="caixa-branca p-6 h-fit" id="resumo-pedido">
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-5">Resumo do pedido</h2>

          <div className="flex justify-between text-sm py-2">
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm py-2">
            <span>Frete</span>
            <span>{frete === null ? 'a calcular' : frete === 0 ? 'Grátis' : formatBRL(frete)}</span>
          </div>

          <div className="my-4">
            <CalculoFrete subtotal={subtotal} endereco={endereco} onEndereco={onEndereco} idCampo="cep-carrinho" />
          </div>

          <div className="flex justify-between text-base font-semibold border-t border-stone-200 pt-4 mt-2">
            <span>Total</span>
            <span id="total-carrinho">{formatBRL(total)}</span>
          </div>

          <button className="botao-principal w-full mt-6" onClick={() => navegar('/checkout')}>
            Finalizar compra
          </button>
        </aside>
      </div>
    </div>
  )
}

export default Carrinho
