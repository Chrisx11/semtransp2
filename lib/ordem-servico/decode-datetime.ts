import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFArray, PDFNumber } from "pdf-lib"
import { inflateSync } from "zlib"
import { createHash } from "crypto"
import { DIGIT_FONT_HASH_TO_CHAR } from "./digit-font-map"

function decodeStreamBytes(stream: PDFRawStream): Buffer {
  const raw = Buffer.from(stream.getContents())
  const filter = stream.dict.get(PDFName.of("Filter"))
  if (filter && filter.toString().includes("FlateDecode")) {
    return inflateSync(raw)
  }
  return raw
}

type DigitFontCandidate = {
  name: string
  codeToHash: Record<number, string>
}

function findDigitFontCandidates(pdfDoc: PDFDocument, fontDict: PDFDict): DigitFontCandidate[] {
  const candidates: DigitFontCandidate[] = []

  fontDict.entries().forEach(([name, ref]) => {
    const font = pdfDoc.context.lookup(ref, PDFDict)
    const subtype = font.get(PDFName.of("Subtype"))
    if (!subtype || subtype.toString() !== "/Type3") return

    const encoding = font.lookupMaybe(PDFName.of("Encoding"), PDFDict)
    const diffs = encoding?.lookupMaybe(PDFName.of("Differences"), PDFArray)
    const charProcs = font.lookupMaybe(PDFName.of("CharProcs"), PDFDict)
    if (!diffs || !charProcs) return

    let code = 0
    const codeToHash: Record<number, string> = {}
    for (let i = 0; i < diffs.size(); i++) {
      const el = diffs.get(i)
      if (el instanceof PDFNumber) {
        code = el.asNumber()
        continue
      }
      const stream = charProcs.lookup(el as any, PDFRawStream)
      const bytes = decodeStreamBytes(stream)
      codeToHash[code] = createHash("sha1").update(bytes).digest("hex").slice(0, 12)
      code += 1
    }
    candidates.push({ name: name.toString(), codeToHash })
  })

  return candidates
}

function pickBestCandidate(candidates: DigitFontCandidate[]): DigitFontCandidate | null {
  let best: DigitFontCandidate | null = null
  for (const c of candidates) {
    const codes = Object.keys(c.codeToHash)
    const known = codes.filter((code) => DIGIT_FONT_HASH_TO_CHAR[c.codeToHash[Number(code)]]).length
    if (known > 0 && known === codes.length) {
      if (!best || known > Object.keys(best.codeToHash).length) best = c
    }
  }
  return best
}

function getPageContentBytes(pdfDoc: PDFDocument, page: ReturnType<PDFDocument["getPage"]>): Buffer {
  const contentsRef = (page as any).node.Contents()
  if (contentsRef instanceof PDFArray) {
    const parts: Buffer[] = []
    for (let i = 0; i < contentsRef.size(); i++) {
      const stream = pdfDoc.context.lookup(contentsRef.get(i), PDFRawStream)
      parts.push(decodeStreamBytes(stream))
    }
    return Buffer.concat(parts)
  }
  const stream = pdfDoc.context.lookup(contentsRef, PDFRawStream)
  return decodeStreamBytes(stream)
}

// Decodifica uma string literal de operador Tj (bytes entre parênteses,
// já sem o "(" / ")" externos) respeitando escapes octais e de barra.
function decodeLiteralStringBytes(raw: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== "\\") {
      bytes.push(raw.charCodeAt(i))
      continue
    }
    const next = raw[i + 1]
    if (next >= "0" && next <= "7") {
      let oct = next
      i += 1
      for (let k = 0; k < 2 && raw[i + 1] >= "0" && raw[i + 1] <= "7"; k++) {
        oct += raw[i + 1]
        i += 1
      }
      bytes.push(parseInt(oct, 8))
    } else {
      const map: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, "(": 40, ")": 41, "\\": 92 }
      bytes.push(map[next] !== undefined ? map[next] : next.charCodeAt(0))
      i += 1
    }
  }
  return bytes
}

const TOKEN_RE = /\/(\w+)\s+[\d.]+\s+Tf|\(((?:[^()\\]|\\.)*)\)\s*Tj/g

function extractTjStringsForFont(content: string, fontName: string, codeToChar: Record<number, string>): string[] {
  const results: string[] = []
  let currentFont: string | null = null
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(content))) {
    if (m[1]) {
      currentFont = "/" + m[1]
    } else if (m[2] !== undefined && currentFont === fontName) {
      const bytes = decodeLiteralStringBytes(m[2])
      results.push(bytes.map((b) => codeToChar[b] ?? "?").join(""))
    }
  }
  return results
}

export interface DecodedDataHora {
  dataStr: string // dd/mm/yyyy
  horaStr: string // hh:mm:ss
}

/** Decodifica a data/hora do cabeçalho (fonte Type3 sem texto extraível). */
export async function decodeDataHoraDoPdf(buffer: Buffer): Promise<DecodedDataHora | null> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false })
  const page = pdfDoc.getPage(0)
  const resources = (page as any).node.Resources() as PDFDict
  const fontDict = resources.lookupMaybe(PDFName.of("Font"), PDFDict)
  if (!fontDict) return null

  const candidates = findDigitFontCandidates(pdfDoc, fontDict)
  const best = pickBestCandidate(candidates)
  if (!best) return null

  const codeToChar: Record<number, string> = {}
  for (const [code, hash] of Object.entries(best.codeToHash)) {
    codeToChar[Number(code)] = DIGIT_FONT_HASH_TO_CHAR[hash]
  }

  const content = getPageContentBytes(pdfDoc, page).toString("latin1")
  const strings = extractTjStringsForFont(content, best.name, codeToChar)

  const dataStr = strings.find((s) => /^\d{2}\/\d{2}\/\d{4}$/.test(s))
  const horaStr = strings.find((s) => /^\d{2}:\d{2}:\d{2}$/.test(s))
  if (!dataStr || !horaStr) return null

  return { dataStr, horaStr }
}

/** Converte "dd/mm/yyyy" + "hh:mm:ss" para ISO string (horário local). */
export function dataHoraParaISO(dataStr: string, horaStr: string): string | null {
  const m = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const t = horaStr.match(/^(\d{2}):(\d{2}):(\d{2})$/)
  if (!m || !t) return null
  const [, dd, mm, yyyy] = m
  const [, hh, min, ss] = t
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss))
  return date.toISOString()
}
