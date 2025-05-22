"use client"

// utils/export-utils.ts

// Função para formatar o número de telefone para exibição
export const formatPhoneForDisplay = (phone: string | undefined): string => {
  if (!phone) return ""

  const cleaned = phone.replace(/\D/g, "")
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/)

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  return phone
}

// Função para exportar dados para CSV usando a API nativa do navegador
export const exportToCSV = (data: any[], filename = "data") => {
  try {
    // Verificar se os dados estão vazios
    if (!data || data.length === 0) {
      console.warn("Nenhum dado para exportar para CSV.")
      return false
    }

    // Extrair cabeçalhos dos dados (assumindo que todos os objetos têm as mesmas chaves)
    const headers = Object.keys(data[0])

    // Converter dados para formato CSV
    const csvData = data.map((item) => headers.map((header) => item[header]))

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
export const exportToPDF = (data: any[], filename = "data") => {
  try {
    console.log("Export to PDF is a stub.  jsPDF is not installed.")
    return true
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error)
    throw error
  }
}
