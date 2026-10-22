import { chamarApi, listarProdutosAdmin } from '../../componentes/Contas.js'
import { gerarXlsx } from '../../componentes/Xlsx.js'

const ROTULO_STATUS = { novo: 'Novo', pago: 'Pago', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' }
const ROTULO_PAGAMENTO = { pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' }
const ESTOQUE_BAIXO = 10

function situacaoDoEstoque(qtd) {
  if (qtd <= 0) return 'Sem estoque'
  if (qtd < ESTOQUE_BAIXO) return 'Baixo'
  return 'OK'
}

export function montarAbas(pedidos, produtos) {
  const abaPedidos = {
    nome: 'Pedidos',
    colunas: [
      { titulo: 'Pedido', largura: 14 },
      { titulo: 'Data', tipo: 'data', largura: 18 },
      { titulo: 'Situação', largura: 12 },
      { titulo: 'Pagamento', largura: 12 },
      { titulo: 'Cliente', largura: 26 },
      { titulo: 'E-mail', largura: 28 },
      { titulo: 'CPF', largura: 16 },
      { titulo: 'Telefone', largura: 16 },
      { titulo: 'Rua', largura: 28 },
      { titulo: 'Número', largura: 9 },
      { titulo: 'Bairro', largura: 18 },
      { titulo: 'Cidade', largura: 18 },
      { titulo: 'UF', largura: 6 },
      { titulo: 'CEP', largura: 12 },
      { titulo: 'Qtd. de peças', tipo: 'inteiro', largura: 12 },
      { titulo: 'Subtotal', tipo: 'moeda', largura: 14 },
      { titulo: 'Frete', tipo: 'moeda', largura: 12 },
      { titulo: 'Desconto', tipo: 'moeda', largura: 12 },
      { titulo: 'Total', tipo: 'moeda', largura: 14 },
    ],
    linhas: pedidos.map((p) => [
      p.numero,
      p.criadoEm,
      ROTULO_STATUS[p.status] || p.status,
      ROTULO_PAGAMENTO[p.pagamento] || p.pagamento,
      p.cliente?.nome,
      p.cliente?.email,
      p.cliente?.cpf,
      p.cliente?.telefone,
      p.endereco?.rua,
      p.endereco?.numero,
      p.endereco?.bairro,
      p.endereco?.cidade,
      p.endereco?.uf,
      p.endereco?.cep,
      (p.itens || []).reduce((soma, i) => soma + (Number(i.qtd) || 0), 0),
      p.subtotal,
      p.frete,
      p.desconto,
      p.total,
    ]),
  }

  const linhasItens = []
  for (const p of pedidos) {
    for (const i of p.itens || []) {
      linhasItens.push([
        p.numero,
        p.criadoEm,
        ROTULO_STATUS[p.status] || p.status,
        i.ref,
        i.nome,
        i.tamanho,
        i.cor,
        i.qtd,
        i.preco,
        (Number(i.preco) || 0) * (Number(i.qtd) || 0),
      ])
    }
  }
  const abaItens = {
    nome: 'Itens dos pedidos',
    colunas: [
      { titulo: 'Pedido', largura: 14 },
      { titulo: 'Data', tipo: 'data', largura: 18 },
      { titulo: 'Situação', largura: 12 },
      { titulo: 'SKU', largura: 14 },
      { titulo: 'Produto', largura: 32 },
      { titulo: 'Tamanho', largura: 10 },
      { titulo: 'Cor', largura: 14 },
      { titulo: 'Qtd.', tipo: 'inteiro', largura: 8 },
      { titulo: 'Preço unitário', tipo: 'moeda', largura: 14 },
      { titulo: 'Total do item', tipo: 'moeda', largura: 14 },
    ],
    linhas: linhasItens,
  }

  const abaEstoque = {
    nome: 'Estoque',
    colunas: [
      { titulo: 'SKU', largura: 14 },
      { titulo: 'Produto', largura: 34 },
      { titulo: 'Coleção', largura: 14 },
      { titulo: 'Subcategoria', largura: 16 },
      { titulo: 'Preço', tipo: 'moeda', largura: 12 },
      { titulo: 'Estoque', tipo: 'inteiro', largura: 10 },
      { titulo: 'Situação do estoque', largura: 18 },
      { titulo: 'Valor em estoque', tipo: 'moeda', largura: 16 },
      { titulo: 'Na vitrine', largura: 11 },
    ],
    linhas: produtos.map((p) => [
      p.ref,
      p.nome,
      p.categoria,
      p.sub,
      p.preco,
      p.estoque,
      situacaoDoEstoque(Number(p.estoque) || 0),
      (Number(p.preco) || 0) * (Number(p.estoque) || 0),
      p.vitrine === false ? 'Não' : 'Sim',
    ]),
  }

  return [abaPedidos, abaItens, abaEstoque]
}

export async function exportarExcel() {
  const [pedidos, produtos] = await Promise.all([chamarApi('admin/pedidos?todos=1'), listarProdutosAdmin()])
  const blob = gerarXlsx(montarAbas(pedidos, produtos))
  const hoje = new Date()
  const dia = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, '0'), String(hoje.getDate()).padStart(2, '0')].join('-')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'aridana-pedidos-estoque-' + dia + '.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 2000)
}