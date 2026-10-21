import { useEffect, useState } from 'react'
import ProdutoCard from '../componentes/ProdutoCard.jsx'
import { produtos, categoria } from '../componentes/Produtos.jsx'

function Categoria({ chave, onComprar }) {
  const info = categoria[chave]
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    setFiltro('todos')
  }, [chave])

  const lista = produtos[chave].filter((p) => filtro === 'todos' || p.sub === filtro)

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-12" id={'pagina-' + chave}>
      <div className="text-center">
        <h1 className="titulo-pagina">{info.titulo}</h1>
        <p className="subtitulo-pagina mt-2">{info.subtitulo}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-8" id="filtros-categoria">
        {info.filtros.map((f) => (
          <button
            key={f.chave}
            onClick={() => setFiltro(f.chave)}
            className={'filtro-pilula ' + (filtro === f.chave ? 'filtro-pilula-ativo' : '')}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="text-center text-sm text-pedra mt-16">Nenhum produto nesta categoria por enquanto.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
          {lista.map((p) => (
            <ProdutoCard key={p.id} produto={p} onComprar={onComprar} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Categoria
