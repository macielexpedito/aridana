import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatBRL, calcularFrete, buscarCep } from '../componentes/Produtos.jsx'
import { chamarApi } from '../componentes/Contas.js'

const PAGAMENTOS = [
  { chave: 'pix', rotulo: 'Pix', texto: 'Aprovação imediata, 5% de desconto' },
  { chave: 'cartao', rotulo: 'Cartão de crédito', texto: 'Até 3x sem juros' },
  { chave: 'boleto', rotulo: 'Boleto', texto: 'Vence em 3 dias úteis' },
]

function Checkout({ itens, subtotal, endereco, onEndereco, onFinalizar, onMensagem }) {
  const navegar = useNavigate()

  const [form, setForm] = useState({
    nome: '', email: '', cpf: '', telefone: '',
    cep: endereco ? endereco.cep : '',
    rua: endereco ? endereco.rua : '',
    numero: '',
    bairro: endereco ? endereco.bairro : '',
    cidade: endereco ? endereco.cidade : '',
    uf: endereco ? endereco.uf : '',
  })
  const [pagamento, setPagamento] = useState('pix')
  const [erroCep, setErroCep] = useState('')
  const [enviando, setEnviando] = useState(false)

  const frete = form.uf ? calcularFrete(form.uf, subtotal) : 0
  const desconto = pagamento === 'pix' ? subtotal * 0.05 : 0
  const total = subtotal + frete - desconto

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function aoSairDoCep() {
    setErroCep('')
    if (form.cep.replace(/\D/g, '').length === 0) return
    try {
      const dados = await buscarCep(form.cep)
      setForm((f) => ({ ...f, rua: dados.rua, bairro: dados.bairro, cidade: dados.cidade, uf: dados.uf }))
      onEndereco(dados)
    } catch (e) {
      setErroCep('Não encontramos esse CEP. Verifique os números e tente novamente.')
    }
  }

  async function confirmar(e) {
    e.preventDefault()
    if (enviando) return

    const obrigatorios = ['nome', 'email', 'cpf', 'cep', 'rua', 'numero', 'cidade']
    for (const campo of obrigatorios) {
      if (form[campo].trim() === '') {
        onMensagem('Preencha o campo: ' + campo)
        const el = document.getElementById('campo-' + campo)
        if (el) el.focus()
        return
      }
    }

    setEnviando(true)
    try {
      const salvo = await chamarApi('pedidos', {
        cliente: { nome: form.nome, email: form.email, cpf: form.cpf, telefone: form.telefone },
        endereco: { cep: form.cep, rua: form.rua, numero: form.numero, bairro: form.bairro, cidade: form.cidade, uf: form.uf },
        pagamento,
        itens: itens.map((i) => ({ id: i.produto.id, qtd: i.qtd, tamanho: i.tamanho, cor: i.cor })),
      })
      onFinalizar({
        numero: salvo.numero,
        data: salvo.data,
        cliente: form,
        pagamento,
        itens,
        subtotal: salvo.subtotal,
        frete: salvo.frete,
        desconto: salvo.desconto,
        total: salvo.total,
      })
      navegar('/pedido')
    } catch (err) {
      if (err.message === 'sem_estoque') onMensagem('Uma das peças acabou de esgotar. Revise a sacola.')
      else if (err.message === 'produto_indisponivel') onMensagem('Uma das peças não está mais disponível.')
      else if (err.message === 'sem_servidor') onMensagem('Servidor indisponível. Não foi possível registrar o pedido.')
      else if (err.message === 'muitas_tentativas') onMensagem('Muitos pedidos seguidos. Tente novamente mais tarde.')
      else onMensagem('Não foi possível concluir o pedido. Confira os dados.')
    }
    setEnviando(false)
  }

  if (itens.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 pt-16 text-center" id="checkout-vazio">
        <h1 className="titulo-pagina">Checkout</h1>
        <p className="subtitulo-pagina mt-4">Sua sacola está vazia.</p>
        <Link to="/" className="botao-principal inline-block mt-8">Voltar para a loja</Link>
      </div>
    )
  }

  return (
    <form onSubmit={confirmar} className="max-w-[1216px] mx-auto px-6 pt-12" id="pagina-checkout">
      <div className="text-center">
        <h1 className="titulo-pagina">Finalizar compra</h1>
        <p className="subtitulo-pagina mt-2">Confira os dados e conclua o pedido.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 mt-10">
        <div className="flex flex-col gap-6">
          <section className="caixa-branca p-6" id="bloco-dados">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4">1. Seus dados</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="campo-rotulo" htmlFor="campo-nome">Nome completo</label>
                <input id="campo-nome" name="nome" className="campo" value={form.nome} onChange={mudar} />
              </div>
              <div>
                <label className="campo-rotulo" htmlFor="campo-email">E-mail</label>
                <input id="campo-email" name="email" type="email" className="campo" value={form.email} onChange={mudar} />
              </div>
              <div>
                <label className="campo-rotulo" htmlFor="campo-cpf">CPF</label>
                <input id="campo-cpf" name="cpf" className="campo" value={form.cpf} onChange={mudar} />
              </div>
              <div>
                <label className="campo-rotulo" htmlFor="campo-telefone">Telefone</label>
                <input id="campo-telefone" name="telefone" className="campo" value={form.telefone} onChange={mudar} />
              </div>
            </div>
          </section>

          <section className="caixa-branca p-6" id="bloco-entrega">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4">2. Endereço de entrega</h2>
            <div className="grid sm:grid-cols-6 gap-4">
              <div className="sm:col-span-2">
                <label className="campo-rotulo" htmlFor="campo-cep">CEP</label>
                <input id="campo-cep" name="cep" className="campo" value={form.cep} onChange={mudar} onBlur={aoSairDoCep} maxLength={9} />
              </div>
              <div className="sm:col-span-4">
                <label className="campo-rotulo" htmlFor="campo-rua">Rua</label>
                <input id="campo-rua" name="rua" className="campo" value={form.rua} onChange={mudar} />
              </div>
              <div className="sm:col-span-2">
                <label className="campo-rotulo" htmlFor="campo-numero">Número</label>
                <input id="campo-numero" name="numero" className="campo" value={form.numero} onChange={mudar} />
              </div>
              <div className="sm:col-span-4">
                <label className="campo-rotulo" htmlFor="campo-bairro">Bairro</label>
                <input id="campo-bairro" name="bairro" className="campo" value={form.bairro} onChange={mudar} />
              </div>
              <div className="sm:col-span-4">
                <label className="campo-rotulo" htmlFor="campo-cidade">Cidade</label>
                <input id="campo-cidade" name="cidade" className="campo" value={form.cidade} onChange={mudar} />
              </div>
              <div className="sm:col-span-2">
                <label className="campo-rotulo" htmlFor="campo-uf">UF</label>
                <input id="campo-uf" name="uf" className="campo" value={form.uf} onChange={mudar} maxLength={2} />
              </div>
            </div>
            {erroCep && <p className="text-[11px] text-red-700 mt-3">{erroCep}</p>}
          </section>

          <section className="caixa-branca p-6" id="bloco-pagamento">
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4">3. Pagamento</h2>
            <div className="flex flex-col gap-3">
              {PAGAMENTOS.map((p) => (
                <label
                  key={p.chave}
                  className={'flex items-center gap-3 border p-4 cursor-pointer ' + (pagamento === p.chave ? 'border-carvao bg-creme' : 'border-stone-200')}
                >
                  <input type="radio" name="pagamento" checked={pagamento === p.chave} onChange={() => setPagamento(p.chave)} />
                  <span>
                    <span className="block text-sm font-medium">{p.rotulo}</span>
                    <span className="block text-[11px] text-pedra">{p.texto}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-pedra mt-4">
              Pagamento processado pelo Mercado Pago em ambiente de testes (sandbox).
            </p>
          </section>
        </div>

        <aside className="caixa-branca p-6 h-fit lg:sticky lg:top-32" id="resumo-checkout">
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4">Resumo do pedido</h2>

          {itens.map((item) => (
            <div key={item.chave} className="flex justify-between gap-3 text-xs py-2 border-b border-stone-100">
              <span>
                {item.qtd}× {item.produto.nome}
                <span className="block text-pedra">Tam. {item.tamanho}</span>
              </span>
              <span>{formatBRL(item.produto.preco * item.qtd)}</span>
            </div>
          ))}

          <div className="text-sm mt-4 flex flex-col gap-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{frete === 0 ? (form.uf ? 'Grátis' : 'a calcular') : formatBRL(frete)}</span></div>
            {desconto > 0 && (
              <div className="flex justify-between text-green-800"><span>Desconto Pix (5%)</span><span>− {formatBRL(desconto)}</span></div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-stone-200 pt-3 mt-1">
              <span>Total</span><span id="total-checkout">{formatBRL(total)}</span>
            </div>
          </div>

          <button type="submit" className="botao-principal w-full mt-6" disabled={enviando}>{enviando ? 'Enviando...' : 'Confirmar pedido'}</button>
        </aside>
      </div>
    </form>
  )
}

export default Checkout
