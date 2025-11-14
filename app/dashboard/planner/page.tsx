"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Loader2, CheckCircle2, Circle } from "lucide-react"
import { CompromissoDialog } from "./components/compromisso-dialog"
import { useToast } from "@/hooks/use-toast"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  type Compromisso,
  getCompromissosPorIntervaloSupabase,
  addCompromissoSupabase,
  updateCompromissoSupabase,
  deleteCompromissoSupabase,
  toggleConcluidoCompromissoSupabase,
  migrateLocalStorageToSupabase,
} from "@/services/compromisso-service"

export default function PlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Gerar horários de 07:00 às 16:00
  const horarios = useMemo(() => {
    const horas: string[] = []
    for (let i = 7; i <= 16; i++) {
      horas.push(`${i.toString().padStart(2, "0")}:00`)
    }
    return horas
  }, [])

  // Gerar dias da semana
  const diasDaSemana = useMemo(() => {
    const dias: Date[] = []
    for (let i = 0; i < 7; i++) {
      dias.push(addDays(currentWeek, i))
    }
    return dias
  }, [currentWeek])

  // Carregar compromissos do Supabase
  const loadCompromissos = async () => {
    setIsLoading(true)
    try {
      // Primeiro, tentar migrar dados do localStorage se existirem
      await migrateLocalStorageToSupabase()

      // Calcular intervalo da semana atual
      const dataInicio = format(currentWeek, "yyyy-MM-dd")
      const dataFim = format(addDays(currentWeek, 6), "yyyy-MM-dd")

      // Buscar compromissos da semana atual
      const compromissosCarregados = await getCompromissosPorIntervaloSupabase(dataInicio, dataFim)
      setCompromissos(compromissosCarregados)
    } catch (error) {
      console.error("Erro ao carregar compromissos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar compromissos. Tente recarregar a página.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar compromissos quando a semana mudar
  useEffect(() => {
    loadCompromissos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek])

  // Migrar dados na primeira carga
  useEffect(() => {
    migrateLocalStorageToSupabase().catch((error) => {
      console.error("Erro ao migrar dados:", error)
    })
  }, [])

  // Navegar para semana anterior
  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  // Navegar para próxima semana
  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  // Ir para semana atual
  const goToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }

  // Obter compromissos para um dia e hora específicos
  const getCompromissosPorDiaHora = (dia: Date, hora: string): Compromisso[] => {
    const dataFormatada = format(dia, "yyyy-MM-dd")
    // Formatar hora para comparação (HH:MM ou HH:MM:SS)
    const horaFormatada = hora.length === 5 ? `${hora}:00` : hora
    
    return compromissos.filter((compromisso) => {
      const compromissoHora = compromisso.hora.length === 5 ? `${compromisso.hora}:00` : compromisso.hora
      return compromisso.data === dataFormatada && compromissoHora.startsWith(hora)
    })
  }

  // Abrir diálogo para novo compromisso
  const handleNovoCompromisso = (dia: Date, hora: string) => {
    setSelectedDate(format(dia, "yyyy-MM-dd"))
    setSelectedTime(hora)
    setEditingCompromisso(null)
    setDialogOpen(true)
  }

  // Abrir diálogo para editar compromisso
  const handleEditarCompromisso = (compromisso: Compromisso) => {
    setEditingCompromisso(compromisso)
    // Formatar data (pode vir como YYYY-MM-DD ou ISO string)
    const dataFormatada = compromisso.data.includes("T") 
      ? compromisso.data.split("T")[0] 
      : compromisso.data
    // Formatar hora (pode vir como HH:MM:SS ou HH:MM)
    const horaFormatada = compromisso.hora.length > 5 
      ? compromisso.hora.substring(0, 5) 
      : compromisso.hora
    setSelectedDate(dataFormatada)
    setSelectedTime(horaFormatada)
    setDialogOpen(true)
  }

  // Salvar compromisso
  const handleSaveCompromisso = async (compromisso: Compromisso) => {
    try {
      // Validar que não é um evento
      if (!compromisso || typeof compromisso !== 'object' || compromisso instanceof Event) {
        console.error("Erro: handleSaveCompromisso recebeu um valor inválido:", compromisso)
        toast({
          title: "Erro",
          description: "Erro ao salvar compromisso. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Validar campos obrigatórios
      if (!compromisso.titulo || !compromisso.data || !compromisso.hora) {
        console.error("Erro: Compromisso com campos obrigatórios faltando:", compromisso)
        toast({
          title: "Erro",
          description: "Dados do compromisso incompletos.",
          variant: "destructive",
        })
        return
      }

      // Converter data de ISO string para formato DATE se necessário
      let dataFormatada = compromisso.data
      if (dataFormatada.includes("T")) {
        dataFormatada = dataFormatada.split("T")[0]
      }

      if (editingCompromisso && editingCompromisso.id === compromisso.id) {
        // Editar compromisso existente - preservar status de concluído
        const compromissoAtualizado = await updateCompromissoSupabase(compromisso.id, {
          titulo: compromisso.titulo,
          descricao: compromisso.descricao,
          data: dataFormatada,
          hora: compromisso.hora,
          duracao: compromisso.duracao,
          cor: compromisso.cor,
          concluido: editingCompromisso.concluido || false, // Preservar status de concluído
        })
        
        // Recarregar compromissos do Supabase para garantir sincronização
        await loadCompromissos()
        
        toast({
          title: "Sucesso",
          description: "Compromisso atualizado com sucesso.",
        })
      } else {
        // Novo compromisso
        const novoCompromisso = await addCompromissoSupabase({
          titulo: compromisso.titulo,
          descricao: compromisso.descricao,
          data: dataFormatada,
          hora: compromisso.hora,
          duracao: compromisso.duracao,
          cor: compromisso.cor,
        })
        
        // Recarregar compromissos do Supabase para garantir sincronização
        await loadCompromissos()
        
        toast({
          title: "Sucesso",
          description: "Compromisso criado com sucesso.",
        })
      }
      
      setDialogOpen(false)
      setEditingCompromisso(null)
    } catch (error) {
      console.error("Erro ao salvar compromisso:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar compromisso.",
        variant: "destructive",
      })
    }
  }

  // Excluir compromisso
  const handleDeleteCompromisso = async (id: string) => {
    try {
      // Validar que não é um evento
      if (!id || typeof id !== 'string' || id instanceof Event) {
        console.error("Erro: handleDeleteCompromisso recebeu um valor inválido:", id)
        toast({
          title: "Erro",
          description: "Erro ao excluir compromisso.",
          variant: "destructive",
        })
        return
      }

      // Excluir no Supabase
      const success = await deleteCompromissoSupabase(id)
      
      if (!success) {
        throw new Error("Falha ao excluir compromisso no banco de dados")
      }
      
      // Recarregar compromissos do Supabase para garantir sincronização
      await loadCompromissos()
      
      toast({
        title: "Sucesso",
        description: "Compromisso excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir compromisso:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir compromisso.",
        variant: "destructive",
      })
    }
  }

  // Marcar compromisso como concluído ou não concluído
  const handleToggleConcluido = async (compromisso: Compromisso, e: React.MouseEvent) => {
    e.stopPropagation() // Impede que o clique abra o diálogo de edição
    
    try {
      const novoStatus = !compromisso.concluido
      
      await toggleConcluidoCompromissoSupabase(compromisso.id, novoStatus)
      
      // Recarregar compromissos do Supabase para garantir sincronização
      await loadCompromissos()
      
      toast({
        title: "Sucesso",
        description: novoStatus 
          ? "Compromisso marcado como concluído." 
          : "Compromisso marcado como não concluído.",
      })
    } catch (error) {
      console.error("Erro ao atualizar status do compromisso:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status do compromisso.",
        variant: "destructive",
      })
    }
  }

  // Obter cor do compromisso
  const getCompromissoCor = (compromisso: Compromisso): string => {
    return compromisso.cor || "bg-blue-500"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {format(currentWeek, "d 'de' MMMM", { locale: ptBR })}
              {" - "}
              {format(addDays(currentWeek, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextWeek}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToCurrentWeek}
            className="h-9"
          >
            Hoje
          </Button>
        </div>
      </div>

      {/* Grid do planner */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Cabeçalho dos dias */}
              <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
                <div className="p-4 border-r font-semibold text-sm text-muted-foreground">
                  Horário
                </div>
                {diasDaSemana.map((dia, index) => (
                  <div
                    key={index}
                    className={`p-4 border-r text-center ${
                      isSameDay(dia, new Date())
                        ? "bg-primary/10 font-semibold"
                        : ""
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {format(dia, "EEE", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(dia, "d/M", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Linhas de horários */}
              <div className="divide-y">
                {horarios.map((hora, horaIndex) => (
                  <div key={horaIndex} className="grid grid-cols-8">
                    {/* Coluna de horário */}
                    <div className="p-4 border-r bg-muted/30 text-sm font-medium text-muted-foreground">
                      {hora}
                    </div>

                    {/* Colunas dos dias */}
                    {diasDaSemana.map((dia, diaIndex) => {
                      const compromissosNoSlot = getCompromissosPorDiaHora(dia, hora)
                      
                      return (
                        <div
                          key={diaIndex}
                          className={`p-2 border-r min-h-[80px] relative ${
                            isSameDay(dia, new Date()) ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="space-y-1">
                            {compromissosNoSlot.map((compromisso) => {
                              // Converter cor para CSS se necessário
                              const corStyle = compromisso.cor?.startsWith("#") 
                                ? { backgroundColor: compromisso.cor } 
                                : compromisso.cor?.startsWith("bg-")
                                ? {}
                                : compromisso.cor
                                ? { backgroundColor: compromisso.cor }
                                : {}
                              
                              const isConcluido = compromisso.concluido === true
                              
                              return (
                                <div
                                  key={compromisso.id}
                                  onClick={() => handleEditarCompromisso(compromisso)}
                                  className={`${compromisso.cor?.startsWith("bg-") ? getCompromissoCor(compromisso) : ""} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity relative group ${
                                    isConcluido ? "opacity-60" : ""
                                  }`}
                                  style={corStyle}
                                >
                                  <div className="flex items-start gap-2">
                                    <button
                                      onClick={(e) => handleToggleConcluido(compromisso, e)}
                                      className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                                      title={isConcluido ? "Marcar como não concluído" : "Marcar como concluído"}
                                    >
                                      {isConcluido ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-200 hover:text-green-100" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-white/70 hover:text-white" />
                                      )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className={`font-semibold truncate ${isConcluido ? "line-through" : ""}`}>
                                        {compromisso.titulo}
                                      </div>
                                      {compromisso.descricao && (
                                        <div className={`text-xs opacity-90 truncate ${isConcluido ? "line-through" : ""}`}>
                                          {compromisso.descricao}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {compromissosNoSlot.length === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-full min-h-[60px] text-muted-foreground hover:text-foreground opacity-0 hover:opacity-100 transition-opacity"
                                onClick={() => handleNovoCompromisso(dia, hora)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de compromisso */}
      <CompromissoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        compromisso={editingCompromisso}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSave={handleSaveCompromisso}
        onDelete={handleDeleteCompromisso}
      />
    </div>
  )
}

