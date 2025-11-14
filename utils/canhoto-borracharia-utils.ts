import jsPDF from "jspdf"
import type { AutorizacaoBorracharia } from "@/services/autorizacao-borracharia-service"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Função auxiliar para carregar imagem como base64
function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/jpeg"))
      } else {
        reject(new Error("Não foi possível criar o contexto do canvas"))
      }
    }
    img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${url}`))
    img.src = url
  })
}

export async function gerarCanhotoPDF(autorizacao: AutorizacaoBorracharia) {
  try {
    // Carregar imagem do cabeçalho
    // Tenta primeiro na pasta public, depois na raiz
    let headerImageDataUrl: string | null = null
    const imagePaths = ["/Cabeçalho.jpg", "/cabeçalho.jpg", "Cabeçalho.jpg"]
    
    for (const imagePath of imagePaths) {
      try {
        headerImageDataUrl = await loadImageAsDataURL(imagePath)
        break // Se carregou com sucesso, para de tentar
      } catch (error) {
        // Continua tentando outros caminhos
        continue
      }
    }
    
    if (!headerImageDataUrl) {
      console.warn("Não foi possível carregar a imagem do cabeçalho. Verifique se o arquivo Cabeçalho.jpg está na pasta public.")
    }
    // Criar nova instância do jsPDF em modo retrato
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 10
    const spacing = 8 // Espaçamento entre as duas vias
    
    // Calcular altura de cada via (dividir verticalmente)
    const viaHeight = (pageHeight - margin * 2 - spacing) / 2
    const primeiraViaStartY = margin
    const linhaDivisoriaY = primeiraViaStartY + viaHeight + spacing / 2
    const segundaViaStartY = linhaDivisoriaY + spacing / 2

    // Função para desenhar uma via
    const desenharVia = (startX: number, startY: number, width: number, maxHeight: number) => {
      const padding = 12
      const contentWidth = width - padding * 2
      let y = startY

      // Área do cabeçalho para logo
      const headerHeight = 30
      
      // Se temos a imagem, adicionar ela; caso contrário, mostrar placeholder
      if (headerImageDataUrl) {
        try {
          // Adicionar a imagem do cabeçalho
          // Calcular dimensões mantendo proporção
          const headerWidth = contentWidth
          const headerY = y
          
          doc.addImage(
            headerImageDataUrl,
            "JPEG",
            startX + padding,
            headerY,
            headerWidth,
            headerHeight
          )
        } catch (error) {
          console.warn("Erro ao adicionar imagem do cabeçalho:", error)
          // Fallback para placeholder
          doc.setDrawColor(245, 245, 245)
          doc.setFillColor(245, 245, 245)
          doc.rect(startX + padding, y, contentWidth, headerHeight, "FD")
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.2)
          doc.rect(startX + padding, y, contentWidth, headerHeight, "S")
          doc.setFontSize(7)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(160, 160, 160)
          doc.text(
            "[Área para logo/cabeçalho]",
            startX + width / 2,
            y + headerHeight / 2,
            { align: "center" }
          )
        }
      } else {
        // Placeholder se a imagem não foi carregada
        doc.setDrawColor(245, 245, 245)
        doc.setFillColor(245, 245, 245)
        doc.rect(startX + padding, y, contentWidth, headerHeight, "FD")
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.rect(startX + padding, y, contentWidth, headerHeight, "S")
        doc.setFontSize(7)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(160, 160, 160)
        doc.text(
          "[Área para logo/cabeçalho]",
          startX + width / 2,
          y + headerHeight / 2,
          { align: "center" }
        )
      }
      
      doc.setTextColor(0, 0, 0)
      y += headerHeight + 10

      // Título principal
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("AUTORIZAÇÃO PARA SERVIÇO EM BORRACHARIA", startX + width / 2, y, {
        align: "center",
      })
      y += 8

      // Linha separadora do título
      doc.setLineWidth(0.5)
      doc.setDrawColor(0, 0, 0)
      doc.line(startX + padding, y, startX + width - padding, y)
      y += 8

      // Área de conteúdo
      const contentStartY = y
      const contentEndY = startY + maxHeight - 25
      const fieldSpacing = 7
      const fontSize = 9
      const labelFontSize = 9.5

      // Organização em duas colunas
      const leftX = startX + padding + 8
      const rightX = startX + width / 2 + 8
      const labelOffset = 35
      const lineSpacing = 5

      // Linha 1: Placa | Modelo
      doc.setFont("helvetica", "bold")
      doc.setFontSize(labelFontSize)
      doc.text("Placa:", leftX, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(fontSize)
      doc.text(autorizacao.veiculoPlaca, leftX + labelOffset, y)

      doc.setFont("helvetica", "bold")
      doc.text("Modelo:", rightX, y)
      doc.setFont("helvetica", "normal")
      const modeloText = `${autorizacao.veiculoMarca} ${autorizacao.veiculoModelo}`
      const modeloLines = doc.splitTextToSize(modeloText, contentWidth / 2 - labelOffset - 10)
      modeloLines.forEach((line: string, idx: number) => {
        doc.text(line, rightX + labelOffset, y + idx * lineSpacing)
      })
      y += Math.max(fieldSpacing, modeloLines.length * lineSpacing)

      // Linha 2: Secretaria | Status
      doc.setFont("helvetica", "bold")
      doc.text("Secretaria:", leftX, y)
      doc.setFont("helvetica", "normal")
      const secretariaLines = doc.splitTextToSize(autorizacao.veiculoSecretaria, contentWidth / 2 - labelOffset - 10)
      secretariaLines.forEach((line: string, idx: number) => {
        doc.text(line, leftX + labelOffset, y + idx * lineSpacing)
      })

      doc.setFont("helvetica", "bold")
      doc.text("Status:", rightX, y)
      doc.setFont("helvetica", "normal")
      doc.text(autorizacao.status, rightX + labelOffset, y)

      y += Math.max(fieldSpacing, secretariaLines.length * lineSpacing)

      // Linha 3: Data Autorização | Data Prevista
      doc.setFont("helvetica", "bold")
      doc.text("Data Autorização:", leftX, y)
      doc.setFont("helvetica", "normal")
      doc.text(
        format(new Date(autorizacao.dataAutorizacao), "dd/MM/yyyy", { locale: ptBR }),
        leftX + labelOffset,
        y
      )

      doc.setFont("helvetica", "bold")
      doc.text("Data Prevista:", rightX, y)
      doc.setFont("helvetica", "normal")
      doc.text(
        format(new Date(autorizacao.dataPrevista), "dd/MM/yyyy", { locale: ptBR }),
        rightX + labelOffset,
        y
      )
      y += fieldSpacing + 2

      // Linha 4: Valor (se existir) | Solicitante
      if (autorizacao.preco !== undefined && autorizacao.preco !== null) {
        doc.setFont("helvetica", "bold")
        doc.text("Valor:", leftX, y)
        doc.setFont("helvetica", "normal")
        doc.text(
          `R$ ${autorizacao.preco.toFixed(2).replace(".", ",")}`,
          leftX + labelOffset,
          y
        )
      }

      doc.setFont("helvetica", "bold")
      doc.text("Solicitante:", rightX, y)
      doc.setFont("helvetica", "normal")
      const solicitanteLines = doc.splitTextToSize(
        autorizacao.solicitanteNome,
        contentWidth / 2 - labelOffset - 10
      )
      solicitanteLines.forEach((line: string, idx: number) => {
        doc.text(line, rightX + labelOffset, y + idx * lineSpacing)
      })
      y += Math.max(fieldSpacing + 2, solicitanteLines.length * lineSpacing) + 1 // Reduzido de 3 para 1 para aproximar

      // Autorizado Por (logo abaixo de Valor, na mesma posição horizontal)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(labelFontSize)
      doc.text("Autorizado Por:", leftX, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(fontSize)
      const autorizadoLines = doc.splitTextToSize(
        autorizacao.autorizadoPorNome,
        contentWidth - labelOffset - 5
      )
      autorizadoLines.forEach((line: string, idx: number) => {
        doc.text(line, leftX + labelOffset, y + idx * lineSpacing)
      })
      y += Math.max(fieldSpacing, autorizadoLines.length * lineSpacing) + 1 // Reduzido de 2 para 1 para aproximar mais

      // Observações (se existir) - removidas as linhas separadoras
      if (autorizacao.observacoes) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(labelFontSize)
        doc.text("Observações:", leftX, y)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(fontSize)
        y += 5 // Aumentado para dar espaço entre título e conteúdo

        const obsLines = doc.splitTextToSize(autorizacao.observacoes, contentWidth - 10)
        obsLines.forEach((line: string) => {
          doc.text(line, leftX, y)
          y += 4.5
        })
      }

      // Linha de assinatura (movida mais para a direita)
      const assinaturaY = startY + maxHeight - 10
      const assinaturaStartX = startX + width - padding - 80 // Movido mais para a direita (era padding + 30)
      const assinaturaEndX = startX + width - padding - 10 // Ajustado para manter proporção
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(assinaturaStartX, assinaturaY, assinaturaEndX, assinaturaY)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(
        "Assinatura do Responsável",
        assinaturaStartX + (assinaturaEndX - assinaturaStartX) / 2,
        assinaturaY + 4,
        { align: "center" }
      )
    }

    // Largura da via (toda a largura da página menos margens)
    const viaWidth = pageWidth - margin * 2

    // PRIMEIRA VIA (parte superior)
    // O cabeçalho já é desenhado dentro da função desenharVia
    desenharVia(margin, primeiraViaStartY, viaWidth, viaHeight)

    // Linha divisória horizontal no meio da página
    doc.setLineWidth(0.5)
    doc.setDrawColor(0, 0, 0)
    doc.line(
      margin,
      linhaDivisoriaY,
      pageWidth - margin,
      linhaDivisoriaY
    )

    // SEGUNDA VIA (parte inferior)
    // O cabeçalho já é desenhado dentro da função desenharVia
    desenharVia(margin, segundaViaStartY, viaWidth, viaHeight)

    // Salvar o PDF
    const filename = `canhoto_autorizacao_${autorizacao.veiculoPlaca}_${format(
      new Date(),
      "yyyyMMdd",
      { locale: ptBR }
    )}.pdf`
    doc.save(filename)

    console.log("Canhoto gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao gerar canhoto:", error)
    throw error
  }
}

