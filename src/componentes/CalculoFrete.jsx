import { useState } from 'react'
import { buscarCep, calcularFrete, formatBRL, FRETE_GRATIS_A_PARTIR } from './Produtos.jsx'

function CalculoFrete({ subtotal, endereco, onEndereco, idCampo = 'campo-cep' }) {
  const [cep, setCep] = useState(endereco ? endereco.cep : '')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function calcular() {
    setErro('')
    setCarregando(true)
    try {
      const dados = await buscarCep(cep)
      onEndereco(dados)
    } catch (e) {
      if (e.message === 'cep_invalido') {
        setErro('Não encontramos esse CEP. Verifique os números e tente novamente.')
      } else {
        setErro('O serviço de CEP está indisponível no momento. Tente de novo em instantes.')
      }
    }
    setCarregando(false)
  }

  return (
    <div id="bloco-frete">
      <label htmlFor={idCampo} className="campo-rotulo">Calcular frete e prazo</label>
      <div className="flex gap-2">
        <input
          id={idCampo}
          className="campo"
          placeholder="Insira seu CEP"
          maxLength={9}
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && calcular()}
        />
        <button type="button" onClick={calcular} disabled={carregando} className="botao-areia">
          {carregando ? '...' : 'Calcular'}
        </button>
      </div>

      {erro && <p className="text-[11px] text-red-700 mt-2">{erro}</p>}

      {endereco && !erro && (
        <div className="text-[11px] text-stone-600 mt-2 leading-relaxed">
          <p>
            {endereco.rua ? endereco.rua + ' — ' : ''}
            {endereco.bairro ? endereco.bairro + ', ' : ''}
            {endereco.cidade}/{endereco.uf}
          </p>
          <p className="font-semibold text-carvao">
            Frete: {calcularFrete(endereco.uf, subtotal) === 0 ? 'Grátis' : formatBRL(calcularFrete(endereco.uf, subtotal))}
          </p>
        </div>
      )}

      <p className="text-[10px] text-pedra mt-2">
        Frete grátis acima de {formatBRL(FRETE_GRATIS_A_PARTIR)}
      </p>
    </div>
  )
}

export default CalculoFrete
