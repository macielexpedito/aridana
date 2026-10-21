import { useSearchParams } from 'react-router-dom'
import ProdutoCard from '../componentes/ProdutoCard.jsx'
import { todosProdutos } from '../componentes/Produtos.jsx'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Busca({ onComprar }) {
  const [params] = useSearchParams()
  const termo = params.get('q') || ''

  const resultado = todosProdutos.filter((p) => normalizar(p.nome).includes(normalizar(termo)))

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-12" id="pagina-busca">
      <div className="text-center">
        <h1 className="titulo-pagina">Busca</h1>
        <p className="subtitulo-pagina mt-2">
          {resultado.length} resultado(s) para “{termo}”
        </p>
      </div>

      {resultado.length === 0 ? (
        <p className="text-center text-sm text-pedra mt-16" id="busca-vazia">
          Não encontramos nada com esse nome. Tente outra palavra, como “vestido” ou “bolsa”.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
          {resultado.map((p) => (
            <ProdutoCard key={p.id} produto={p} onComprar={onComprar} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Busca
