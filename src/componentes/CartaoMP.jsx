import { useEffect, useRef, useState } from 'react'

const CHAVE_BRUTA = import.meta.env.VITE_MP_PUBLIC_KEY || ''
export const MP_CHAVE_PUBLICA = /^COLE-AQUI/.test(CHAVE_BRUTA) ? '' : CHAVE_BRUTA

function CartaoMP({ valor, cpf, apiRef }) {
  const [erro, setErro] = useState('')
  const [parcelas, setParcelas] = useState([])
  const [parcela, setParcela] = useState('1')
  const nomeRef = useRef(null)
  const vivo = useRef({ mp: null, bin: '', metodo: '', cpf, parcela, valor })
  vivo.current.cpf = cpf
  vivo.current.parcela = parcela
  vivo.current.valor = valor

  async function carregarParcelas(bin) {
    try {
      const v = vivo.current
      const lista = await v.mp.getInstallments({ amount: Number(v.valor).toFixed(2), bin, paymentTypeId: 'credit_card' })
      const opcoes = lista && lista[0] ? lista[0].payer_costs : []
      setParcelas(opcoes)
      setParcela(opcoes.length ? String(opcoes[0].installments) : '1')
    } catch (e) {
      setParcelas([])
    }
  }

  useEffect(() => {
    if (!MP_CHAVE_PUBLICA) {
      setErro('Chave pública do Mercado Pago não configurada (VITE_MP_PUBLIC_KEY).')
      return
    }
    if (!window.MercadoPago) {
      setErro('Não foi possível carregar o Mercado Pago. Verifique a conexão e recarregue a página.')
      return
    }
    const v = vivo.current
    v.mp = new window.MercadoPago(MP_CHAVE_PUBLICA, { locale: 'pt-BR' })
    const numero = v.mp.fields.create('cardNumber', { placeholder: 'Número do cartão' }).mount('mp-numero-cartao')
    const validade = v.mp.fields.create('expirationDate', { placeholder: 'MM/AA' }).mount('mp-validade')
    const codigo = v.mp.fields.create('securityCode', { placeholder: 'CVV' }).mount('mp-codigo')

    numero.on('binChange', async ({ bin }) => {
      try {
        if (!bin) {
          v.bin = ''
          v.metodo = ''
          setParcelas([])
          return
        }
        if (bin === v.bin) return
        v.bin = bin
        const { results } = await v.mp.getPaymentMethods({ bin })
        const metodo = results && results[0]
        if (!metodo) return
        v.metodo = metodo.id
        if (metodo.settings && metodo.settings[0]) {
          numero.update({ settings: metodo.settings[0].card_number })
          codigo.update({ settings: metodo.settings[0].security_code })
        }
        await carregarParcelas(bin)
      } catch (e) {
        setParcelas([])
      }
    })

    apiRef.current = {
      async gerar() {
        const nome = nomeRef.current ? nomeRef.current.value.trim() : ''
        if (!nome) throw new Error('nome_titular')
        if (!v.metodo) throw new Error('cartao_incompleto')
        const t = await v.mp.fields.createCardToken({
          cardholderName: nome,
          identificationType: 'CPF',
          identificationNumber: String(v.cpf).replace(/\D/g, ''),
        })
        return { token: t.id, paymentMethodId: v.metodo, installments: Number(v.parcela) }
      },
    }

    return () => {
      apiRef.current = null
      for (const el of [numero, validade, codigo]) {
        try {
          el.unmount()
        } catch (e) {}
      }
    }
  }, [])

  useEffect(() => {
    if (vivo.current.mp && vivo.current.bin) carregarParcelas(vivo.current.bin)
  }, [valor])

  const caixa = 'border border-stone-300 bg-white px-3'

  return (
    <div className="mt-4 flex flex-col gap-3" id="bloco-cartao">
      {erro && <p className="text-[12px] text-red-700" role="alert">{erro}</p>}
      <div>
        <label className="campo-rotulo">Número do cartão</label>
        <div id="mp-numero-cartao" className={caixa} style={{ height: 44 }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="campo-rotulo">Validade</label>
          <div id="mp-validade" className={caixa} style={{ height: 44 }} />
        </div>
        <div>
          <label className="campo-rotulo">Código de segurança</label>
          <div id="mp-codigo" className={caixa} style={{ height: 44 }} />
        </div>
      </div>
      <div>
        <label className="campo-rotulo" htmlFor="mp-titular">Nome do titular, como no cartão</label>
        <input id="mp-titular" ref={nomeRef} className="campo" autoComplete="cc-name" />
      </div>
      <div>
        <label className="campo-rotulo" htmlFor="mp-parcelas">Parcelas</label>
        <select id="mp-parcelas" className="campo" value={parcela} onChange={(e) => setParcela(e.target.value)}>
          {parcelas.length === 0 && <option value="1">1x</option>}
          {parcelas.map((p) => (
            <option key={p.installments} value={p.installments}>{p.recommended_message}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default CartaoMP
