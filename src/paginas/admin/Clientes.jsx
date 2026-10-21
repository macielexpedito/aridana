import { useState, useEffect } from 'react'
import { chamarApi, listarClientes } from '../../componentes/Contas.js'

function Clientes({ onMensagem, tratarErro }) {
  const [dados, setDados] = useState(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    listarClientes().then(setDados).catch((err) => tratarErro(err, 'Não foi possível carregar os clientes.'))
  }, [])

  async function remover(c) {
    if (!window.confirm('Remover o cliente ' + c.nome + '? Ele perde o acesso à conta.')) return
    try {
      await chamarApi('admin/clientes/' + c.id, null, 'DELETE')
      setDados({ ...dados, total: dados.total - 1, lista: dados.lista.filter((x) => x.id !== c.id) })
      onMensagem('Cliente removido')
    } catch (err) {
      tratarErro(err, 'Não foi possível remover o cliente.')
    }
  }

  const termo = busca.toLowerCase()
  const lista = dados ? dados.lista.filter((c) => c.nome.toLowerCase().includes(termo) || c.email.includes(termo)) : []

  return (
    <div className="p-6" id="secao-clientes">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Clientes</p>
      <h1 className="font-titulo text-3xl mt-1">Clientes</h1>
      <p className="text-xs text-stone-600 mt-1">{dados ? dados.total + ' clientes cadastrados' : 'Carregando...'}</p>

      <input className="campo max-w-md mt-6" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />

      <div className="caixa-branca mt-4 overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead className="bg-[#f6f3ed] text-[9px] uppercase tracking-widest text-pedra">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">E-mail</th>
              <th className="text-left p-3">Cadastro</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} className="border-t border-stone-100">
                <td className="p-3 font-medium">{c.nome}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="p-3 text-center"><button className="text-red-700 underline" onClick={() => remover(c)}>Remover</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {dados && lista.length === 0 && <p className="p-6 text-center text-pedra">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  )
}

export default Clientes
