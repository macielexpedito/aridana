
export let FRETE_GRATIS_A_PARTIR = 199.9

export const configLoja = {
  frete: { sp: 14.9, sulSudeste: 21.9, demais: 29.9 },
  banner: { titulo: 'MODA PARA\nTODOS OS\nMOMENTOS', subtitulo: 'Estilo, elegância e praticidade em um só lugar.' },
  maisVendidos: ['f2', 'a1', 'm1', 'a2'],
}

export const produtos = {
  feminino: [
    {
      id: 'f1', ref: 'AR-10842', nome: 'Blusa Feminina Basic', sub: 'blusas', preco: 139.9, estoque: 28,
      desc: 'Confeccionada em mix nobre de linho puro e algodão orgânico, com caimento fluido, modelagem reta e toque suave.',
      img: '/img/blusa-basic.jpg', etiqueta: '',
    },
    {
      id: 'f2', ref: 'AR-10311', nome: 'Vestido Midi Floral', sub: 'vestidos', preco: 189.9, estoque: 17,
      desc: 'Vestido midi leve com estampa floral e mangas bufantes, ideal para passeios e encontros de dia.',
      img: '/img/vestido-midi-floral.jpg', etiqueta: 'novo',
    },
    {
      id: 'f3', ref: 'AR-10527', nome: 'Blusa de Seda', sub: 'blusas', preco: 129.9, estoque: 12,
      desc: 'Blusa de seda azul-marinho com decote em V e caimento elegante.',
      img: '/img/blusa-de-seda.jpg', etiqueta: '',
    },
    {
      id: 'f4', ref: 'AR-10633', nome: 'Calça Alfaiataria', sub: 'calcas', preco: 219.9, estoque: 9,
      desc: 'Calça de alfaiataria cinza com corte reto, cintura alta e acabamento impecável.',
      img: '/img/calca-alfaiataria.jpg', etiqueta: 'destaque',
    },
    {
      id: 'f5', ref: 'AR-10714', nome: 'Saia Midi Plissada', sub: 'saias', preco: 159.9, estoque: 21,
      desc: 'Saia midi plissada verde-escuro, movimento leve e versátil para qualquer ocasião.',
      img: '/img/saia-midi-plissada.jpg', etiqueta: '',
    },
    {
      id: 'f6', ref: 'AR-10890', nome: 'Conjunto Linho', sub: 'conjuntos', preco: 299.9, estoque: 6,
      desc: 'Conjunto de colete e calça em linho bege, com amarração na cintura. Fresco e sofisticado.',
      img: '/img/conjunto-linho.jpg', etiqueta: 'novo',
    },
    {
      id: 'f7', ref: 'AR-10955', nome: 'Blazer Estruturado', sub: 'conjuntos', preco: 259.9, estoque: 8,
      desc: 'Blazer azul-marinho estruturado, perfeito para compor looks de trabalho e eventos.',
      img: '/img/blazer-estruturado.jpg', etiqueta: '',
    },
  ],

  masculino: [
    {
      id: 'm1', ref: 'AR-30102', nome: 'Camisa Social Slim', sub: 'camisas', preco: 149.9, estoque: 33,
      desc: 'Camisa social de modelagem slim em algodão, com acabamento refinado.',
      img: '/img/camisa-social-slim.jpg', etiqueta: 'destaque',
    },
    {
      id: 'm2', ref: 'AR-30911', nome: 'Jaqueta de Couro', sub: 'jaquetas', preco: 489.9, estoque: 0,
      desc: 'Jaqueta de couro marrom com forro macio, atemporal e resistente.',
      img: '/img/jaqueta-de-couro.jpg', etiqueta: 'novo',
    },
    {
      id: 'm3', ref: 'AR-30455', nome: 'Bota Couro Marrom', sub: 'calcados', preco: 349.9, estoque: 11,
      desc: 'Bota em couro marrom com solado resistente, conforto para o dia inteiro.',
      img: '/img/bota-couro-marrom.jpg', etiqueta: '',
    },
    {
      id: 'm4', ref: 'AR-30620', nome: 'Blazer Alfaiataria Navy', sub: 'jaquetas', preco: 389.9, estoque: 7,
      desc: 'Blazer de alfaiataria na cor navy, corte moderno e tecido leve.',
      img: '/img/blazer-alfaiataria-navy.jpg', etiqueta: 'destaque',
    },
    {
      id: 'm5', ref: 'AR-30288', nome: 'Suéter Cashmere Areia', sub: 'camisas', preco: 229.9, estoque: 15,
      desc: 'Suéter de gola alta em cashmere na cor areia, toque macio e quente.',
      img: '/img/sueter-cashmere-areia.jpg', etiqueta: '',
    },
    {
      id: 'm6', ref: 'AR-30289', nome: 'Suéter Cashmere Bege', sub: 'camisas', preco: 289.9, estoque: 10,
      desc: 'Suéter de gola alta em cashmere bege, acabamento premium.',
      img: '/img/sueter-cashmere-bege.jpg', etiqueta: 'novo',
    },
    {
      id: 'm7', ref: 'AR-30228', nome: 'Camisa Linho Off-White Masculina', sub: 'camisas', preco: 219.9, estoque: 19,
      desc: 'Camisa em linho off-white, fresca e elegante para os dias quentes.',
      img: '', etiqueta: '',
    },
  ],

  acessorios: [
    {
      id: 'a1', ref: 'AR-20104', nome: 'Colar Dourado Delicado', sub: 'joias', preco: 89.9, estoque: 62,
      desc: 'Colar dourado delicado com pingentes, para compor com qualquer look.',
      img: '/img/colar-dourado.jpg', etiqueta: 'novo',
    },
    {
      id: 'a2', ref: 'AR-20419', nome: 'Bolsa Crossbody Couro', sub: 'bolsas', preco: 219.9, estoque: 14,
      desc: 'Bolsa transversal em couro legítimo, prática e elegante.',
      img: '/img/bolsa-crossbody.jpg', etiqueta: 'destaque',
    },
    {
      id: 'a3', ref: 'AR-20533', nome: 'Kit Óculos & Carteira', sub: 'oculos', preco: 159.9, estoque: 25,
      desc: 'Kit com óculos de sol e carteira de couro para o dia a dia.',
      img: '/img/kit-oculos-carteira.jpg', etiqueta: '',
    },
    {
      id: 'a4', ref: 'AR-20760', nome: 'Bolsa Estruturada Azul', sub: 'bolsas', preco: 189.9, estoque: 5,
      desc: 'Bolsa estruturada azul-turquesa com fecho metálico, peça de destaque.',
      img: '/img/bolsa-estruturada-azul.jpg', etiqueta: 'novo',
    },
  ],
}

