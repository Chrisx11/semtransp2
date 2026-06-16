import { NextRequest, NextResponse } from "next/server"
import { buscarImagem } from "@/lib/showlub-scraper"

export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("codigo")?.trim() || ""

  if (!codigo) {
    return NextResponse.json({ erro: "Código não informado" }, { status: 400 })
  }

  try {
    const info = await buscarImagem(codigo)
    if (!info || !info.imagem) {
      return NextResponse.json({ erro: `Imagem não encontrada para "${codigo}".` }, { status: 404 })
    }
    return NextResponse.json(info)
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao consultar o site da Showlub." }, { status: 502 })
  }
}
