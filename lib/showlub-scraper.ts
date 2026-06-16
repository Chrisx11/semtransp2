import * as cheerio from "cheerio"

const BASE_URL = "https://www.showlub.com.br"
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }

export interface ProdutoShowlub {
  nome: string
  url: string
  imagem: string | null
}

export interface EquivalenteFiltro {
  marca: string
  codigo: string
}

export interface ResultadoFiltro {
  nome: string
  codigoPesquisado: string
  produtoEncontrado: string
  url: string
  imagem: string | null
  equivalentes: EquivalenteFiltro[]
}

function normalizar(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export async function buscarProdutos(codigo: string, limite = 8): Promise<ProdutoShowlub[]> {
  const resp = await fetch(`${BASE_URL}/buscar?q=${encodeURIComponent(codigo)}`, { headers: HEADERS })
  if (!resp.ok) throw new Error(`Falha ao consultar a Showlub (status ${resp.status})`)
  const html = await resp.text()
  const $ = cheerio.load(html)

  const produtos: ProdutoShowlub[] = []
  $(".listagem-item").each((_, el) => {
    if (produtos.length >= limite) return
    const link = $(el).find("a.nome-produto").first()
    if (!link.length) return
    const img = $(el).find(".imagem-produto img").first()
    produtos.push({
      nome: link.text().trim(),
      url: link.attr("href") || "",
      imagem: img.attr("src") || null,
    })
  })
  return produtos
}

export async function buscarImagem(codigo: string): Promise<{ nome: string; imagem: string | null; url: string } | null> {
  const produtos = await buscarProdutos(codigo, 1)
  if (!produtos.length) return null
  const produto = produtos[0]
  return { nome: produto.nome, imagem: produto.imagem, url: produto.url }
}

export async function extrairEquivalentes(urlProduto: string): Promise<EquivalenteFiltro[]> {
  const resp = await fetch(urlProduto, { headers: HEADERS })
  if (!resp.ok) throw new Error(`Falha ao consultar produto na Showlub (status ${resp.status})`)
  const html = await resp.text()
  const $ = cheerio.load(html)

  const descricao = $("#descricao")
  if (!descricao.length) return []

  const tabela = descricao.find("table").first()
  if (!tabela.length) return []

  const equivalentes: EquivalenteFiltro[] = []
  tabela.find("tr").each((_, linha) => {
    const celulas = $(linha)
      .find("td")
      .map((__, c) => $(c).text().trim())
      .get()
      .filter((c) => c)

    for (let i = 0; i < celulas.length - 1; i += 2) {
      const marca = celulas[i]
      const codigo = celulas[i + 1]
      if (marca && codigo && marca !== "." && codigo !== ".") {
        equivalentes.push({ marca, codigo })
      }
    }
  })
  return equivalentes
}

export async function pesquisarFiltro(codigo: string): Promise<ResultadoFiltro | null> {
  const produtos = await buscarProdutos(codigo)
  if (!produtos.length) return null

  const produto = produtos[0]
  const equivalentes = await extrairEquivalentes(produto.url)

  const codigoNorm = normalizar(codigo)
  const equivalenteOriginal = equivalentes.find((eq) => normalizar(eq.codigo) === codigoNorm)

  const nome = equivalenteOriginal
    ? `${equivalenteOriginal.marca} ${codigo.toUpperCase()} - Filtro`
    : produto.nome

  return {
    nome,
    codigoPesquisado: codigo.toUpperCase(),
    produtoEncontrado: produto.nome,
    url: produto.url,
    imagem: produto.imagem,
    equivalentes,
  }
}
