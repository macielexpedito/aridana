import { useState, useEffect } from 'react'
import { chamarApi } from '../../componentes/Contas.js'

function Banners({ produtos, onMensagem, tratarErro, onCatalogoAlterado }) {
  const [banner, setBanner] = useState(null)
  const [destaques, setDestaques] = useState([])

  useEffect(() => {
    chamarApi('loja')
      .then((cfg) => {
        setBanner(cfg.banner)
        setDestaques(cfg.maisVendidos)
      })
      .catch((err) => tratarErro(err, 'Não foi possível carregar a vitrine.'))
  }, [])

  function trocar(posicao, codigo) {
    setDestaques(destaques.map((d, i) => (i === posicao ? codigo : d)))
  }

  async function salvar(e) {
    e.preventDefault()
    if (new Set(destaques).size !== 4) return onMensagem('Escolha 4 peças diferentes para os mais vendidos')
    try {
      await chamarApi('admin/config', { banner, maisVendidos: destaques }, 'PUT')
      await onCatalogoAlterado()
      onMensagem('Banner e vitrine salvos')
    } catch (err) {
      tratarErro(err, 'Não foi possível salvar. Confira os textos e as peças.')
    }
  }

  return (
    <div className="p-6" id="secao-banners">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Banners &amp; Vitrines</p>
      <h1 className="font-titulo text-3xl mt-1">Banners &amp; Vitrines</h1>
      <p className="text-xs text-stone-600 mt-1">Texto do banner da página inicial e as 4 peças da seção &quot;Mais vendidos&quot;.</p>

      {!banner ? (
        <p className="text-xs text-stone-600 mt-6">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="grid lg:grid-cols-2 gap-4 mt-6">
          <div className="caixa-branca p-5 flex flex-col gap-4">
            <h2 className="font-titulo text-2xl">Banner principal</h2>
            <div>
              <label className="campo-rotulo" htmlFor="banner-titulo">Título (uma linha por quebra)</label>
              <textarea id="banner-titulo" rows={3} maxLength={120} className="campo" value={banner.titulo} onChange={(e) => setBanner({ ...banner, titulo: e.target.value })} />
            </div>
            <div>
              <label className="campo-rotulo" htmlFor="banner-sub">Subtítulo</label>
              <input id="banner-sub" maxLength={200} className="campo" value={banner.subtitulo} onChange={(e) => setBanner({ ...banner, subtitulo: e.target.value })} />
            </div>
          </div>

          <div className="caixa-branca p-5 flex flex-col gap-4">
            <h2 className="font-titulo text-2xl">Mais vendidos</h2>
            {destaques.map((codigo, i) => (
              <div key={i}>
                <label className="campo-rotulo" htmlFor={'destaque-' + i}>Posição {i + 1}</label>
                <select id={'destaque-' + i} className="campo" value={codigo} onChange={(e) => trocar(i, e.target.value)}>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}{p.vitrine ? '' : ' (escondida)'}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" className="botao-principal !py-3">Salvar banner e vitrine</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Banners
