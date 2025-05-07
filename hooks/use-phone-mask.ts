"use client"

import { useState, useCallback } from "react"

export function usePhoneMask() {
  const [formattedValue, setFormattedValue] = useState("")

  // Função para aplicar a máscara de telefone
  const formatPhone = useCallback((value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "")

    // Limita a 11 dígitos (DDD + 9 dígitos para celular)
    const limitedValue = numericValue.slice(0, 11)

    let formattedPhone = ""

    if (limitedValue.length <= 2) {
      // Apenas DDD parcial
      formattedPhone = limitedValue
    } else if (limitedValue.length <= 6) {
      // Telefone fixo parcial: (XX) XXXX
      formattedPhone = `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`
    } else if (limitedValue.length <= 10) {
      // Telefone fixo completo: (XX) XXXX-XXXX
      formattedPhone = `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`
    } else {
      // Celular: (XX) XXXXX-XXXX
      formattedPhone = `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`
    }

    setFormattedValue(formattedPhone)
    return { formattedValue: formattedPhone, rawValue: limitedValue }
  }, [])

  return { formatPhone, formattedValue }
}
