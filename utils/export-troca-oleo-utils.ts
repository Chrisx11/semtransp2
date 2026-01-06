"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Tipo para veículo com dados de troca de óleo
interface VeiculoComDados {
  placa: string
  modelo: string
  marca: string
  kmAtual: number
  kmProxTroca: number
  progresso: number
  periodotrocaoleo?: number
  periodoTrocaOleo?: number
  secretaria?: string
}

// Função para exportar dados para PDF usando jsPDF
export const exportToPDF = (data: VeiculoComDados[], filename = "troca_oleo") => {
  try {
    console.log("Iniciando exportação para PDF...")

    // Criar nova instância do jsPDF em modo paisagem
    const doc = new jsPDF({ orientation: "landscape" })

    // Adicionar título geral
    doc.setFontSize(16)
    doc.text("Relatório de Troca de Óleo", 14, 15)
    
    // Adicionar data de geração
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22)

    // Preparar dados para a tabela
    const tableColumn = [
      "Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Km Próx. Troca", "Progresso (%)", "Período Troca (km)"
    ]

    const tableRows = data.map((item) => [
      item.placa,
      item.modelo,
      item.marca,
      (item as any).secretaria || "N/A",
      item.kmAtual.toLocaleString(),
      item.kmProxTroca.toLocaleString(),
      `${item.progresso}%`,
      (item.periodotrocaoleo || item.periodoTrocaOleo || 0).toLocaleString(),
    ])

    // Gerar tabela automática
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 30, left: 10, right: 10 },
    })

    // Adicionar rodapé com número de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      )
    }

    // Salvar o PDF
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
    console.log("PDF gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error)
    throw error
  }
}

// Função para exportar dados para Excel usando exceljs
export const exportToExcel = async (data: VeiculoComDados[], filename = "troca_oleo") => {
  try {
    console.log("Iniciando exportação para Excel...")

    // Importação dinâmica do ExcelJS para evitar problemas no client-side
    const ExcelJS = (await import("exceljs")).default
    
    const workbook = new ExcelJS.Workbook()

    // Criar planilha principal
    const worksheet = workbook.addWorksheet("Troca de Óleo")
    worksheet.columns = [
      { header: "Placa", key: "placa", width: 12 },
      { header: "Modelo", key: "modelo", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Secretaria", key: "secretaria", width: 18 },
      { header: "Km Atual", key: "kmAtual", width: 12 },
      { header: "Km Próx. Troca", key: "kmProxTroca", width: 15 },
      { header: "Progresso (%)", key: "progresso", width: 15 },
      { header: "Período Troca (km)", key: "periodoTroca", width: 18 },
    ]

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Adicionar dados
    data.forEach((item) => {
      worksheet.addRow({
        placa: item.placa,
        modelo: item.modelo,
        marca: item.marca,
        secretaria: (item as any).secretaria || "N/A",
        kmAtual: item.kmAtual,
        kmProxTroca: item.kmProxTroca,
        progresso: item.progresso,
        periodoTroca: item.periodotrocaoleo || item.periodoTrocaOleo || 0,
      })
    })

    // Gerar buffer e fazer download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const today = new Date().toISOString().split("T")[0]
    link.download = `${filename}_${today}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log("Excel gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error)
    throw error
  }
}

