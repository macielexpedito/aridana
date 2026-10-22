import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatBRL, categoria as categorias } from '../componentes/Produtos.jsx'
import PainelGeral from './admin/PainelGeral.jsx'
import Colecoes from './admin/Colecoes.jsx'
import Pedidos from './admin/Pedidos.jsx'
import Banners from './admin/Banners.jsx'
import Clientes from './admin/Clientes.jsx'
import Configuracoes from './admin/Configuracoes.jsx'
import ImportarCsv from './admin/ImportarCsv.jsx'
import { listarClientes, listarProdutosAdmin, editarProduto, removerProduto, criarProduto, enviarImagem } from '../componentes/Contas.js'
import { exportarExcel } from './admin/exportarExcel.js'

const ABAS = [
  { chave: 'todas', rotulo: 'Todas as Peças' },
  { chave: 'feminino', rotulo: 'Coleção Feminino' },
  { chave: 'masculino', rotulo: 'Coleção Masculino' },
  { chave: 'acessorios', rotulo: 'Coleção Acessórios' },
]
const MENU = ['Painel Geral', 'Catálogo de Produtos', 'Gestão de Coleções', 'Pedidos & Vendas', 'Banners & Vitrines', 'Clientes', 'Configurações da Loja']
const POR_PAGINA = 5

