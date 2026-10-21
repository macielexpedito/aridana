import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './componentes/Navbar.jsx'
import Footer from './componentes/Footer.jsx'
import Mensagens from './componentes/Mensagens.jsx'
import Home from './paginas/Home.jsx'
import Categoria from './paginas/Categoria.jsx'
import Busca from './paginas/Busca.jsx'
import Produto from './paginas/Produto.jsx'
import Carrinho from './paginas/Carrinho.jsx'
import Checkout from './paginas/Checkout.jsx'
import Pedido from './paginas/Pedido.jsx'
import Admin from './paginas/Admin.jsx'
import Login from './paginas/Login.jsx'
import { carregarCatalogo } from './componentes/Produtos.jsx'
import { lerSessao, salvarSessao, verificarSessao, encerrarSessao } from './componentes/Contas.js'

const TITULOS = {
  '/': 'Início',
  '/feminino': 'Feminino',
  '/masculino': 'Masculino',
  '/acessorios': 'Acessórios',
  '/carrinho': 'Seu carrinho',
  '/checkout': 'Finalizar compra',
  '/pedido': 'Pedido realizado',
  '/login': 'Entrar',
  '/admin': 'Administrador',
}

function App() {
  const location = useLocation()

  const [itens, setItens] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [endereco, setEndereco] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [usuario, setUsuario] = useState(lerSessao())
  const [verificado, setVerificado] = useState(false)
  const [, setVersaoCatalogo] = useState(0)

  function atualizarCatalogo() {
    return carregarCatalogo().then(() => setVersaoCatalogo((v) => v + 1))
  }
  useEffect(() => {
    atualizarCatalogo()
  }, [])

  useEffect(() => {
    verificarSessao().then((u) => {
      setUsuario(u)
      salvarSessao(u)
      setVerificado(true)
    })
  }, [])

  useEffect(() => {
    const nome = TITULOS[location.pathname] || 'Loja'
    document.title = nome + ' | ARIDANA'
    window.scrollTo(0, 0)
  }, [location.pathname])

  function mostrarMensagem(texto) {
    setMensagem(texto)
    setTimeout(() => setMensagem(''), 2500)
  }

  function adicionar(produto, qtd = 1, tamanho = 'M', cor = 'Areia Natural') {
    const chave = produto.id + '-' + tamanho + '-' + cor
    const existente = itens.find((i) => i.chave === chave)

    if (existente) {
      setItens(itens.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + qtd } : i)))
    } else {
      setItens([...itens, { chave, produto, qtd, tamanho, cor }])
    }
    mostrarMensagem(produto.nome + ' adicionado à sacola')
  }

  function alterarQtd(chave, delta) {
    setItens(
      itens
        .map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + delta } : i))
        .filter((i) => i.qtd > 0)
    )
  }

  function remover(chave) {
    setItens(itens.filter((i) => i.chave !== chave))
    mostrarMensagem('Item removido da sacola')
  }

  function entrar(novoUsuario) {
    setUsuario(novoUsuario)
    salvarSessao(novoUsuario)
  }

  function sair() {
    encerrarSessao()
    setUsuario(null)
    salvarSessao(null)
    mostrarMensagem('Você saiu da conta')
  }

  function finalizarPedido(novoPedido) {
    setPedido(novoPedido)
    setItens([])
  }

  const quantidade = itens.reduce((soma, i) => soma + i.qtd, 0)
  const subtotal = itens.reduce((soma, i) => soma + i.produto.preco * i.qtd, 0)

  const ehAdmin = location.pathname === '/admin'

  return (
    <div className="min-h-screen flex flex-col" id="app-aridana">
      {!ehAdmin && <Navbar carrinho={quantidade} subtotal={subtotal} usuario={usuario} onSair={sair} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onComprar={adicionar} />} />
          <Route path="/feminino" element={<Categoria chave="feminino" onComprar={adicionar} />} />
          <Route path="/masculino" element={<Categoria chave="masculino" onComprar={adicionar} />} />
          <Route path="/acessorios" element={<Categoria chave="acessorios" onComprar={adicionar} />} />
          <Route path="/busca" element={<Busca onComprar={adicionar} />} />
          <Route
            path="/produto/:id"
            element={<Produto onComprar={adicionar} endereco={endereco} onEndereco={setEndereco} />}
          />
          <Route
            path="/carrinho"
            element={
              <Carrinho
                itens={itens}
                subtotal={subtotal}
                endereco={endereco}
                onEndereco={setEndereco}
                onAlterar={alterarQtd}
                onRemover={remover}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                itens={itens}
                subtotal={subtotal}
                endereco={endereco}
                onEndereco={setEndereco}
                onFinalizar={finalizarPedido}
                onMensagem={mostrarMensagem}
              />
            }
          />
          <Route path="/pedido" element={<Pedido pedido={pedido} />} />
          <Route path="/login" element={<Login usuario={usuario} onEntrar={entrar} onMensagem={mostrarMensagem} />} />
          <Route
            path="/admin"
            element={
              !verificado ? (
                <p className="text-center text-sm text-stone-600 pt-20">Verificando acesso...</p>
              ) : usuario && usuario.tipo === 'admin' ? (
                <Admin onMensagem={mostrarMensagem} onSair={sair} onCatalogoAlterado={atualizarCatalogo} />
              ) : usuario ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" state={{ de: '/admin' }} replace />
              )
            }
          />
          <Route path="*" element={<Home onComprar={adicionar} />} />
        </Routes>
      </main>

      {!ehAdmin && <Footer />}
      <Mensagens message={mensagem} />
    </div>
  )
}

export default App
