import { NextResponse } from "next/server"
import { parseOrdemServicoPdf } from "@/lib/ordem-servico/parse-ordem-servico"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const files = formData.getAll("files").filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
  }

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const parsed = await parseOrdemServicoPdf(buffer, file.name)
        return { ok: true as const, ...parsed }
      } catch (e) {
        return {
          ok: false as const,
          arquivoNome: file.name,
          erro: e instanceof Error ? e.message : "Erro desconhecido ao processar o PDF.",
        }
      }
    }),
  )

  return NextResponse.json({ results })
}