function Admin({ onMensagem, onSair, onCatalogoAlterado }) {
  const [lista, setLista] = useState([])
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [secao, setSecao] = useState('Catálogo de Produtos')
  const [aba, setAba] = useState('todas')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState(null)
  const [importando, setImportando] = useState(false)
    const [exportando, setExportando] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [clientes, setClientes] = useState(null)
  const [erroClientes, setErroClientes] = useState('')

  function tratarErro(err, texto) {
    if (err.message === 'nao_autenticado' || err.message === 'acesso_negado') onSair()
    else onMensagem(texto)
  }

    async function exportar() {
    setExportando(true)
    try {
      await exportarExcel()
      onMensagem('Planilha exportada')
    } catch (err) {
      tratarErro(err, 'Não foi possível exportar a planilha.')
    } finally {
      setExportando(false)
    }
  }

  useEffect(() => {
    listarProdutosAdmin()
      .then(setLista)
      .catch((err) => tratarErro(err, 'Não foi possível carregar os produtos.'))
      .finally(() => setCarregandoLista(false))
  }, [])

  useEffect(() => {
    listarClientes()
      .then(setClientes)
      .catch((err) => {
        if (err.message === 'nao_autenticado' || err.message === 'acesso_negado') onSair()
        else setErroClientes('Não foi possível carregar os clientes.')
      })
  }, [])

  const filtrados = lista.filter(
    (p) =>
      (aba === 'todas' || p.categoria === aba) &&
      (p.nome.toLowerCase().includes(busca.toLowerCase()) || p.ref.toLowerCase().includes(busca.toLowerCase()))
  )
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const visiveis = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const estoqueBaixo = lista.filter((p) => p.estoque < 10).length
  const ticketMedio = lista.length ? lista.reduce((soma, p) => soma + p.preco, 0) / lista.length : 0

  async function recarregarProdutos() {
    try {
      setLista(await listarProdutosAdmin())
      onCatalogoAlterado()
    } catch (err) {
      tratarErro(err, 'Não foi possível atualizar os produtos.')
    }
  }

  function aplicar(salvo) {
    setLista(lista.map((p) => (p.id === salvo.id ? salvo : p)))
    onCatalogoAlterado()
  }

  async function alternarVitrine(id) {
    const atual = lista.find((p) => p.id === id)
    try {
      aplicar(await editarProduto(id, { vitrine: !atual.vitrine }))
    } catch (err) {
      tratarErro(err, 'Não foi possível alterar a vitrine.')
    }
  }

  async function excluir(id) {
    if (!window.confirm('Remover esta peça do catálogo?')) return
    try {
      await removerProduto(id)
      setLista(lista.filter((p) => p.id !== id))
      onCatalogoAlterado()
      onMensagem('Peça removida do catálogo')
    } catch (err) {
      tratarErro(err, 'Não foi possível remover a peça.')
    }
  }

  function novoProduto() {
    setEditando({ novo: true, nome: '', ref: '', categoria: 'feminino', sub: '', preco: 0, estoque: 0, desc: '', etiqueta: '', img: '' })
  }

  function subcategorias(chave) {
    return categorias[chave].filtros.filter((f) => f.chave !== 'todos')
  }

  async function escolherImagem(e) {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) return onMensagem('Use uma imagem JPG, PNG ou WEBP')
    if (arquivo.size > 2 * 1024 * 1024) return onMensagem('A imagem deve ter até 2 MB')
    setEnviandoImagem(true)
    try {
      const caminho = await enviarImagem(arquivo)
      setEditando((atual) => ({ ...atual, img: caminho }))
    } catch (err) {
      tratarErro(err, 'Não foi possível enviar a imagem.')
    }
    setEnviandoImagem(false)
  }

  async function salvarEdicao(e) {
    e.preventDefault()
    try {
      if (editando.novo) {
        const criado = await criarProduto({
          nome: editando.nome, ref: editando.ref, categoria: editando.categoria, sub: editando.sub,
          preco: editando.preco, estoque: editando.estoque, desc: editando.desc, etiqueta: editando.etiqueta, img: editando.img,
        })
        setLista([...lista, criado])
        onCatalogoAlterado()
        setEditando(null)
        onMensagem('Produto criado')
        return
      }
      const salvo = await editarProduto(editando.id, {
        nome: editando.nome,
        ref: editando.ref,
        preco: editando.preco,
        estoque: editando.estoque,
        etiqueta: editando.etiqueta,
        sub: editando.sub || '',
        desc: editando.desc || '',
        img: editando.img || '',
      })
      aplicar(salvo)
      setEditando(null)
      onMensagem('Alterações salvas')
    } catch (err) {
      if (err.message === 'ref_em_uso') onMensagem('Já existe um produto com esse SKU')
      else tratarErro(err, 'Não foi possível salvar: confira os dados.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf8f0] flex" id="pagina-admin">
      <aside className="hidden md:flex flex-col w-[230px] bg-[#f6f3ed] border-r border-stone-200 p-5 gap-1 shrink-0" id="menu-admin">
        <span className="text-[10px] bg-white border border-stone-300 px-2 py-1 w-fit mb-6">CMS</span>
        <p className="text-[9px] uppercase tracking-widest text-pedra mb-2">Menu principal</p>
        {MENU.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSecao(m)}
            aria-current={m === secao ? 'page' : undefined}
            className={'text-left text-xs py-2 px-2 ' + (m === secao ? 'bg-white font-semibold' : 'text-stone-600 hover:bg-white')}
          >
            {m}
          </button>
        ))}
        <p className="mt-auto text-[10px] text-pedra">● Operacional v2.4</p>
      </aside>  

      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-4 bg-white border-b border-stone-200 px-6 py-3">
          <select className="campo md:hidden max-w-[11rem]" value={secao} onChange={(e) => setSecao(e.target.value)} aria-label="Menu do painel">
            {MENU.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {secao === 'Catálogo de Produtos' ? (
            <input className="campo max-w-md" placeholder="Buscar produtos, SKUs, coleções..." value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} />
          ) : (
            <span className="hidden md:block text-xs text-pedra">{secao}</span>
          )}
          <div className="flex items-center gap-4">
            <button type="button" onClick={exportar} disabled={exportando} className="botao-contorno !py-2" id="botao-exportar-excel">
              {exportando ? 'Gerando...' : 'Exportar Excel'}
            </button>
            <Link to="/" className="botao-contorno !py-2">Ver loja online ↗</Link>
            <button type="button" onClick={onSair} className="text-xs underline" id="botao-sair-admin">Sair</button>
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-medium">Helena Vasconcelos</p>
              <p className="text-[9px] uppercase tracking-wider text-pedra">Diretora de e-commerce</p>
            </div>
          </div>
        </header>

        {secao === 'Catálogo de Produtos' && (
        <div className="p-6">
          <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Catálogo de Produtos</p>
          <div className="flex flex-wrap justify-between items-end gap-3 mt-1">
            <div>
              <h1 className="font-titulo text-3xl">Gestão do Catálogo &amp; Coleções</h1>
              <p className="text-xs text-stone-600 mt-1">Gerencie produtos, ajuste de preços em lote, coleções ativas e visibilidade na loja.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="botao-contorno !py-3" onClick={() => setImportando(true)}>Importar CSV</button>
              <button type="button" className="botao-principal !py-3" onClick={novoProduto}>+ Novo produto</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6" id="indicadores">
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Total de produtos ativos</p>
              <p className="font-titulo text-3xl mt-2">{lista.filter((p) => p.vitrine).length}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Coleções no ar</p>
              <p className="font-titulo text-3xl mt-2">3</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-red-700">Estoque baixo</p>
              <p className="font-titulo text-3xl mt-2">{estoqueBaixo}</p>
            </div>
            <div className="caixa-branca p-4">
              <p className="text-[9px] uppercase tracking-widest text-pedra">Ticket médio</p>
              <p className="font-titulo text-3xl mt-2">{formatBRL(ticketMedio)}</p>
            </div>
          </div>

          <div className="caixa-branca p-4 mt-4" id="clientes-cadastrados">
            <p className="text-[9px] uppercase tracking-widest text-pedra">Clientes cadastrados (dados do servidor)</p>
            {erroClientes && <p className="text-xs text-red-700 mt-2">{erroClientes}</p>}
            {!clientes && !erroClientes && <p className="text-xs text-stone-600 mt-2">Carregando...</p>}
            {clientes && (
              <>
                <p className="font-titulo text-3xl mt-2">{clientes.total}</p>
                <ul className="text-xs text-stone-600 mt-2 space-y-1">
                  {clientes.recentes.slice(0, 5).map((c) => (
                    <li key={c.email}>{c.nome} · {c.email}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {ABAS.map((a) => (
              <button
                key={a.chave}
                onClick={() => { setAba(a.chave); setPagina(1) }}
                className={'filtro-pilula ' + (aba === a.chave ? 'filtro-pilula-ativo' : '')}
              >
                {a.rotulo}
              </button>
            ))}
          </div>

          <div className="caixa-branca mt-4 overflow-x-auto" id="tabela-produtos">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-[#f6f3ed] text-[9px] uppercase tracking-widest text-pedra">
                <tr>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Coleção</th>
                  <th className="text-left p-3">Preço</th>
                  <th className="text-left p-3">Estoque</th>
                  <th className="p-3">Vitrine</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-11 bg-[#e8e2d8] overflow-hidden shrink-0">
                          {p.img && <img src={p.img} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.nome}</p>
                          <p className="text-[9px] text-pedra">REF: {p.ref}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{p.categoria}</td>
                    <td className="p-3 font-semibold">{formatBRL(p.preco)}</td>
                    <td className={'p-3 ' + (p.estoque < 10 ? 'text-red-700' : '')}>
                      {p.estoque} un. {p.estoque < 10 ? '• Estoque baixo' : '• Em estoque'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => alternarVitrine(p.id)}
                        aria-label="Alternar vitrine"
                        className={'w-10 h-5 rounded-full relative transition-colors ' + (p.vitrine ? 'bg-carvao' : 'bg-stone-300')}
                      >
                        <span className={'absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all ' + (p.vitrine ? 'left-[22px]' : 'left-[2px]')} />
                      </button>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button className="underline mr-3" onClick={() => setEditando({ ...p })}>Editar</button>
                      <button className="text-red-700 underline" onClick={() => excluir(p.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {carregandoLista && <p className="p-6 text-center text-pedra">Carregando produtos...</p>}
            {!carregandoLista && visiveis.length === 0 && <p className="p-6 text-center text-pedra">Nenhuma peça encontrada.</p>}
          </div>

          <div className="flex justify-between items-center text-[11px] text-pedra mt-3">
            <span>Exibindo {visiveis.length} de {filtrados.length} produtos</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPagina(i + 1)}
                  className={'w-7 h-7 border ' + (pagina === i + 1 ? 'bg-carvao text-white border-carvao' : 'border-stone-300')}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {secao === 'Painel Geral' && <PainelGeral produtos={lista} tratarErro={tratarErro} />}
        {secao === 'Gestão de Coleções' && <Colecoes produtos={lista} setProdutos={setLista} onMensagem={onMensagem} tratarErro={tratarErro} onCatalogoAlterado={onCatalogoAlterado} />}
        {secao === 'Pedidos & Vendas' && <Pedidos onMensagem={onMensagem} tratarErro={tratarErro} onProdutosAlterados={recarregarProdutos} />}
        {secao === 'Banners & Vitrines' && <Banners produtos={lista} onMensagem={onMensagem} tratarErro={tratarErro} onCatalogoAlterado={onCatalogoAlterado} />}
        {secao === 'Clientes' && <Clientes onMensagem={onMensagem} tratarErro={tratarErro} />}
        {secao === 'Configurações da Loja' && <Configuracoes onMensagem={onMensagem} tratarErro={tratarErro} onCatalogoAlterado={onCatalogoAlterado} />}
      </main>

      {importando && (
        <ImportarCsv
          onFechar={() => setImportando(false)}
          onConcluido={recarregarProdutos}
          onMensagem={onMensagem}
          tratarErro={tratarErro}
        />
      )}

      {editando && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" id="painel-edicao">
          <form onSubmit={salvarEdicao} className="w-full max-w-md bg-[#f6f3ed] h-full overflow-y-auto p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h2 className="font-titulo text-2xl leading-tight">{editando.novo ? 'Novo Produto' : 'Edição Rápida de Produto'}</h2>
              <button type="button" onClick={() => setEditando(null)} className="text-xl" aria-label="Fechar">×</button>
            </div>

            <div>
              <label className="campo-rotulo" htmlFor="edicao-nome">Nome da peça</label>
              <input id="edicao-nome" className="campo" value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
            </div>
            {editando.novo && (
              <div>
                <label className="campo-rotulo" htmlFor="edicao-categoria">Coleção</label>
                <select id="edicao-categoria" className="campo" value={editando.categoria} onChange={(e) => setEditando({ ...editando, categoria: e.target.value, sub: '' })}>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>
            )}
            <div>
              <label className="campo-rotulo" htmlFor="edicao-sub">Subcategoria</label>
              <select id="edicao-sub" className="campo" value={editando.sub || ''} onChange={(e) => setEditando({ ...editando, sub: e.target.value })}>
                <option value="">Sem subcategoria</option>
                {subcategorias(editando.categoria).map((f) => <option key={f.chave} value={f.chave}>{f.rotulo}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-rotulo" htmlFor="edicao-ref">Código SKU</label>
              <input id="edicao-ref" className="campo" value={editando.ref} onChange={(e) => setEditando({ ...editando, ref: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="campo-rotulo" htmlFor="edicao-preco">Preço de venda</label>
                <input id="edicao-preco" type="number" step="0.01" className="campo" value={editando.preco} onChange={(e) => setEditando({ ...editando, preco: Number(e.target.value) })} />
              </div>
              <div>
                <label className="campo-rotulo" htmlFor="edicao-estoque">Estoque</label>
                <input id="edicao-estoque" type="number" className="campo" value={editando.estoque} onChange={(e) => setEditando({ ...editando, estoque: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="campo-rotulo" htmlFor="edicao-desc">Descrição</label>
              <textarea id="edicao-desc" rows={3} maxLength={1000} className="campo" value={editando.desc || ''} onChange={(e) => setEditando({ ...editando, desc: e.target.value })} />
            </div>
            <div>
              <label className="campo-rotulo" htmlFor="edicao-imagem">Imagem (JPG, PNG ou WEBP, até 2 MB)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-20 bg-[#e8e2d8] overflow-hidden shrink-0">
                  {editando.img && <img src={editando.img} alt="" className="w-full h-full object-cover" />}
                </div>
                <input id="edicao-imagem" type="file" accept="image/jpeg,image/png,image/webp" className="text-xs" onChange={escolherImagem} disabled={enviandoImagem} />
              </div>
              {enviandoImagem && <p className="text-[11px] text-pedra mt-1">Enviando imagem...</p>}
            </div>
            <label className="flex items-center justify-between bg-white border border-stone-200 p-3 text-xs">
              Destaque na página inicial
              <input type="checkbox" checked={editando.etiqueta === 'destaque'} onChange={(e) => setEditando({ ...editando, etiqueta: e.target.checked ? 'destaque' : '' })} />
            </label>

            <div className="flex gap-3 justify-end mt-auto pt-4">
              <button type="button" className="text-xs underline" onClick={() => setEditando(null)}>Descartar</button>
              <button type="submit" className="botao-principal !py-3" disabled={enviandoImagem}>{editando.novo ? 'Criar produto' : 'Salvar alterações'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Admin
