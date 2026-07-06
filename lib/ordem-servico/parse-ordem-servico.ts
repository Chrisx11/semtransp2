import { PDFParse } from "pdf-parse"
import { decodeDataHoraDoPdf, dataHoraParaISO } from "./decode-datetime"

export interface ItemOrdemServico {
  codigo: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface ParsedOrdemServico {
  arquivoNome: string
  numeroOS: string | null
  placa: string | null
  fornecedor: string | null
  dataISO: string | null
  itens: ItemOrdemServico[]
  totalNota: number | null
  avisos: string[]
}

const ITEM_LINE_RE = /^([\d.]+)\t([\d.]+)\t(.+)\t(\S+)\s+([\d.]+)$/

function extractNumeroOS(fileName: string): string | null {
  const m = fileName.match(/No\.?\s*(\d+)/i)
  return m ? m[1] : null
}

function extractPlaca(text: string): string | null {
  const m = text.match(/Placa:\s*([A-Za-z0-9]+)/)
  if (!m) return null
  const placa = m[1].trim().toUpperCase()
  return placa === "0" ? null : placa
}

function extractFornecedor(text: string): string | null {
  const m = text.match(/\b\d{1,3}\s*-\s*([A-ZÀ-Ú][A-ZÀ-Ú0-9 .\/&-]{3,60})/)
  return m ? m[1].trim() : null
}

function extractTotalNota(text: string): number | null {
  const m = text.match(/V\.\s*\d+\s+([\d.]+)\s+Func:/)
  return m ? parseFloat(m[1]) : null
}

function extractItens(text: string): ItemOrdemServico[] {
  const itens: ItemOrdemServico[] = []
  const seen = new Set<string>()
  for (const line of text.split("\n")) {
    const m = line.match(ITEM_LINE_RE)
    if (!m) continue
    const [, valorUnitario, quantidade, descricao, codigo, valorTotal] = m
    const key = `${codigo}|${descricao}|${valorTotal}`
    if (seen.has(key)) continue // arquivo tem 2 vias idênticas (cliente + loja)
    seen.add(key)
    itens.push({
      codigo,
      descricao: descricao.trim(),
      quantidade: parseFloat(quantidade),
      valorUnitario: parseFloat(valorUnitario),
      valorTotal: parseFloat(valorTotal),
    })
  }
  return itens
}

export async function parseOrdemServicoPdf(buffer: Buffer, fileName: string): Promise<ParsedOrdemServico> {
  const avisos: string[] = []

  const parser = new PDFParse({ data: buffer })
  const { text } = await parser.getText()
  await parser.destroy()

  const numeroOS = extractNumeroOS(fileName)
  if (!numeroOS) avisos.push("Não foi possível identificar o número da OS pelo nome do arquivo.")

  const placa = extractPlaca(text)
  if (!placa) avisos.push("Placa não identificada no PDF (ou nota sem veículo vinculado).")

  const fornecedor = extractFornecedor(text)
  const itens = extractItens(text)
  if (itens.length === 0) avisos.push("Nenhum produto foi identificado na tabela do PDF.")

  const totalNota = extractTotalNota(text) ?? (itens.length ? Math.round(itens.reduce((a, i) => a + i.valorTotal, 0) * 100) / 100 : null)

  let dataISO: string | null = null
  try {
    const decoded = await decodeDataHoraDoPdf(buffer)
    if (decoded) {
      dataISO = dataHoraParaISO(decoded.dataStr, decoded.horaStr)
    }
  } catch {
    // segue sem data — tratado abaixo
  }
  if (!dataISO) avisos.push("Não foi possível decodificar a data/hora do cabeçalho do PDF.")

  return {
    arquivoNome: fileName,
    numeroOS,
    placa,
    fornecedor,
    dataISO,
    itens,
    totalNota,
    avisos,
  }
}
