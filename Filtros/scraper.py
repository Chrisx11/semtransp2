"""Scraping da Showlub para busca de filtros e seus equivalentes."""
import re
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.showlub.com.br"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def buscar_produtos(codigo: str, limite: int = 8):
    """Busca produtos no showlub pelo código do filtro. Retorna lista de dicts."""
    resp = requests.get(f"{BASE_URL}/buscar", params={"q": codigo}, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")

    produtos = []
    for item in soup.select(".listagem-item")[:limite]:
        link = item.select_one("a.nome-produto")
        if not link:
            continue
        img = item.select_one(".imagem-produto img")
        produtos.append({
            "nome": link.get_text(strip=True),
            "url": link.get("href"),
            "imagem": img.get("src") if img else None,
        })
    return produtos


def buscar_imagem(codigo: str):
    """Busca a imagem de um filtro específico pelo código (usado nos cliques dos equivalentes)."""
    produtos = buscar_produtos(codigo, limite=1)
    if not produtos:
        return None
    produto = produtos[0]
    return {
        "nome": produto["nome"],
        "imagem": produto["imagem"],
        "url": produto["url"],
    }


def extrair_equivalentes(url_produto: str):
    """Abre a página do produto e extrai a tabela de marcas equivalentes."""
    resp = requests.get(url_produto, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")

    descricao = soup.select_one("#descricao")
    if not descricao:
        return []

    tabela = descricao.find("table")
    if not tabela:
        return []

    equivalentes = []
    for linha in tabela.select("tr"):
        celulas = [c.get_text(strip=True) for c in linha.find_all("td")]
        celulas = [c for c in celulas if c]
        # celulas vêm em pares: marca, código, marca, código...
        for i in range(0, len(celulas) - 1, 2):
            marca, codigo = celulas[i], celulas[i + 1]
            if marca and codigo and marca != "." and codigo != ".":
                equivalentes.append({"marca": marca, "codigo": codigo})
    return equivalentes


def _normalizar(codigo: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", codigo.upper())


def pesquisar_filtro(codigo: str):
    """Faz a busca completa: encontra o produto e retorna nome + equivalentes."""
    produtos = buscar_produtos(codigo)
    if not produtos:
        return None

    produto = produtos[0]
    equivalentes = extrair_equivalentes(produto["url"])

    # O primeiro produto da busca pode ser um similar (quando o código
    # pesquisado está fora de estoque). O título deve sempre refletir o
    # código original pesquisado, usando a marca encontrada na própria
    # tabela de equivalentes quando disponível.
    codigo_norm = _normalizar(codigo)
    marca_original = None
    for eq in equivalentes:
        if _normalizar(eq["codigo"]) == codigo_norm:
            marca_original = eq["marca"]
            break

    if marca_original:
        nome = f"{marca_original} {codigo.upper()} - Filtro"
    else:
        nome = produto["nome"]

    return {
        "nome": nome,
        "codigo_pesquisado": codigo.upper(),
        "produto_encontrado": produto["nome"],
        "url": produto["url"],
        "imagem": produto["imagem"],
        "equivalentes": equivalentes,
    }


if __name__ == "__main__":
    import sys
    codigo = sys.argv[1] if len(sys.argv) > 1 else "PH8A"
    resultado = pesquisar_filtro(codigo)
    print(resultado)
