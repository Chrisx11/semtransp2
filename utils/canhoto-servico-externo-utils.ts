import jsPDF from "jspdf"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { OrdemServico } from "@/services/ordem-servico-service"

interface ServicoExternoData {
  ordemServico: OrdemServico
  fornecedorNome: string
  servicoSolicitado: string
  dataAutorizacao: Date
}

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
    img.onerror = reject
    img.src = url
  })
}

export async function gerarCanhotoServicoExternoPDF(data: ServicoExternoData) {
  try {
    // Carregar imagem do cabeçalho
    let headerImageDataUrl: string | null = null
    const imagePaths = ["/Cabeçalho.jpg", "/cabeçalho.jpg", "Cabeçalho.jpg"]
    
    for (const imagePath of imagePaths) {
      try {
        headerImageDataUrl = await loadImageAsDataURL(imagePath)
        break
      } catch (error) {
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
    const spacing = 8
    
    // Calcular altura de cada via (dividir verticalmente)
    const viaHeight = (pageHeight - margin * 2 - spacing) / 2
    const primeiraViaStartY = margin
    const linhaDivisoriaY = primeiraViaStartY + viaHeight + spacing / 2
    const segundaViaStartY = linhaDivisoriaY + spacing / 2

    // Função para desenhar uma via
    const desenharVia = (startX: number, startY: number, width: number, maxHeight: number) => {
      const padding = 12
      const contentWidth = width - padding * 2
      let currentY = startY + padding

      // Cabeçalho com imagem
      if (headerImageDataUrl) {
        try {
          doc.addImage(headerImageDataUrl, "JPEG", startX + padding, currentY, contentWidth, 20)
          currentY += 25
        } catch (error) {
          console.warn("Erro ao adicionar imagem do cabeçalho:", error)
        }
      }

      // Título
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text("AUTORIZAÇÃO DE SERVIÇO EXTERNO", startX + width / 2, currentY, { align: "center" })
      currentY += 8

      // Linha divisória
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.line(startX + padding, currentY, startX + width - padding, currentY)
      currentY += 6

      // Dados da OS
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      
      const dados = [
        [`Número da OS: ${data.ordemServico.numero}`, `Data: ${format(data.dataAutorizacao, "dd/MM/yyyy", { locale: ptBR })}`],
        [`Veículo: ${data.ordemServico.veiculoInfo}`, `Km Atual: ${data.ordemServico.kmAtual || "—"}`],
        [`Solicitante: ${data.ordemServico.solicitanteInfo}`, `Status: ${data.ordemServico.status}`],
        [`Fornecedor: ${data.fornecedorNome}`, ""],
      ]

      dados.forEach(([left, right]) => {
        doc.setFontSize(9)
        doc.text(left, startX + padding, currentY)
        if (right) {
          doc.text(right, startX + width - padding, currentY, { align: "right" })
        }
        currentY += 5
      })

      currentY += 3

      // Serviço Solicitado
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("SERVIÇO SOLICITADO:", startX + padding, currentY)
      currentY += 5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      const servicoLines = doc.splitTextToSize(data.servicoSolicitado, contentWidth)
      servicoLines.forEach((line: string) => {
        doc.text(line, startX + padding, currentY)
        currentY += 4
      })

      currentY += 5

      // Observações
      if (data.ordemServico.defeitosRelatados) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("DEFEITOS RELATADOS:", startX + padding, currentY)
        currentY += 5

        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        const defeitosLines = doc.splitTextToSize(data.ordemServico.defeitosRelatados, contentWidth)
        defeitosLines.forEach((line: string) => {
          doc.text(line, startX + padding, currentY)
          currentY += 4
        })
        currentY += 5
      }

      // Assinatura
      const assinaturaY = startY + maxHeight - 15
      const assinaturaStartX = startX + width - padding - 80
      const assinaturaEndX = startX + width - padding - 10
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

    // Largura da via
    const viaWidth = pageWidth - margin * 2

    // PRIMEIRA VIA (parte superior)
    desenharVia(margin, primeiraViaStartY, viaWidth, viaHeight)

    // Linha divisória horizontal no meio da página
    doc.setLineWidth(0.5)
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, linhaDivisoriaY, pageWidth - margin, linhaDivisoriaY)

    // SEGUNDA VIA (parte inferior)
    desenharVia(margin, segundaViaStartY, viaWidth, viaHeight)

    // Salvar o PDF
    const filename = `canhoto_servico_externo_${data.ordemServico.numero}_${format(
      data.dataAutorizacao,
      "yyyyMMdd",
      { locale: ptBR }
    )}.pdf`
    doc.save(filename)

    console.log("Canhoto de serviço externo gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao gerar canhoto:", error)
    throw error
  }
}

