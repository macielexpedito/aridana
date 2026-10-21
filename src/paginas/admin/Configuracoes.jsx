import { useState, useEffect } from 'react'
import { chamarApi } from '../../componentes/Contas.js'

function Configuracoes({ onMensagem, tratarErro, onCatalogoAlterado }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    chamarApi('loja')
      .then((cfg) => setForm({ freteGratis: String(cfg.freteGratis), sp: String(cfg.frete.sp), sulSudeste: String(cfg.frete.sulSudeste), demais: String(cfg.frete.demais) }))
      .catch((err) => tratarErro(err, 'Não foi possível carregar as configurações.'))
  }, [])

  const numero = (v) => Number(String(v).replace(',', '.'))

  async function salvar(e) {
    e.preventDefault()
    const valores = [form.freteGratis, form.sp, form.sulSudeste, form.demais].map(numero)
    if (valores.some((v) => !Number.isFinite(v) || v < 0)) return onMensagem('Use apenas números positivos')
    try {
      await chamarApi('admin/config', {
        freteGratis: numero(form.freteGratis),
        frete: { sp: numero(form.sp), sulSudeste: numero(form.sulSudeste), demais: numero(form.demais) },
      }, 'PUT')
      await onCatalogoAlterado()
      onMensagem('Configurações salvas')
    } catch (err) {
      tratarErro(err, 'Não foi possível salvar. Confira os valores.')
    }
  }

  const campo = (nome, rotulo) => (
    <div>
      <label className="campo-rotulo" htmlFor={'cfg-' + nome}>{rotulo}</label>
      <input id={'cfg-' + nome} className="campo" inputMode="decimal" value={form[nome]} onChange={(e) => setForm({ ...form, [nome]: e.target.value })} />
    </div>
  )

  return (
    <div className="p-6" id="secao-configuracoes">
      <p className="text-[10px] uppercase tracking-widest text-pedra">Admin › Configurações da Loja</p>
      <h1 className="font-titulo text-3xl mt-1">Configurações da Loja</h1>
      <p className="text-xs text-stone-600 mt-1">Regras de frete usadas no carrinho, no checkout e no cálculo do pedido.</p>

      {!form ? (
        <p className="text-xs text-stone-600 mt-6">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="caixa-branca p-5 mt-6 max-w-xl flex flex-col gap-4">
          {campo('freteGratis', 'Frete grátis a partir de (R$)')}
          {campo('sp', 'Frete para SP (R$)')}
          {campo('sulSudeste', 'Frete para RJ, MG, ES, PR, SC e RS (R$)')}
          {campo('demais', 'Frete para os demais estados (R$)')}
          <div className="flex justify-end">
            <button type="submit" className="botao-principal !py-3">Salvar configurações</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Configuracoes
