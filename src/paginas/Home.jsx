import { Link } from 'react-router-dom'
import ProdutoCard from '../componentes/ProdutoCard.jsx'
import { Fragment } from 'react'
import { acharProduto, configLoja } from '../componentes/Produtos.jsx'
import { Seta } from '../componentes/Icones.jsx'

const CATEGORIAS = [
  { caminho: '/feminino', titulo: 'Feminino', texto: 'Coleções exclusivas para o público feminino', img: '/img/cat-feminino.jpg' },
  { caminho: '/masculino', titulo: 'Masculino', texto: 'Estilo e sofisticação para o homem moderno', img: '/img/cat-masculino.jpg' },
  { caminho: '/acessorios', titulo: 'Acessórios', texto: 'Joias, bolsas e muito mais', img: '/img/cat-acessorios.jpg' },
]

function Home({ onComprar }) {
  const vendidos = configLoja.maisVendidos.map((id) => acharProduto(id)).filter(Boolean)

  return (
    <div id="pagina-home">
      <section id="banner-principal" className="relative bg-areia overflow-hidden">
        <img
          src="/img/hero.jpg"
          alt=""
          className="absolute right-0 top-0 h-full w-full lg:w-[65%] object-cover object-top opacity-50 lg:opacity-100"
        />
        <div className="absolute inset-0 hidden lg:block bg-linear-to-r from-areia via-areia/80 to-transparent w-[55%]" />

        <div className="relative max-w-[1440px] mx-auto px-6 sm:px-16 py-16 lg:py-24 min-h-[420px] lg:min-h-[520px] flex flex-col justify-center">
          <h1 className="font-texto text-4xl sm:text-5xl lg:text-[54px] leading-tight text-marrom">
            {configLoja.banner.titulo.split('\n').map((linha, i) => (
              <Fragment key={i}>{i > 0 && <br />}{linha}</Fragment>
            ))}
          </h1>
          <p className="font-texto text-lg sm:text-[22px] text-[#14120f] mt-6 max-w-sm">
            {configLoja.banner.subtitulo}
          </p>
          <Link
            to="/feminino"
            id="botao-comprar-agora"
            className="mt-8 inline-flex items-center gap-3 bg-marrom text-[#fffaf0] font-texto text-base px-8 py-4 w-fit rounded-[4px] hover:bg-black transition-colors"
          >
            COMPRAR AGORA <Seta />
          </Link>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 mt-14" id="secao-categorias">
        <h2 className="titulo-secao">Compre por categoria</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.caminho}
              to={c.caminho}
              className="relative block aspect-[3/4] overflow-hidden bg-[#e2dbd1] group"
            >
              <img src={c.img} alt={c.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-7">
                <h3 className="font-['Cormorant_Garamond'] font-bold text-2xl text-white tracking-[0.15em] uppercase">{c.titulo}</h3>
                <p className="text-xs font-light text-white/80 tracking-wide mt-1">{c.texto}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 mt-20" id="secao-mais-vendidos">
        <h2 className="titulo-secao">Mais vendidos</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {vendidos.map((p) => (
            <ProdutoCard key={p.id} produto={p} onComprar={onComprar} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
