import { NextRequest, NextResponse } from "next/server"
import { pesquisarFiltro } from "@/lib/showlub-scraper"

export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("codigo")?.trim() || ""

  if (!codigo) {
    return NextResponse.json({ erro: "Código não informado" }, { status: 400 })
  }

  try {
    const resultado = await pesquisarFiltro(codigo)
    if (!resultado) {
      return NextResponse.json({ erro: `Nenhum filtro encontrado para o código "${codigo}".` }, { status: 404 })
    }
    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json({ erro: "Erro ao consultar o site da Showlub. Tente novamente." }, { status: 502 })
  }
}
