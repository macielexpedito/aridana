import { useState } from 'react'
import { chamarApi, listarProdutosAdmin } from '../../componentes/Contas.js'
import { formatBRL } from '../../componentes/Produtos.jsx'

const COLECOES = [
  { chave: 'feminino', titulo: 'Coleção Feminino' },
  { chave: 'masculino', titulo: 'Coleção Masculino' },
  { chave: 'acessorios', titulo: 'Coleção Acessórios' },
]

function Colecoes({ produtos, setProdutos, onMensagem, tratarErro, onCatalogoAlterado }) {
  const [percentuais, setPercentuais] = useState({ feminino: '', masculino: '', acessorios: '' })

  async function recarregar() {
    setProdutos(await listarProdutosAdmin())
    onCatalogoAlterado()
  }

  async function mudarVitrine(chave, vitrine) {
    try {
      await chamarApi('admin/colecoes/' + chave + '/vitrine', { vitrine })
      await recarregar()
      onMensagem(vitrine ? 'Coleção publicada na loja' : 'Coleção escondida da loja')
    } catch (err) {
      tratarErro(err, 'Não foi possível alterar a coleção.')
    }
  }

  async function ajustarPreco(chave) {
    const valor = Number(String(percentuais[chave]).replace(',', '.'))
    if (!Number.isFinite(valor) || valor === 0) return onMensagem('Informe um percentual diferente de zero')
    if (!window.confirm('Aplicar ' + valor + '% em TODOS os preços desta coleção?')) return
    try {
      await chamarApi('admin/colecoes/' + chave + '/preco', { percentual: valor })
      setPercentuais({ ...percentuais, [chave]: '' })
      await recarregar()
      onMensagem('Preços da coleção atualizados')
    } catch (err) {
      tratarErro(err, 'Percentual inválido ou fora do limite (de -90% a 200%).')
    }
  }

  return (
    <div className="p-6" id="secao-colecoes">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Gestão de Coleções</p>
      <h1 className="font-titulo text-3xl mt-1">Gestão de Coleções</h1>
      <p className="text-xs text-stone-600 mt-1">Publique ou esconda uma coleção inteira e ajuste os preços em lote.</p>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        {COLECOES.map((c) => {
          const itens = produtos.filter((p) => p.categoria === c.chave)
          const naVitrine = itens.filter((p) => p.vitrine).length
          const estoque = itens.reduce((soma, p) => soma + p.estoque, 0)
          const media = itens.length ? itens.reduce((soma, p) => soma + p.preco, 0) / itens.length : 0
          return (
            <div key={c.chave} className="caixa-branca p-5 flex flex-col gap-3">
              <h2 className="font-titulo text-2xl">{c.titulo}</h2>
              <ul className="text-xs text-stone-600 space-y-1">
                <li>{itens.length} peças · {naVitrine} na vitrine</li>
                <li>{estoque} unidades em estoque</li>
                <li>Preço médio {formatBRL(media)}</li>
              </ul>
              <div className="flex gap-2">
                <button type="button" className="botao-principal !py-2" onClick={() => mudarVitrine(c.chave, true)}>Publicar tudo</button>
                <button type="button" className="botao-contorno !py-2" onClick={() => mudarVitrine(c.chave, false)}>Esconder tudo</button>
              </div>
              <div className="mt-2">
                <label className="campo-rotulo" htmlFor={'perc-' + c.chave}>Ajuste de preço em lote (%)</label>
                <div className="flex gap-2">
                  <input
                    id={'perc-' + c.chave}
                    className="campo"
                    placeholder="ex.: 10 ou -5"
                    value={percentuais[c.chave]}
                    onChange={(e) => setPercentuais({ ...percentuais, [c.chave]: e.target.value })}
                  />
                  <button type="button" className="botao-contorno !py-2" onClick={() => ajustarPreco(c.chave)}>Aplicar</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Colecoes
