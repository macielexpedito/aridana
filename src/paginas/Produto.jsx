import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import CalculoFrete from '../componentes/CalculoFrete.jsx'
import { acharProduto, formatBRL } from '../componentes/Produtos.jsx'
import { Coracao } from '../componentes/Icones.jsx'

const CORES = [
  { nome: 'Areia Natural', cor: '#d8cebc' },
  { nome: 'Off White', cor: '#efece6' },
  { nome: 'Terracota Suave', cor: '#a5664d' },
  { nome: 'Preto Ébano', cor: '#272624' },
]
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG']

function Produto({ onComprar, endereco, onEndereco }) {
  const { id } = useParams()
  const produto = acharProduto(id)

  const [cor, setCor] = useState(0)
  const [tamanho, setTamanho] = useState('M')
  const [qtd, setQtd] = useState(1)
  const [favorito, setFavorito] = useState(false)
  const [aberto, setAberto] = useState('')
  const [miniatura, setMiniatura] = useState(0)

  if (!produto) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-20 text-center" id="pagina-produto-vazia">
        <p className="titulo-pagina">Produto não encontrado</p>
        <Link to="/" className="botao-principal inline-block mt-8">Voltar para a loja</Link>
      </div>
    )
  }

  const preco = produto.preco
  const pix = preco * 0.95
  const parcela = preco / 3
  const semEstoque = produto.estoque === 0

  const enquadramentos = ['object-top', 'object-center scale-150', 'object-bottom']

  function alternarAcordeao(nome) {
    setAberto(aberto === nome ? '' : nome)
  }

  return (
    <div className="max-w-[1250px] mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-[100px_1fr_460px] gap-8" id="pagina-produto">
      <div className="hidden lg:flex flex-col gap-3" id="miniaturas">
        {enquadramentos.map((enq, i) => (
          <button
            key={i}
            onClick={() => setMiniatura(i)}
            className={'w-20 h-28 overflow-hidden bg-[#eae5de] p-[3px] ' + (miniatura === i ? 'border-2 border-carvao' : 'border border-stone-300 opacity-60')}
          >
            {produto.img && <img src={produto.img} alt="" className={'w-full h-full object-cover ' + enq} />}
          </button>
        ))}
      </div>

      <div className="relative bg-[#eae5de] overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[560px]" id="foto-principal">
        {produto.img ? (
          <img src={produto.img} alt={produto.nome} className={'w-full h-full object-cover ' + (miniatura === 1 ? 'scale-150' : miniatura === 2 ? 'object-bottom' : 'object-top')} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-titulo text-7xl text-dourado/50">A</div>
        )}
        <span className="absolute top-4 left-4 bg-[#f6f3ee]/90 border border-carvao/20 px-4 py-[6px] text-[9px] tracking-[0.25em] uppercase font-semibold">
          Coleção Essenciais
        </span>
        <span className="absolute bottom-4 right-4 bg-[#f6f3ee]/80 px-3 py-[6px] text-[9px] tracking-[0.1em] uppercase">
          Zoom interativo
        </span>
      </div>

      <div id="detalhes-produto">
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold text-pedra">Ref. {produto.ref}</p>
        <h1 className="font-texto text-3xl text-marrom uppercase mt-3">{produto.nome}</h1>

        <div className="border-y border-stone-300/70 py-4 mt-5">
          <p className="flex items-baseline gap-3">
            <span className="text-2xl font-medium">{formatBRL(preco)}</span>
            <span className="text-xs text-pedra">à vista via Pix (5% off): {formatBRL(pix)}</span>
          </p>
          <p className="text-xs font-light text-stone-600 mt-1">
            Ou até 3x de <span className="font-normal">{formatBRL(parcela)}</span> sem juros no cartão
          </p>
        </div>

        <p className="text-xs font-light leading-[1.6] text-[#3f3732] mt-5">{produto.desc}</p>

        <p className="text-xs uppercase tracking-wider font-medium mt-6">
          Cor: <span className="font-light text-pedra">{CORES[cor].nome}</span>
        </p>
        <div className="flex gap-3 mt-3" id="seletor-cores">
          {CORES.map((c, i) => (
            <button
              key={c.nome}
              onClick={() => setCor(i)}
              aria-label={c.nome}
              style={{ background: c.cor }}
              className={'w-8 h-8 rounded-full border border-stone-300 ' + (cor === i ? 'ring-2 ring-offset-2 ring-carvao' : '')}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <p className="text-xs uppercase tracking-wider font-medium">
            Tamanho selecionado: <span className="font-light text-pedra">{tamanho}</span>
          </p>
          <button className="text-[11px] font-light text-pedra underline">Guia de Medidas</button>
        </div>
        <div className="flex gap-2 mt-3" id="seletor-tamanhos">
          {TAMANHOS.map((t) => (
            <button
              key={t}
              onClick={() => setTamanho(t)}
              className={'flex-1 py-3 text-xs border ' + (tamanho === t ? 'bg-carvao text-white border-carvao font-semibold' : 'border-stone-300 hover:border-carvao')}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-stretch gap-3 mt-6">
          <div className="flex items-center border border-stone-300 bg-white px-2" id="controle-quantidade">
            <button className="w-8 text-lg" onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Diminuir">−</button>
            <span className="w-8 text-center text-xs font-medium">{qtd}</span>
            <button className="w-8 text-lg" onClick={() => setQtd(qtd + 1)} aria-label="Aumentar">+</button>
          </div>

          <button
            id="botao-adicionar"
            className="botao-principal flex-1"
            disabled={semEstoque}
            onClick={() => onComprar(produto, qtd, tamanho, CORES[cor].nome)}
          >
            {semEstoque ? 'Sem estoque' : 'Adicionar à sacola'}
          </button>

          <button
            onClick={() => setFavorito(!favorito)}
            className="bg-white border border-stone-300 px-4 flex items-center"
            aria-label="Favoritar"
          >
            <Coracao cheio={favorito} />
          </button>
        </div>

        <div className="mt-8 bg-white/40 p-4">
          <CalculoFrete subtotal={preco * qtd} endereco={endereco} onEndereco={onEndereco} idCampo="cep-produto" />
        </div>

        <div className="border-t border-stone-300 mt-8">
          {[
            { chave: 'composicao', titulo: 'Composição & cuidados', texto: 'Linho e algodão orgânico. Lavar à mão ou ciclo delicado, secar à sombra e passar em temperatura média.' },
            { chave: 'troca', titulo: 'Política de troca & devolução', texto: 'Você tem 30 dias após o recebimento para solicitar a troca ou devolução, com a peça sem uso e com etiqueta.' },
          ].map((a) => (
            <div key={a.chave} className="border-b border-stone-200">
              <button
                onClick={() => alternarAcordeao(a.chave)}
                className="w-full flex justify-between items-center py-4 text-xs uppercase tracking-wider font-medium"
              >
                {a.titulo}
                <span className="text-pedra text-[10px]">{aberto === a.chave ? '▲' : '▼'}</span>
              </button>
              {aberto === a.chave && <p className="text-xs font-light text-stone-600 pb-4 leading-relaxed">{a.texto}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Produto