export const categoria = {
  feminino: {
    titulo: 'Feminino',
    subtitulo: 'Encontre peças para diferentes momentos e estilos.',
    filtros: [
      { chave: 'todos', rotulo: 'Todos' },
      { chave: 'vestidos', rotulo: 'Vestidos' },
      { chave: 'blusas', rotulo: 'Blusas' },
      { chave: 'calcas', rotulo: 'Calças' },
      { chave: 'saias', rotulo: 'Saias' },
      { chave: 'conjuntos', rotulo: 'Conjuntos' },
    ],
  },
  masculino: {
    titulo: 'Masculino',
    subtitulo: 'Estilo, conforto e praticidade para todos os momentos.',
    filtros: [
      { chave: 'todos', rotulo: 'Todos' },
      { chave: 'camisas', rotulo: 'Camisas' },
      { chave: 'calcas', rotulo: 'Calças' },
      { chave: 'jaquetas', rotulo: 'Jaquetas' },
      { chave: 'calcados', rotulo: 'Calçados' },
    ],
  },
  acessorios: {
    titulo: 'Acessórios',
    subtitulo: 'Detalhes que completam o seu estilo.',
    filtros: [
      { chave: 'todos', rotulo: 'Todos' },
      { chave: 'joias', rotulo: 'Jóias' },
      { chave: 'bolsas', rotulo: 'Bolsas' },
      { chave: 'oculos', rotulo: 'Óculos' },
      { chave: 'relogios', rotulo: 'Relógios' },
      { chave: 'cintos', rotulo: 'Cintos' },
    ],
  },
}

export const todosProdutos = Object.keys(produtos).flatMap((chave) =>
  produtos[chave].map((p) => ({ ...p, categoria: chave }))
)

export async function carregarCatalogo() {
  try {
    const resp = await fetch('/api/produtos')
    if (!resp.ok) return false
    const lista = await resp.json()
    if (!Array.isArray(lista)) return false
    for (const chave of Object.keys(produtos)) {
      produtos[chave].length = 0
    }
    todosProdutos.length = 0
    for (const p of lista) {
      if (!produtos[p.categoria]) continue
      produtos[p.categoria].push(p)
      todosProdutos.push(p)
    }

    const respLoja = await fetch('/api/loja')
    if (respLoja.ok) {
      const cfg = await respLoja.json()
      FRETE_GRATIS_A_PARTIR = cfg.freteGratis
      configLoja.frete = cfg.frete
      configLoja.banner = cfg.banner
      configLoja.maisVendidos = cfg.maisVendidos
    }
    return true
  } catch (e) {
    return false
  }
}

export function acharProduto(id) {
  return todosProdutos.find((p) => p.id === id)
}

export function formatBRL(v) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function calcularFrete(uf, subtotal) {
  if (subtotal >= FRETE_GRATIS_A_PARTIR) return 0
  if (uf === 'SP') return configLoja.frete.sp
  if (['RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(uf)) return configLoja.frete.sulSudeste
  return configLoja.frete.demais
}

export async function buscarCep(cep) {
  const limpo = cep.replace(/\D/g, '')
  if (limpo.length !== 8) throw new Error('cep_invalido')
  const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
  if (!resposta.ok) throw new Error('indisponivel')
  const dados = await resposta.json()
  if (dados.erro) throw new Error('cep_invalido')
  return {
    cep: limpo,
    rua: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf,
  }
}
