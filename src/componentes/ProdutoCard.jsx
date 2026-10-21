import { Link } from 'react-router-dom'
import { formatBRL } from './Produtos.jsx'

function ProdutoCard({ produto, onComprar }) {
  return (
    <article className="cartao-produto" id={'produto-' + produto.id}>
      <Link to={'/produto/' + produto.id} className="block">
        <div className="cartao-produto-imagem">
          {produto.img ? (
            <img src={produto.img} alt={produto.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-titulo text-5xl text-dourado/60">A</div>
          )}

          {produto.etiqueta && (
            <span className={'etiqueta etiqueta-' + produto.etiqueta}>{produto.etiqueta}</span>
          )}
        </div>

        <h3 className="mt-3 text-xs tracking-wide text-[#27201c]">{produto.nome}</h3>
        <p className="text-xs font-semibold text-[#27201c] mt-1">{formatBRL(produto.preco)}</p>
      </Link>

      <button
        onClick={() => onComprar(produto)}
        className="mt-3 border border-stone-300 text-[10px] uppercase tracking-[0.2em] py-2 hover:bg-carvao hover:text-white transition-colors disabled:opacity-40"
        disabled={produto.estoque === 0}
      >
        {produto.estoque === 0 ? 'Sem estoque' : 'Adicionar à sacola'}
      </button>
    </article>
  )
}

export default ProdutoCard
