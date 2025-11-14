"use client"

import { useState, useEffect } from "react"
import { BellRing, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function SoundToggle() {
  const [somAtivado, setSomAtivado] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  // Evita problemas de hidratação
  useEffect(() => {
    setMounted(true)
    // Recuperar preferência de som do localStorage
    const somPreferencia = localStorage.getItem('notificacoes_som_ativado')
    if (somPreferencia !== null) {
      setSomAtivado(somPreferencia === 'true')
    }
  }, [])

  const toggleSom = () => {
    const novoEstado = !somAtivado
    setSomAtivado(novoEstado)
    // Salvar preferência no localStorage
    localStorage.setItem('notificacoes_som_ativado', novoEstado ? 'true' : 'false')
    
    // Mostrar toast com mensagem
    toast({
      title: novoEstado ? "Notificações sonoras ativadas" : "Notificações sonoras desativadas",
      description: novoEstado 
        ? "Você receberá alertas sonoros para novas ordens de serviço" 
        : "Você não receberá alertas sonoros",
      duration: 3000,
    })
    
    // Disparar evento customizado para que o global-notifications possa reagir
    window.dispatchEvent(new CustomEvent('sound-toggle-changed', { detail: { enabled: novoEstado } }))
  }

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSom}
      className="relative h-9 w-9 hover:bg-accent/50"
      aria-label={somAtivado ? "Desativar notificações sonoras" : "Ativar notificações sonoras"}
      title={somAtivado ? "Desativar notificações sonoras" : "Ativar notificações sonoras"}
    >
      {somAtivado ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
    </Button>
  )
}

