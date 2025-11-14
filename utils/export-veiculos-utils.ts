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

// Função para exportar dados para Excel usando exceljs
export const exportToExcel = async (data: Veiculo[], filename = "veiculos") => {
  try {
    console.log("Iniciando exportação para Excel...")

    // Importação dinâmica do ExcelJS para evitar problemas no client-side
    const ExcelJS = (await import("exceljs")).default
    
    const workbook = new ExcelJS.Workbook()

    // Agrupar por secretaria
    const grupos = data.reduce((acc, item) => {
      const secretaria = item.secretaria?.trim() || 'Sem Secretaria'
      if (!acc[secretaria]) acc[secretaria] = []
      acc[secretaria].push(item)
      return acc
    }, {} as Record<string, Veiculo[]>)

    // Criar planilha principal "Veículos"
    const mainWorksheet = workbook.addWorksheet("Veículos")
    mainWorksheet.columns = [
      { header: "Placa", key: "placa", width: 10 },
      { header: "Modelo", key: "modelo", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Ano", key: "ano", width: 8 },
      { header: "Cor", key: "cor", width: 12 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Chassi", key: "chassi", width: 20 },
      { header: "Renavam", key: "renavam", width: 15 },
      { header: "Combustível", key: "combustivel", width: 12 },
      { header: "Medição", key: "medicao", width: 12 },
      { header: "Período Troca Óleo", key: "periodoTrocaOleo", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Secretaria", key: "secretaria", width: 15 },
      { header: "Km Atual", key: "kmAtual", width: 12 },
      { header: "Km Próx. Troca", key: "kmProxTroca", width: 15 },
      { header: "Criado em", key: "createdAt", width: 20 },
      { header: "Atualizado em", key: "updatedAt", width: 20 },
    ]

    // Estilizar cabeçalho da planilha principal
    mainWorksheet.getRow(1).font = { bold: true }
    mainWorksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Adicionar dados à planilha principal
    data.forEach((item) => {
      mainWorksheet.addRow({
        placa: item.placa,
        modelo: item.modelo,
        marca: item.marca,
        ano: item.ano,
        cor: item.cor,
        tipo: item.tipo,
        chassi: item.chassi,
        renavam: item.renavam,
        combustivel: item.combustivel,
        medicao: item.medicao,
        periodoTrocaOleo: item.periodoTrocaOleo || item.periodotrocaoleo || 0,
        status: item.status,
        secretaria: item.secretaria,
        kmAtual: item.kmAtual || 0,
        kmProxTroca: item.kmProxTroca || 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "",
      })
    })

    // Criar planilha para cada secretaria
    Object.entries(grupos).forEach(([secretaria, veiculos]) => {
      const sheetName = secretaria.length > 31 ? secretaria.substring(0, 31) : secretaria
      const worksheet = workbook.addWorksheet(sheetName)
      
      worksheet.columns = [
        { header: "Placa", key: "placa", width: 10 },
        { header: "Modelo", key: "modelo", width: 20 },
        { header: "Marca", key: "marca", width: 15 },
        { header: "Ano", key: "ano", width: 8 },
        { header: "Cor", key: "cor", width: 12 },
        { header: "Tipo", key: "tipo", width: 15 },
        { header: "Chassi", key: "chassi", width: 20 },
        { header: "Renavam", key: "renavam", width: 15 },
        { header: "Combustível", key: "combustivel", width: 12 },
        { header: "Medição", key: "medicao", width: 12 },
        { header: "Período Troca Óleo", key: "periodoTrocaOleo", width: 15 },
        { header: "Status", key: "status", width: 10 },
        { header: "Km Atual", key: "kmAtual", width: 12 },
        { header: "Km Próx. Troca", key: "kmProxTroca", width: 15 },
        { header: "Criado em", key: "createdAt", width: 20 },
        { header: "Atualizado em", key: "updatedAt", width: 20 },
      ]

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }

      // Adicionar dados
      veiculos.forEach((item) => {
        worksheet.addRow({
          placa: item.placa,
          modelo: item.modelo,
          marca: item.marca,
          ano: item.ano,
          cor: item.cor,
          tipo: item.tipo,
          chassi: item.chassi,
          renavam: item.renavam,
          combustivel: item.combustivel,
          medicao: item.medicao,
          periodoTrocaOleo: item.periodoTrocaOleo || item.periodotrocaoleo || 0,
          status: item.status,
          kmAtual: item.kmAtual || 0,
          kmProxTroca: item.kmProxTroca || 0,
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "",
        })
      })
    })

    // Criar planilha de resumo
    const resumoWorksheet = workbook.addWorksheet("Resumo")
    resumoWorksheet.columns = [
      { header: "Secretaria", key: "secretaria", width: 20 },
      { header: "Total de Veículos", key: "total", width: 15 },
      { header: "Veículos Ativos", key: "ativos", width: 15 },
      { header: "Veículos Inativos", key: "inativos", width: 15 },
    ]

    // Estilizar cabeçalho do resumo
    resumoWorksheet.getRow(1).font = { bold: true }
    resumoWorksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    // Adicionar dados do resumo
    Object.entries(grupos).forEach(([secretaria, veiculos]) => {
      resumoWorksheet.addRow({
        secretaria: secretaria,
        total: veiculos.length,
        ativos: veiculos.filter(v => v.status === "Ativo").length,
        inativos: veiculos.filter(v => v.status === "Inativo").length,
      })
    })

    // Adicionar total geral
    const totalGeral = data.length
    const totalAtivos = data.filter(v => v.status === "Ativo").length
    const totalInativos = data.filter(v => v.status === "Inativo").length

    resumoWorksheet.addRow({
      secretaria: "TOTAL GERAL",
      total: totalGeral,
      ativos: totalAtivos,
      inativos: totalInativos,
    })

    // Estilizar linha de total geral
    const totalRow = resumoWorksheet.getRow(resumoWorksheet.rowCount)
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFE0E0" },
    }

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
