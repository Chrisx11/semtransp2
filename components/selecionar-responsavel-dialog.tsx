"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { getColaboradores, type Colaborador } from "@/services/colaborador-service"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SelecionarResponsavelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (colaborador: Colaborador) => void
  filtroFuncao?: string // Novo parâmetro para filtrar por função
}

export function SelecionarResponsavelDialog({
  open,
  onOpenChange,
  onSelect,
  filtroFuncao,
}: SelecionarResponsavelDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [filteredColaboradores, setFilteredColaboradores] = useState<Colaborador[]>([])

  // Carregar colaboradores
  useEffect(() => {
    if (open) {
      setSearchTerm("")
      Promise.resolve(getColaboradores()).then((allColaboradoresRaw) => {
        const allColaboradores = Array.isArray(allColaboradoresRaw) ? allColaboradoresRaw : []
        // Aplicar filtro de função se fornecido
        const filteredByFunction = filtroFuncao
          ? allColaboradores.filter((c) => c.funcao && c.funcao.toLowerCase() === filtroFuncao.toLowerCase())
          : allColaboradores

        setColaboradores(filteredByFunction)
        setFilteredColaboradores(filteredByFunction)
      })
    }
  }, [open, filtroFuncao])

  // Filtrar colaboradores com base no termo de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredColaboradores(Array.isArray(colaboradores) ? colaboradores : [])
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = (Array.isArray(colaboradores) ? colaboradores : []).filter(
      (colaborador) =>
        colaborador.nome.toLowerCase().includes(lowerSearchTerm) ||
        (colaborador.funcao && colaborador.funcao.toLowerCase().includes(lowerSearchTerm)) ||
        (colaborador.secretaria && colaborador.secretaria.toLowerCase().includes(lowerSearchTerm)),
    )

    setFilteredColaboradores(filtered)
  }, [searchTerm, colaboradores])

  // Selecionar um colaborador
  const handleSelect = (colaborador: Colaborador) => {
    onSelect(colaborador)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Selecionar Responsável</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar colaborador..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="h-[300px] rounded-md border p-2">
          {Array.isArray(filteredColaboradores) && filteredColaboradores.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(filteredColaboradores) ? filteredColaboradores : []).map((colaborador) => (
                <div
                  key={colaborador.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleSelect(colaborador)}
                >
                  <div>
                    <div className="font-medium">{colaborador.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {colaborador.funcao} - {colaborador.secretaria}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Selecionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
