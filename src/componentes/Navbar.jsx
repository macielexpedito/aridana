import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatBRL } from './Produtos.jsx'
import { Lupa, Usuario, Coracao, Sacola } from './Icones.jsx'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" id="logo">
      <img src="/img/logotipo.png" alt="Logo Aridana" className="h-12 sm:h-16 lg:h-20 w-auto object-contain" />
    </Link>
  )
}

const LINKS = [
  { caminho: '/', rotulo: 'Início' },
  { caminho: '/feminino', rotulo: 'Feminino' },
  { caminho: '/masculino', rotulo: 'Masculino' },
  { caminho: '/acessorios', rotulo: 'Acessórios' },
]

function Navbar({ carrinho, subtotal, usuario, onSair }) {
  const location = useLocation()
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')

  const classeLink = (caminho) =>
    'menu-link ' + (location.pathname === caminho ? 'menu-link-ativo font-medium' : '')

  function enviarBusca(e) {
    e.preventDefault()
    const termo = busca.trim()
    if (termo === '') return
    navegar('/busca?q=' + encodeURIComponent(termo))
    setBusca('')
  }

  return (
    <header className="cabecalho" id="cabecalho-loja">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:min-h-[120px]">
        <Logo />

        <div className="flex flex-col items-center gap-3">
          <nav className="hidden sm:flex gap-8" id="menu-principal">
            {LINKS.map((l) => (
              <Link key={l.caminho} to={l.caminho} className={classeLink(l.caminho)}>
                {l.rotulo}
              </Link>
            ))}
          </nav>

          <form onSubmit={enviarBusca} id="form-busca" className="barra-busca max-w-xl hidden sm:flex">
            <Lupa />
            <input
              id="campo-busca"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="O que você está procurando hoje? (ex: vestidos, bolsas, camisas...)"
            />
          </form>
        </div>

        <div className="flex items-center gap-5 text-marrom">
          {usuario ? (
            <div className="hidden lg:flex items-center gap-2 text-left" id="area-conta">
              <Usuario />
              <span className="leading-tight">
                <span className="block text-[11px] font-medium text-carvao">{usuario.nome.split(' ')[0]}</span>
                <span className="block text-[10px] uppercase tracking-wider text-stone-500">
                  {usuario.tipo === 'admin' && (
                    <>
                      <Link to="/admin" className="underline">Painel</Link> ·{' '}
                    </>
                  )}
                  <button type="button" onClick={onSair} className="uppercase underline" id="botao-sair">Sair</button>
                </span>
              </span>
            </div>
          ) : (
            <Link to="/login" className="hidden lg:flex items-center gap-2 text-left" id="botao-conta">
              <Usuario />
              <span className="leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-stone-500">Entrar</span>
                <span className="block text-[11px] font-medium text-carvao">Minha Conta</span>
              </span>
            </Link>
          )}

          <button type="button" className="hidden sm:block text-carvao" id="botao-favoritos" aria-label="Favoritos">
            <Coracao />
          </button>

          <Link to="/carrinho" id="botao-sacola" className="flex items-center gap-3 text-carvao">
            <span className="relative">
              <Sacola />
              {carrinho > 0 && (
                <span
                  id="contador-sacola"
                  className="absolute -top-2 -right-2 bg-carvao text-white text-[10px] font-bold rounded-full w-4 h-[17px] border border-white flex items-center justify-center"
                >
                  {carrinho}
                </span>
              )}
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-stone-500">Sacola</span>
              <span className="block text-xs font-semibold">{formatBRL(subtotal)}</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="sm:hidden flex justify-around border-t border-black/10 text-xs py-2 bg-taupe">
        {LINKS.map((l) => (
          <Link key={l.caminho} to={l.caminho} className={classeLink(l.caminho)}>
            {l.rotulo}
          </Link>
        ))}
      </div>
    </header>
  )
}

export default Navbar
