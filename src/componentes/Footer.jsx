import { Link } from 'react-router-dom'
import { Caminhao, Escudo, Fone, Troca } from './Icones.jsx'
import { FRETE_GRATIS_A_PARTIR, formatBRL } from './Produtos.jsx'

const ITENS = [
  { icone: <Caminhao />, titulo: 'Frete Grátis', desc: 'Em compras acima de ' + formatBRL(FRETE_GRATIS_A_PARTIR) },
  { icone: <Escudo />, titulo: 'Pagamento Seguro', desc: 'Checkout 100% protegido' },
  { icone: <Fone />, titulo: 'Suporte 24/7', desc: 'Estamos aqui para ajudar' },
  { icone: <Troca />, titulo: 'Troca Fácil', desc: '30 dias para devolução' },
]

function Footer() {
  return (
    <footer className="rodape-loja" id="rodape-loja">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-12 text-sm font-texto">
        {ITENS.map((it) => (
          <div key={it.titulo} className="flex items-center gap-4">
            <span className="text-areia shrink-0">{it.icone}</span>
            <div>
              <p className="font-medium">{it.titulo}</p>
              <p className="text-[13px] text-white/80">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-white/50 pb-6 px-4">
        © 2026 ARIDANA Moda &amp; Acessórios — Projeto Integrador SENAI ·{' '}
        <Link to="/admin" className="underline hover:text-white">Área administrativa</Link>
      </p>
    </footer>
  )
}

export default Footer
