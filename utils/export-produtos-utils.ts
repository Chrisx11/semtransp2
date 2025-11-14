"use client"

import type { Produto } from "@/services/produto-service"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Atualizar a função exportToCSV para incluir o estoque
export const exportToCSV = (data: Produto[], filename = "produtos") => {
  try {
    // Cabeçalhos
    const headers = ["Descrição", "Categoria", "Unidade", "Localização", "Estoque"]

    // Converter dados para formato CSV
    const csvData = data.map((item) => [
      item.descricao,
      item.categoria,
      item.unidade,
      item.localizacao,
      item.estoque.toString(),
    ])

    // Adicionar cabeçalhos
    csvData.unshift(headers)

    // Converter para string CSV
    const csvString = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Criar um elemento <a> para download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.display = "none"
    document.body.appendChild(link)

    // Simular clique e remover o elemento
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Erro ao exportar para CSV:", error)
    throw error
  }
}

// Atualizar a função exportToPDF para incluir o estoque
export const exportToPDF = (data: Produto[], filename = "produtos") => {
  try {
    console.log("Iniciando exportação para PDF...")

    // Criar nova instância do jsPDF
    const doc = new jsPDF()

    // Adicionar título
    doc.setFontSize(16)
    doc.text("Relatório de Produtos", 14, 15)

    // Adicionar data de geração
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)

    // Preparar dados para a tabela
    const tableColumn = ["Descrição", "Categoria", "Unidade", "Localização", "Estoque"]
    const tableRows = data.map((item) => [
      item.descricao,
      item.categoria,
      item.unidade,
      item.localizacao,
      item.estoque.toString(),
    ])

    // Gerar tabela automática
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 25 },
    })

    // Adicionar rodapé com número de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
        align: "center",
      })
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

// Exportar para Excel (.xlsx) com todos os campos principais
export const exportToXLSX = async (data: Produto[], filename = "produtos") => {
  try {
    // Importação dinâmica do ExcelJS para evitar problemas no client-side
    const ExcelJS = (await import("exceljs")).default
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Produtos")

    // Definir cabeçalhos
    worksheet.columns = [
      { header: "Descrição", key: "descricao", width: 30 },
      { header: "Categoria", key: "categoria", width: 20 },
      { header: "Unidade", key: "unidade", width: 15 },
      { header: "Localização", key: "localizacao", width: 20 },
      { header: "Estoque", key: "estoque", width: 15 },
    ]

    // Estilizar cabeçalhos
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Adicionar dados
    data.forEach((item) => {
      worksheet.addRow({
        descricao: item.descricao,
        categoria: item.categoria,
        unidade: item.unidade,
        localizacao: item.localizacao,
        estoque: item.estoque,
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

    return true
  } catch (error) {
    console.error("Erro ao exportar para XLSX:", error)
    throw error
  }
}
