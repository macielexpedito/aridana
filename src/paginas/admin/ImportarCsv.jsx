import { useState } from 'react'
import { chamarApi } from '../../componentes/Contas.js'
import { COLUNAS, MODELO_CSV, planilhaParaProdutos, textoDoArquivo } from '../../componentes/Csv.js'

function ImportarCsv({ onFechar, onConcluido, onMensagem, tratarErro }) {
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [planilha, setPlanilha] = useState(null)
  const [atualizar, setAtualizar] = useState(false)
  const [relatorio, setRelatorio] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  async function escolher(e) {
    const arquivo = e.target.files[0]
    setRelatorio(null)
    setPlanilha(null)
    if (!arquivo) return
    if (arquivo.size > 1024 * 1024) return onMensagem('Arquivo maior que 1 MB')
    setNomeArquivo(arquivo.name)
    setPlanilha(planilhaParaProdutos(await textoDoArquivo(arquivo)))
  }

  function baixarModelo() {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['﻿' + MODELO_CSV], { type: 'text/csv;charset=utf-8' }))
    link.download = 'modelo-produtos-aridana.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function enviar(simular) {
    setOcupado(true)
    try {
      const r = await chamarApi('admin/produtos/importar', { linhas: planilha.linhas, atualizar, simular })
      setRelatorio(r)
      if (!simular) {
        onMensagem(r.criados + ' criados, ' + r.atualizados + ' atualizados' + (r.erros.length ? ', ' + r.erros.length + ' com erro' : ''))
        onConcluido()
      }
    } catch (err) {
      if (err.message === 'linhas_invalidas') onMensagem('A planilha precisa ter de 1 a 500 linhas de produtos')
      else if (err.message === 'arquivo_grande') onMensagem('Arquivo grande demais')
      else tratarErro(err, 'Não foi possível processar a planilha.')
    }
    setOcupado(false)
  }

  const pronta = planilha && planilha.faltando.length === 0 && planilha.linhas.length > 0

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" id="painel-importar">
      <div className="w-full max-w-2xl bg-[#f6f3ed] h-full overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h2 className="font-titulo text-2xl leading-tight">Importar produtos (CSV)</h2>
          <button type="button" onClick={onFechar} className="text-xl" aria-label="Fechar">×</button>
        </div>

        <p className="text-xs text-stone-600">
          Salve a planilha como CSV (separado por ponto e vírgula ou vírgula). Colunas obrigatórias:{' '}
          <strong>{COLUNAS.filter((c) => c.obrigatoria).map((c) => c.campo).join(', ')}</strong>. Opcionais:{' '}
          {COLUNAS.filter((c) => !c.obrigatoria).map((c) => c.campo).join(', ')}. Categoria: feminino, masculino ou acessorios.
          Imagens devem estar na loja (ex.: <code>/img/blusa.jpg</code>) ou ser enviadas depois pela edição do produto.
        </p>
        <button type="button" className="text-xs underline w-fit" onClick={baixarModelo}>Baixar modelo CSV</button>

        <div>
          <label className="campo-rotulo" htmlFor="arquivo-csv">Arquivo CSV</label>
          <input id="arquivo-csv" type="file" accept=".csv,text/csv" className="campo" onChange={escolher} />
        </div>

        {planilha && (
          <div className="caixa-branca p-4 text-xs">
            <p className="font-semibold">{nomeArquivo}: {planilha.linhas.length} linhas de produtos lidas</p>
            {planilha.faltando.length > 0 && (
              <p className="text-red-700 mt-2">Faltam colunas obrigatórias: {planilha.faltando.join(', ')}. Confira o cabeçalho da planilha.</p>
            )}
            {planilha.ignoradas.length > 0 && (
              <p className="text-pedra mt-2">Colunas ignoradas: {planilha.ignoradas.join(', ')}</p>
            )}
            {pronta && (
              <div className="overflow-x-auto mt-3">
                <table className="w-full min-w-[480px]">
                  <thead className="text-[9px] uppercase tracking-widest text-pedra">
                    <tr><th className="text-left py-1">SKU</th><th className="text-left">Nome</th><th className="text-left">Categoria</th><th className="text-left">Preço</th><th className="text-left">Estoque</th></tr>
                  </thead>
                  <tbody>
                    {planilha.linhas.slice(0, 8).map((l, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        <td className="py-1">{l.ref}</td><td>{l.nome}</td><td>{l.categoria}</td><td>{l.preco}</td><td>{l.estoque}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {planilha.linhas.length > 8 && <p className="text-pedra mt-1">... e mais {planilha.linhas.length - 8} linhas</p>}
              </div>
            )}
          </div>
        )}

        {pronta && (
          <>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={atualizar} onChange={(e) => setAtualizar(e.target.checked)} />
              Atualizar produtos que já existem (mesmo SKU). Campos opcionais em branco não são alterados.
            </label>
            <div className="flex gap-3">
              <button type="button" className="botao-contorno !py-3" disabled={ocupado} onClick={() => enviar(true)}>Verificar sem gravar</button>
              <button type="button" className="botao-principal !py-3" disabled={ocupado} onClick={() => enviar(false)}>
                {ocupado ? 'Aguarde...' : 'Importar'}
              </button>
            </div>
          </>
        )}

        {relatorio && (
          <div className="caixa-branca p-4 text-xs" role="status">
            <p className="font-semibold">
              {relatorio.simulado ? 'Verificação (nada foi gravado): ' : 'Importação concluída: '}
              {relatorio.criados} {relatorio.simulado ? 'a criar' : 'criados'}, {relatorio.atualizados} {relatorio.simulado ? 'a atualizar' : 'atualizados'}, {relatorio.erros.length} com erro
            </p>
            {relatorio.erros.length > 0 && (
              <>
                <p className="text-pedra mt-2">Linhas com erro não são importadas (a linha 1 é o cabeçalho):</p>
                <ul className="mt-1 space-y-1 text-red-700">
                  {relatorio.erros.map((e, i) => <li key={i}>Linha {e.linha}: {e.mensagem}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportarCsv
