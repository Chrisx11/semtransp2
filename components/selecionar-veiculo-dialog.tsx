"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { Badge } from "@/components/ui/badge"

interface SelecionarVeiculoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (veiculo: Veiculo) => void
}

export function SelecionarVeiculoDialog({ open, onOpenChange, onSelect }: SelecionarVeiculoDialogProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredVeiculos, setFilteredVeiculos] = useState<Veiculo[]>([])

  useEffect(() => {
    if (open) {
      getVeiculosSupabase().then((allVeiculos) => {
        setVeiculos(allVeiculos)
        setFilteredVeiculos(allVeiculos)
      })
    }
  }, [open])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVeiculos(veiculos)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = veiculos.filter(
        (veiculo) =>
          veiculo.placa.toLowerCase().includes(query) ||
          veiculo.modelo.toLowerCase().includes(query) ||
          veiculo.marca.toLowerCase().includes(query) ||
          veiculo.secretaria.toLowerCase().includes(query),
      )
      setFilteredVeiculos(filtered)
    }
  }, [searchQuery, veiculos])

  const handleSelect = (veiculo: Veiculo) => {
    onSelect(veiculo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Veículo</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa, modelo, marca ou secretaria..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-1 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Secretaria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVeiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum veículo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVeiculos.map((veiculo) => (
                  <TableRow key={veiculo.id}>
                    <TableCell className="font-medium">{veiculo.placa}</TableCell>
                    <TableCell>{veiculo.modelo}</TableCell>
                    <TableCell>{veiculo.marca}</TableCell>
                    <TableCell>{veiculo.secretaria}</TableCell>
                    <TableCell>
                      <Badge variant={veiculo.status === "Ativo" ? "secondary" : "destructive"}>{veiculo.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleSelect(veiculo)}>
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
