"use client"

import type React from "react"

import { useState, useEffect, forwardRef } from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { usePhoneMask } from "@/hooks/use-phone-mask"

// Explicitly omit children from the props
type PhoneInputProps = Omit<InputProps, "onChange" | "children" | "value"> & {
  value: string
  onChange: (value: string) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({ value, onChange, ...props }, ref) => {
  const { formatPhone } = usePhoneMask()
  const [inputValue, setInputValue] = useState("")

  // Inicializa o valor formatado quando o componente é montado
  useEffect(() => {
    if (value) {
      const { formattedValue } = formatPhone(value)
      setInputValue(formattedValue)
    }
  }, [value, formatPhone])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const { formattedValue, rawValue } = formatPhone(newValue)

    setInputValue(formattedValue)
    onChange(rawValue) // Passa apenas os números para o formulário
  }

  // Ensure we're not passing any children prop
  const safeProps = { ...props }
  if ("children" in safeProps) {
    delete safeProps.children
  }

  return (
    <Input
      ref={ref}
      type="tel"
      value={inputValue}
      onChange={handleChange}
      placeholder="(00) 00000-0000"
      {...safeProps}
    />
  )
})

PhoneInput.displayName = "PhoneInput"
