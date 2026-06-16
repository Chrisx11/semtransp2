export interface ItemNotaExtraido {
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface NotaExtraida {
  numeroNota?: string
  dataNota?: string // yyyy-mm-dd
  placa?: string
  valorTotal?: number
  itens: ItemNotaExtraido[]
}

const PLACA_REGEX = /\b([A-Z]{3}[\s-]?\d[A-Z]\d{2}|[A-Z]{3}[\s-]?\d{4})\b/g

function paraNumero(valor: string): number {
  const limpo = valor.replace(/\./g, "").replace(",", ".")
  const n = parseFloat(limpo)
  return Number.isFinite(n) ? n : 0
}

function paraDataIso(dataBr: string): string | undefined {
  const m = dataBr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return undefined
  const [, dia, mes, ano] = m
  return `${ano}-${mes}-${dia}`
}

function extrairNumeroNota(texto: string): string | undefined {
  // Procura número grande isolado (geralmente o número do pedido/nota, 5 a 8 dígitos)
  const candidatos = texto.match(/\b\d{5,8}\b/g)
  if (!candidatos || !candidatos.length) return undefined
  // Prioriza o primeiro encontrado, que normalmente aparece no cabeçalho/canto superior
  return candidatos[0]
}

function extrairData(texto: string): string | undefined {
  const m = texto.match(/\d{2}\/\d{2}\/\d{4}/)
  return m ? paraDataIso(m[0]) : undefined
}

function extrairPlaca(texto: string): string | undefined {
  const m = texto.match(PLACA_REGEX)
  if (!m || !m.length) return undefined
  return m[0].replace(/[\s-]/g, "").toUpperCase()
}

function extrairValorTotal(texto: string): number | undefined {
  const linhas = texto.split("\n")
  for (const linha of linhas) {
    if (/total/i.test(linha)) {
      const valores = linha.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g)
      if (valores && valores.length) {
        return paraNumero(valores[valores.length - 1])
      }
    }
  }
  // Fallback: maior valor monetário encontrado no texto
  const todosValores = texto.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g)
  if (todosValores && todosValores.length) {
    return Math.max(...todosValores.map(paraNumero))
  }
  return undefined
}

function extrairItens(texto: string): ItemNotaExtraido[] {
  const linhas = texto.split("\n").map((l) => l.trim()).filter(Boolean)
  const itens: ItemNotaExtraido[] = []

  // Procura linhas no formato: <descrição> <qtde> <valor unitário> <valor total>
  const linhaItemRegex =
    /^(?<descricao>.+?)\s+(?<qtde>\d{1,4}(?:[.,]\d{1,3})?)\s+(?<valor>\d{1,3}(?:\.\d{3})*,\d{2})\s+(?<total>\d{1,3}(?:\.\d{3})*,\d{2})\s*$/

  for (const linha of linhas) {
    if (/total|subtotal/i.test(linha)) continue
    const match = linha.match(linhaItemRegex)
    if (match?.groups) {
      const descricao = match.groups.descricao.replace(/^\d{3,}\s*/, "").trim()
      if (descricao.length < 2) continue
      itens.push({
        descricao,
        quantidade: paraNumero(match.groups.qtde),
        valorUnitario: paraNumero(match.groups.valor),
        valorTotal: paraNumero(match.groups.total),
      })
    }
  }

  return itens
}

export function parseTextoNota(texto: string): NotaExtraida {
  return {
    numeroNota: extrairNumeroNota(texto),
    dataNota: extrairData(texto),
    placa: extrairPlaca(texto),
    valorTotal: extrairValorTotal(texto),
    itens: extrairItens(texto),
  }
}
