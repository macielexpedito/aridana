import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { chamarApi } from '../componentes/Contas.js'

function RedefinirSenha({ onMensagem }) {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [linkInvalido, setLinkInvalido] = useState(token === '')
  const [carregando, setCarregando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não são iguais.')
    setCarregando(true)
    try {
      await chamarApi('senha/redefinir', { token, senha })
      onMensagem('Senha alterada! Entre com a nova senha.')
      navegar('/login', { replace: true })
      return
    } catch (err) {
      if (err.message === 'token_invalido') setLinkInvalido(true)
      else if (err.message === 'senha_curta' || err.message === 'senha_longa') setErro('A senha deve ter de 8 a 72 caracteres.')
      else if (err.message === 'muitas_tentativas') setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
      else if (err.message === 'sem_servidor') setErro('Servidor indisponível. Inicie o back-end (npm run server) e o MongoDB.')
      else setErro('Erro no servidor. Tente novamente.')
    }
    setCarregando(false)
  }

  if (linkInvalido) {
    return (
      <div className="max-w-md mx-auto px-6 pt-14 text-center" id="pagina-link-invalido">
        <h1 className="titulo-pagina">Link inválido ou expirado</h1>
        <p className="subtitulo-pagina mt-2">Esse link não vale mais. Peça um novo para criar a sua senha.</p>
        <Link to="/esqueci-senha" className="botao-principal inline-block mt-8">Pedir novo link</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-14" id="pagina-redefinir-senha">
      <div className="text-center">
        <h1 className="titulo-pagina">Criar nova senha</h1>
        <p className="subtitulo-pagina mt-2">Escolha uma senha com 8 a 72 caracteres.</p>
      </div>

      <form onSubmit={enviar} className="caixa-branca p-6 mt-8 flex flex-col gap-4" id="form-redefinir-senha">
        <div>
          <label className="campo-rotulo" htmlFor="nova-senha">Nova senha</label>
          <input id="nova-senha" type="password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="campo-rotulo" htmlFor="confirmar-senha">Repita a nova senha</label>
          <input id="confirmar-senha" type="password" className="campo" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" />
        </div>

        {erro && (
          <p className="text-[12px] text-red-700" id="erro-redefinir-senha" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-principal" disabled={carregando}>
          {carregando ? 'Aguarde...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}

export default RedefinirSenha
