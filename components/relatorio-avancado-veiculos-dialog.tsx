"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, FileSpreadsheet } from "lucide-react"
import type { Veiculo } from "@/services/veiculo-service"
import { exportToPDF, exportToExcel } from "@/utils/export-veiculos-utils"

interface RelatorioAvancadoVeiculosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  veiculos: Veiculo[]
  onExport?: () => void
}

type SortField = "placa" | "modelo" | "marca" | "ano" | "tipo" | "secretaria" | "status" | "kmAtual" | "kmProxTroca" | null
type SortDirection = "asc" | "desc"

// Lista de secretarias
const secretarias = [
  "Semgov",
  "Semplad",
  "Semfaz",
  "Semeduc",
  "Semusa",
  "Semathrab",
  "Semosp",
  "Semalp",
  "Semaev",
  "Semci",
  "Semgap",
  "Semctel",
  "Semseg",
  "Semtransp",
  "Progem",
]

// Lista de tipos de veículos
const tiposVeiculos = [
  "Carro",
  "Caminhão",
  "Ônibus",
  "Van",
  "Motocicleta",
  "Trator",
  "Máquina Pesada",
  "Ambulância",
  "Outro",
]

export function RelatorioAvancadoVeiculosDialog({
  open,
  onOpenChange,
  veiculos,
  onExport,
}: RelatorioAvancadoVeiculosDialogProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [secretariaFilter, setSecretariaFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [marcaFilter, setMarcaFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Obter marcas únicas dos veículos
  const marcas = Array.from(new Set(veiculos.map((v) => v.marca).filter(Boolean))) as string[]
  marcas.sort()

  // Filtrar e ordenar dados
  const getFilteredAndSortedData = (): Veiculo[] => {
    let filtered = [...veiculos]

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    // Filtro de secretaria
    if (secretariaFilter !== "all") {
      filtered = filtered.filter((v) => v.secretaria === secretariaFilter)
    }

    // Filtro de tipo
    if (tipoFilter !== "all") {
      filtered = filtered.filter((v) => v.tipo === tipoFilter)
    }

    // Filtro de marca
    if (marcaFilter !== "all") {
      filtered = filtered.filter((v) => v.marca === marcaFilter)
    }

    // Aplicar ordenação
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: string | number = sortField === "kmAtual" || sortField === "kmProxTroca" || sortField === "ano"
          ? (a[sortField] as number) ?? 0
          : String(a[sortField] ?? "").toLowerCase()
        
        let bValue: string | number = sortField === "kmAtual" || sortField === "kmProxTroca" || sortField === "ano"
          ? (b[sortField] as number) ?? 0
          : String(b[sortField] ?? "").toLowerCase()

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
        }
      })
    }

    return filtered
  }

  const handleExport = (format: "pdf" | "excel") => {
    try {
      const data = getFilteredAndSortedData()
      
      if (data.length === 0) {
        alert("Não há dados para exportar com os filtros selecionados.")
        return
      }

      if (format === "pdf") {
        exportToPDF(data, "relatorio_avancado_veiculos")
      } else {
        exportToExcel(data, "relatorio_avancado_veiculos")
      }

      if (onExport) {
        onExport()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error)
      alert(`Erro ao exportar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    }
  }

  const filteredCount = getFilteredAndSortedData().length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Avançado de Veículos</DialogTitle>
          <DialogDescription>
            Configure os filtros e ordenação para gerar um relatório personalizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Filtros */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Filtros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro de Status */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Secretaria */}
              <div className="space-y-2">
                <Label htmlFor="secretaria-filter">Secretaria</Label>
                <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
                  <SelectTrigger id="secretaria-filter">
                    <SelectValue placeholder="Selecione a secretaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {secretarias.map((sec) => (
                      <SelectItem key={sec} value={sec}>
                        {sec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo-filter">Tipo de Veículo</Label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger id="tipo-filter">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposVeiculos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Marca */}
              <div className="space-y-2">
                <Label htmlFor="marca-filter">Marca</Label>
                <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                  <SelectTrigger id="marca-filter">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {marcas.map((marca) => (
                      <SelectItem key={marca} value={marca}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Ordenação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Ordenação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo de Ordenação */}
              <div className="space-y-2">
                <Label htmlFor="sort-field">Ordenar por</Label>
                <Select
                  value={sortField || "none"}
                  onValueChange={(value) => setSortField(value === "none" ? null : (value as SortField))}
                >
                  <SelectTrigger id="sort-field">
                    <SelectValue placeholder="Selecione o campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem ordenação</SelectItem>
                    <SelectItem value="placa">Placa</SelectItem>
                    <SelectItem value="modelo">Modelo</SelectItem>
                    <SelectItem value="marca">Marca</SelectItem>
                    <SelectItem value="ano">Ano</SelectItem>
                    <SelectItem value="tipo">Tipo</SelectItem>
                    <SelectItem value="secretaria">Secretaria</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="kmAtual">Km Atual</SelectItem>
                    <SelectItem value="kmProxTroca">Km Próxima Troca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Direção de Ordenação */}
              <div className="space-y-2">
                <Label htmlFor="sort-direction">Direção</Label>
                <Select
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as SortDirection)}
                  disabled={!sortField}
                >
                  <SelectTrigger id="sort-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente (A-Z, 0-9)</SelectItem>
                    <SelectItem value="desc">Decrescente (Z-A, 9-0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações do Relatório */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{filteredCount}</strong> veículo{filteredCount !== 1 ? "s" : ""} serão incluído{filteredCount !== 1 ? "s" : ""} no relatório.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={filteredCount === 0}
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              onClick={() => handleExport("excel")}
              disabled={filteredCount === 0}
              className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

