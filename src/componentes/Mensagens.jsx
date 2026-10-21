function Mensagens({ message }) {
  if (!message) return null

  return (
    <div
      id="caixa-mensagem"
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-carvao text-white text-sm px-5 py-3 shadow-lg font-detalhe"
    >
      {message}
    </div>
  )
}

export default Mensagens
