import { useState } from 'react'
import { Link } from 'react-router-dom'
import { chamarApi } from '../componentes/Contas.js'

function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (email.trim() === '') return setErro('Informe o seu e-mail.')
    setCarregando(true)
    try {
      await chamarApi('senha/esqueci', { email })
      setEnviado(true)
    } catch (err) {
      if (err.message === 'email_invalido') setErro('Informe um e-mail válido.')
      else if (err.message === 'muitas_tentativas') setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
      else if (err.message === 'sem_servidor') setErro('Servidor indisponível. Inicie o back-end (npm run server) e o MongoDB.')
      else setErro('Erro no servidor. Tente novamente.')
    }
    setCarregando(false)
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-14" id="pagina-esqueci-senha">
      <div className="text-center">
        <h1 className="titulo-pagina">Esqueci a senha</h1>
        <p className="subtitulo-pagina mt-2">Informe o e-mail da sua conta para receber o link de redefinição.</p>
      </div>

      {enviado ? (
        <div className="caixa-branca p-6 mt-8 text-center" id="aviso-link-enviado" role="status">
          <p className="text-sm">
            Se existir uma conta com o e-mail <strong>{email.trim()}</strong>, enviamos um link para criar uma nova senha.
            O link vale por 30 minutos.
          </p>
          <Link to="/login" className="botao-principal inline-block mt-6">Voltar para o login</Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="caixa-branca p-6 mt-8 flex flex-col gap-4" id="form-esqueci-senha">
          <div>
            <label className="campo-rotulo" htmlFor="esqueci-email">E-mail</label>
            <input
              id="esqueci-email"
              type="email"
              className="campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {erro && (
            <p className="text-[12px] text-red-700" id="erro-esqueci-senha" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="botao-principal" disabled={carregando}>
            {carregando ? 'Aguarde...' : 'Enviar link'}
          </button>

          <Link to="/login" className="text-xs underline text-pedra text-center">Voltar para o login</Link>
        </form>
      )}
    </div>
  )
}

export default EsqueciSenha
