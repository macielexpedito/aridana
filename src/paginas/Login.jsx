import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { autenticar, cadastrar } from '../componentes/Contas.js'

function Login({ usuario, onEntrar, onMensagem }) {
  const navegar = useNavigate()
  const local = useLocation()

  const [modo, setModo] = useState('entrar')
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  let destino = local.state && local.state.de ? local.state.de : null
  if (destino === '/admin' && usuario && usuario.tipo !== 'admin') destino = null

  if (usuario) {
    return <Navigate to={destino || (usuario.tipo === 'admin' ? '/admin' : '/')} replace />
  }

  function mudar(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')

    if (form.email.trim() === '' || form.senha === '') {
      setErro('Preencha o e-mail e a senha.')
      return
    }
    if (modo === 'cadastrar') {
      if (form.nome.trim() === '') return setErro('Informe o seu nome.')
      if (form.senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    }

    setCarregando(true)
    try {
      const novo =
        modo === 'cadastrar'
          ? await cadastrar(form.nome, form.email, form.senha)
          : await autenticar(form.email, form.senha)

      if (destino === '/admin' && novo.tipo !== 'admin') destino = null
      onEntrar(novo)
      onMensagem(modo === 'cadastrar' ? 'Conta criada! Bem-vinda, ' + novo.nome.split(' ')[0] : 'Olá, ' + novo.nome.split(' ')[0])
      navegar(destino || (novo.tipo === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      if (err.message === 'email_em_uso') setErro('Já existe uma conta com esse e-mail.')
      else if (err.message === 'sem_servidor') setErro('Servidor indisponível. Inicie o back-end (npm run server) e o MongoDB.')
      else if (err.message === 'senha_curta' || err.message === 'senha_longa') setErro('A senha deve ter de 8 a 72 caracteres.')
      else if (err.message === 'email_invalido') setErro('Informe um e-mail válido.')
      else if (err.message === 'muitas_tentativas') setErro('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
      else if (err.message === 'erro_servidor') setErro('Erro no servidor. Tente novamente.')
      else setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
    }
    setCarregando(false)
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-14" id="pagina-login">
      <div className="text-center">
        <h1 className="titulo-pagina">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="subtitulo-pagina mt-2">
          {modo === 'entrar' ? 'Acesse a sua conta ARIDANA.' : 'Cadastre-se para comprar com mais facilidade.'}
        </p>
      </div>

      <form onSubmit={enviar} className="caixa-branca p-6 mt-8 flex flex-col gap-4" id="form-login">
        {modo === 'cadastrar' && (
          <div>
            <label className="campo-rotulo" htmlFor="login-nome">Nome completo</label>
            <input id="login-nome" name="nome" className="campo" value={form.nome} onChange={mudar} autoComplete="name" />
          </div>
        )}

        <div>
          <label className="campo-rotulo" htmlFor="login-email">E-mail</label>
          <input id="login-email" name="email" type="email" className="campo" value={form.email} onChange={mudar} autoComplete="email" />
        </div>

        <div>
          <label className="campo-rotulo" htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            name="senha"
            type="password"
            className="campo"
            value={form.senha}
            onChange={mudar}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          />
        </div>

        {erro && (
          <p className="text-[12px] text-red-700" id="erro-login" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="botao-principal" disabled={carregando}>
          {carregando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          type="button"
          className="text-xs underline text-pedra"
          onClick={() => {
            setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')
            setErro('')
          }}
        >
          {modo === 'entrar' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Login
