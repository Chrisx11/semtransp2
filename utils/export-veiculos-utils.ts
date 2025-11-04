"use client"

import type { Veiculo } from "@/services/veiculo-service"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

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

    // Adicionar título geral
    doc.setFontSize(16)
    doc.text("Relatório de Veículos - Agrupado por Secretaria", 14, 15)
    
    // Adicionar data de geração
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)

    // Agrupar veículos por secretaria
    const grupos = data.reduce((acc, item) => {
      const secretaria = item.secretaria?.trim() || 'Sem Secretaria';
      if (!acc[secretaria]) acc[secretaria] = [];
      acc[secretaria].push(item);
      return acc;
    }, {} as Record<string, Veiculo[]>);

    let startY = 30;
    const tableColumn = [
      "Placa", "Modelo", "Marca", "Ano", "Cor", "Tipo", "Chassi", "Renavam", "Combustível", "Medição", "Período Troca Óleo", "Status", "Secretaria", "Km Atual", "Km Próx. Troca", "Criado em", "Atualizado em"
    ];

    Object.entries(grupos).forEach(([secretaria, veiculos], idx) => {
      if (idx > 0 && startY > 30) {
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(14);
      doc.text(`Secretaria: ${secretaria}`, 14, startY);
      startY += 5;
      const tableRows = veiculos.map((item) => [
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
      ]);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY + 2,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [51, 51, 51] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: startY, left: 10, right: 10 },
        tableWidth: 'auto',
        didDrawPage: (data) => { startY = data.cursor.y + 10; }
      });
      startY = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 10 : startY + 50;
    });

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

    // Adicionar página final com resumo por secretaria
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Resumo por Secretaria', 14, 20);
    let resumeY = 30;
    let total = 0;
    Object.entries(grupos).forEach(([secretaria, veiculos]) => {
      doc.setFontSize(10);
      doc.text(`${secretaria}: ${veiculos.length} veículo${veiculos.length > 1 ? 's' : ''}`, 14, resumeY);
      resumeY += 8;
      total += veiculos.length;
    });
    doc.setFontSize(11);
    doc.text(`Total geral de veículos: ${total}`, 14, resumeY + 8);

    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`)
    console.log("PDF gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error)
    throw error
  }
}

// Função para exportar dados para Excel usando xlsx
export const exportToExcel = (data: Veiculo[], filename = "veiculos") => {
  try {
    console.log("Iniciando exportação para Excel...")

    // Criar workbook
    const workbook = XLSX.utils.book_new()

    // Preparar dados para Excel
    const excelData = data.map((item) => ({
      "Placa": item.placa,
      "Modelo": item.modelo,
      "Marca": item.marca,
      "Ano": item.ano,
      "Cor": item.cor,
      "Tipo": item.tipo,
      "Chassi": item.chassi,
      "Renavam": item.renavam,
      "Combustível": item.combustivel,
      "Medição": item.medicao,
      "Período Troca Óleo": item.periodoTrocaOleo || item.periodotrocaoleo || 0,
      "Status": item.status,
      "Secretaria": item.secretaria,
      "Km Atual": item.kmAtual || 0,
      "Km Próx. Troca": item.kmProxTroca || 0,
      "Criado em": item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      "Atualizado em": item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""
    }))

    // Criar planilha principal
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 10 }, // Placa
      { wch: 20 }, // Modelo
      { wch: 15 }, // Marca
      { wch: 8 },  // Ano
      { wch: 12 }, // Cor
      { wch: 15 }, // Tipo
      { wch: 20 }, // Chassi
      { wch: 15 }, // Renavam
      { wch: 12 }, // Combustível
      { wch: 12 }, // Medição
      { wch: 15 }, // Período Troca Óleo
      { wch: 10 }, // Status
      { wch: 15 }, // Secretaria
      { wch: 12 }, // Km Atual
      { wch: 15 }, // Km Próx. Troca
      { wch: 20 }, // Criado em
      { wch: 20 }  // Atualizado em
    ]
    worksheet['!cols'] = colWidths

    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos")

    // Agrupar por secretaria e criar planilhas separadas
    const grupos = data.reduce((acc, item) => {
      const secretaria = item.secretaria?.trim() || 'Sem Secretaria'
      if (!acc[secretaria]) acc[secretaria] = []
      acc[secretaria].push(item)
      return acc
    }, {} as Record<string, Veiculo[]>)

    // Criar planilha para cada secretaria
    Object.entries(grupos).forEach(([secretaria, veiculos]) => {
      const secretariaData = veiculos.map((item) => ({
        "Placa": item.placa,
        "Modelo": item.modelo,
        "Marca": item.marca,
        "Ano": item.ano,
        "Cor": item.cor,
        "Tipo": item.tipo,
        "Chassi": item.chassi,
        "Renavam": item.renavam,
        "Combustível": item.combustivel,
        "Medição": item.medicao,
        "Período Troca Óleo": item.periodoTrocaOleo || item.periodotrocaoleo || 0,
        "Status": item.status,
        "Km Atual": item.kmAtual || 0,
        "Km Próx. Troca": item.kmProxTroca || 0,
        "Criado em": item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
        "Atualizado em": item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""
      }))

      const secretariaWorksheet = XLSX.utils.json_to_sheet(secretariaData)
      secretariaWorksheet['!cols'] = colWidths
      
      // Nome da planilha limitado a 31 caracteres
      const sheetName = secretaria.length > 31 ? secretaria.substring(0, 31) : secretaria
      XLSX.utils.book_append_sheet(workbook, secretariaWorksheet, sheetName)
    })

    // Criar planilha de resumo
    const resumoData = Object.entries(grupos).map(([secretaria, veiculos]) => ({
      "Secretaria": secretaria,
      "Total de Veículos": veiculos.length,
      "Veículos Ativos": veiculos.filter(v => v.status === "Ativo").length,
      "Veículos Inativos": veiculos.filter(v => v.status === "Inativo").length
    }))

    // Adicionar total geral
    const totalGeral = data.length
    const totalAtivos = data.filter(v => v.status === "Ativo").length
    const totalInativos = data.filter(v => v.status === "Inativo").length

    resumoData.push({
      "Secretaria": "TOTAL GERAL",
      "Total de Veículos": totalGeral,
      "Veículos Ativos": totalAtivos,
      "Veículos Inativos": totalInativos
    })

    const resumoWorksheet = XLSX.utils.json_to_sheet(resumoData)
    resumoWorksheet['!cols'] = [
      { wch: 20 }, // Secretaria
      { wch: 15 }, // Total de Veículos
      { wch: 15 }, // Veículos Ativos
      { wch: 15 }  // Veículos Inativos
    ]
    XLSX.utils.book_append_sheet(workbook, resumoWorksheet, "Resumo")

    // Salvar arquivo
    const fileName = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)

    console.log("Excel gerado com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error)
    throw error
  }
}
