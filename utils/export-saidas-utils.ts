"use client"

import type { Saida } from "@/services/saida-service"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Função para exportar dados para CSV usando a API nativa do navegador
export const exportToCSV = (data: Saida[], filename = "saidas") => {
  try {
    // Cabeçalhos
    const headers = ["Produto", "Quantidade", "Data", "Responsável", "Veículo", "Observação"]

    // Converter dados para formato CSV
    const csvData = data.map((item) => [
      item.produtoNome,
      item.quantidade,
      format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }),
      item.responsavelNome,
      `${item.veiculoPlaca} - ${item.veiculoModelo}`,
      item.observacao || "",
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
export const exportToPDF = (data: Saida[], filename = "saidas") => {
  try {
    console.log("Iniciando exportação para PDF...")

    // Criar nova instância do jsPDF
    const doc = new jsPDF()

    // Adicionar título
    doc.setFontSize(16)
    doc.text("Relatório de Saídas", 14, 15)

    // Adicionar data de geração
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)

    // Preparar dados para a tabela
    const tableColumn = ["Produto", "Quantidade", "Data", "Responsável", "Veículo", "Observação"]
    const tableRows = data.map((item) => [
      item.produtoNome,
      item.quantidade,
      format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }),
      item.responsavelNome,
      `${item.veiculoPlaca} - ${item.veiculoModelo}`,
      item.observacao || "",
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
