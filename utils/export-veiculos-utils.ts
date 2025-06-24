"use client"

import type { Veiculo } from "@/services/veiculo-service"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Função para exportar dados para CSV usando a API nativa do navegador
export const exportToCSV = (data: Veiculo[], filename = "veiculos") => {
  try {
    // Cabeçalhos
    const headers = ["Placa", "Modelo", "Marca", "Ano", "Cor", "Tipo", "Secretaria", "Status"]

    // Converter dados para formato CSV
    const csvData = data.map((item) => [
      item.placa,
      item.modelo,
      item.marca,
      item.ano.toString(),
      item.cor,
      item.tipo,
      item.secretaria,
      item.status,
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

// Função para exportar dados para PDF usando jsPDF
export const exportToPDF = (data: Veiculo[], filename = "veiculos") => {
  try {
    console.log("Iniciando exportação para PDF...")

    // Criar nova instância do jsPDF em modo paisagem
    const doc = new jsPDF({ orientation: "landscape" })

    // Adicionar título
    doc.setFontSize(16)
    doc.text("Relatório de Veículos", 14, 15)

    // Adicionar data de geração
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)

    // Cabeçalhos completos
    const tableColumn = [
      "Placa",
      "Modelo",
      "Marca",
      "Ano",
      "Cor",
      "Tipo",
      "Chassi",
      "Renavam",
      "Combustível",
      "Medição",
      "Período Troca Óleo",
      "Status",
      "Secretaria",
      "Km Atual",
      "Km Próx. Troca",
      "Criado em",
      "Atualizado em"
    ]
    const tableRows = data.map((item) => [
      item.placa,
      item.modelo,
      item.marca,
      item.ano?.toString() ?? "",
      item.cor,
      item.tipo,
      item.chassi,
      item.renavam,
      item.combustivel,
      item.medicao,
      item.periodoTrocaOleo?.toString() ?? item.periodotrocaoleo?.toString() ?? "",
      item.status,
      item.secretaria,
      item.kmAtual?.toString() ?? "",
      item.kmProxTroca?.toString() ?? "",
      item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "",
    ])

    // Gerar tabela automática
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 25, left: 10, right: 10 },
      tableWidth: 'auto',
    })

    // Adicionar rodapé com número de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Página ${i} de ${pageCount}`,
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
