import { Link } from 'react-router-dom'

function NaoEncontrada() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-20 text-center" id="pagina-404">
      <p className="font-titulo text-7xl text-dourado/60">404</p>
      <h1 className="titulo-pagina mt-4">Página não encontrada</h1>
      <p className="subtitulo-pagina mt-2">O endereço que você digitou não existe ou foi movido.</p>
      <Link to="/" className="botao-principal inline-block mt-8">Voltar para a loja</Link>
    </div>
  )
}

export default NaoEncontrada