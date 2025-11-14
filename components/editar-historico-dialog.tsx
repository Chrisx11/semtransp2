"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, GaugeIcon, ShellIcon as OilCanIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import type { HistoricoItem } from "./historico-trocas-dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface EditarHistoricoDialogProps {
  isOpen: boolean
  onClose: () => void
  item: HistoricoItem
  onConfirm: (item: HistoricoItem) => void
}

export function EditarHistoricoDialog({ isOpen, onClose, item, onConfirm }: EditarHistoricoDialogProps) {
  const { toast } = useToast()
  // Converter a string de data para objeto Date
  const parseDate = (dateString: string) => {
    // Verificar se dateString é válido
    if (!dateString) {
      return new Date(); // Retornar data atual se a string for nula/vazia
    }
    
    // Verificar se está no formato ISO (YYYY-MM-DD)
    if (dateString.includes("-")) {
      return new Date(dateString);
    }
    
    // Verificar formato DD/MM/YYYY
    const parts = dateString.split("/").map(Number);
    if (parts.length !== 3) {
      return new Date(); // Retornar data atual se o formato for inválido
    }
    
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  const [data, setData] = useState<Date>(parseDate(item.data))
  const [kmAtual, setKmAtual] = useState(
    typeof item.kmAtual === 'number' && !isNaN(item.kmAtual) ? item.kmAtual.toString() : ""
  )
  const [kmAnterior, setKmAnterior] = useState(
    typeof item.kmAnterior === 'number' && !isNaN(item.kmAnterior) ? item.kmAnterior.toString() : ""
  )
  const [kmProxTroca, setKmProxTroca] = useState(
    typeof item.kmProxTroca === 'number' && !isNaN(item.kmProxTroca) ? item.kmProxTroca.toString() : ""
  )
  const [observacao, setObservacao] = useState(item.observacao || "")
  const [loading, setLoading] = useState(false)

  // Formatar data para o formato DD/MM/YYYY
  const formatarData = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "";
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  }

  // Formatar data para o formato ISO (YYYY-MM-DD)
  const formatarDataISO = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return "";
    return format(date, "yyyy-MM-dd")
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      const kmAtualNum = Number.parseInt(kmAtual)
      const kmAnteriorNum = kmAnterior ? Number.parseInt(kmAnterior) : undefined
      const kmProxTrocaNum = kmProxTroca ? Number.parseInt(kmProxTroca) : undefined

      // Validação básica
      if (isNaN(kmAtualNum) || kmAtualNum <= 0) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "A quilometragem atual deve ser um número válido maior que zero",
        })
        return
      }

      if (kmAnteriorNum !== undefined && isNaN(kmAnteriorNum)) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "A quilometragem anterior deve ser um número válido",
        })
        return
      }

      if (kmProxTrocaNum !== undefined && isNaN(kmProxTrocaNum)) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "A quilometragem da próxima troca deve ser um número válido",
        })
        return
      }

      // Atualizar registro diretamente no Supabase
      const { error } = await supabase
        .from("trocas_oleo")
        .update({
          data_troca: formatarDataISO(data),
          km_anterior: kmAnteriorNum || 0,
          km_atual: kmAtualNum,
          km_proxima_troca: kmProxTrocaNum || kmAtualNum,
          observacao: observacao.trim() || null,
        })
        .eq("id", item.id)
      
      if (error) {
        console.error("Erro ao atualizar registro:", error)
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: error.message,
        })
        throw error
      }
      
      // Criar item atualizado para atualizar a UI
      const itemAtualizado: HistoricoItem = {
        ...item,
        data: formatarData(data),
        kmAtual: kmAtualNum,
        kmAnterior: kmAnteriorNum || 0,
        kmProxTroca: kmProxTrocaNum,
        observacao: observacao.trim() || undefined,
      }

      toast({
        title: "Registro atualizado",
        description: "As alterações foram salvas com sucesso",
        className: "bg-green-50 border-green-200 text-green-900",
      })

      onConfirm(itemAtualizado)
    } catch (error) {
      console.error("Erro ao atualizar registro:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {item.tipo === "Troca de Óleo" ? <OilCanIcon className="h-5 w-5 text-primary" /> : <GaugeIcon className="h-5 w-5 text-primary" />}
            <DialogTitle className="text-xl">Editar Registro</DialogTitle>
          </div>
          <DialogDescription>
            Edite as informações do registro de {item.tipo.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              Data do registro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !data && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data && !isNaN(data.getTime()) ? format(data, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={(date) => date && setData(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Separator className="my-2" />

        <div className="space-y-4">
          {item.tipo === "Troca de Óleo" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kmAtual" className="text-sm font-medium">
                    Quilometragem na troca
                  </Label>
                  <div className="relative">
                    <Input
                      id="kmAtual"
                      type="number"
                      value={kmAtual}
                      onChange={(e) => setKmAtual(e.target.value)}
                      className="pr-8"
                      min={1}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      km
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kmProxTroca" className="text-sm font-medium">
                    Próxima troca em
                  </Label>
                  <div className="relative">
                    <Input
                      id="kmProxTroca"
                      type="number"
                      value={kmProxTroca}
                      onChange={(e) => setKmProxTroca(e.target.value)}
                      className="pr-8"
                      min={Number.parseInt(kmAtual) || 0 + 1000}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      km
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kmAnterior" className="text-sm font-medium">
                    Quilometragem anterior
                  </Label>
                  <div className="relative">
                    <Input
                      id="kmAnterior"
                      type="number"
                      value={kmAnterior}
                      onChange={(e) => setKmAnterior(e.target.value)}
                      className="pr-8"
                      min={1}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      km
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="kmAtual" className="text-sm font-medium">
                    Nova quilometragem
                  </Label>
                  <div className="relative">
                    <Input
                      id="kmAtual"
                      type="number"
                      value={kmAtual}
                      onChange={(e) => setKmAtual(e.target.value)}
                      className="pr-8"
                      min={kmAnterior ? Number.parseInt(kmAnterior) + 1 : 1}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      km
                    </span>
                  </div>
                </div>
              </div>

              {kmAnterior && kmAtual && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md flex items-center justify-between">
                  <span className="text-sm font-medium">Aumento de quilometragem:</span>
                  <span className="font-bold">
                    + {(Number(kmAtual) - Number(kmAnterior)).toLocaleString()} km
                  </span>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao" className="text-sm font-medium">
              Observações
            </Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Observações opcionais sobre o serviço realizado..."
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="sm:mr-auto">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="gap-2"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
            ) : (
              item.tipo === "Troca de Óleo" ? <OilCanIcon className="h-4 w-4" /> : <GaugeIcon className="h-4 w-4" />
            )}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
