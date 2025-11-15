"use client"

import React, { useMemo, useState } from "react"
import type { OrdemServico } from "@/services/ordem-servico-service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MoreVertical, PlusCircle, Search, Wrench, Package, ShoppingCart, CheckCircle } from "lucide-react"
import { MobileBackButton } from "@/components/mobile-back-button"

const StatusBadge = ({ status }: { status: string }) => {
  let badgeClasses = ""

  switch (status) {
    case "Aguardando Mecânico":
      badgeClasses = "bg-[#6B7280] text-white hover:bg-[#6B7280]/80"; break
    case "Em Análise":
      badgeClasses = "bg-[#D97706] text-white hover:bg-[#D97706]/80"; break
    case "Aguardando aprovação":
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"; break
    case "Aguardando OS":
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"; break
    case "Aguardando Fornecedor":
      badgeClasses = "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/80"; break
    case "Serviço Externo":
      badgeClasses = "bg-[#047857] text-white hover:bg-[#047857]/80"; break
    case "Comprar na Rua":
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#EF4444]/80"; break
    case "Fila de Serviço":
      badgeClasses = "bg-[#06B6D4] text-white hover:bg-[#06B6D4]/80"; break
    case "Em Serviço":
    case "Em andamento":
      badgeClasses = "bg-[#10B981] text-white hover:bg-[#10B981]/80"; break
    case "Finalizado":
      badgeClasses = "bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/80"; break
    case "Em Aprovação":
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"; break
    default:
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80"
  }

  return <Badge className={`text-xs px-2 py-0.5 mt-0.5 mb-1 ${badgeClasses}`}>{status}</Badge>
}

const getSetorAtualDoHistorico = (historico: any[] | undefined): "Oficina" | "Almoxarifado" | "Compras" | "Finalizado" => {
  if (!historico || historico.length === 0) {
    return "Oficina"
  }

  const setoresValidos = ["Oficina", "Almoxarifado", "Compras"]

  for (let i = historico.length - 1; i >= 0; i--) {
    const evento = historico[i]
    if (evento.para && setoresValidos.includes(evento.para)) {
      return evento.para
    }
    if (evento.de && setoresValidos.includes(evento.de)) {
      return evento.de
    }
  }

  return "Oficina"
}

const actionsBySetor: Record<string, { label: string; action: string }[]> = {
  Oficina: [
    { action: "visualizar", label: "Visualizar" },
    { action: "registrar_observacao", label: "Registrar observação" },
    { action: "editar", label: "Editar" },
    { action: "enviar_almoxarifado", label: "Enviar p/ Almoxarifado" },
    { action: "aguardando_mecanico", label: "Status: Aguardando Mecânico" },
    { action: "fila_servico", label: "Status: Fila de Serviço" },
    { action: "em_servico", label: "Status: Em Serviço" },
    { action: "finalizado", label: "Status: Finalizado" },
    { action: "excluir", label: "Excluir" },
  ],
  Almoxarifado: [
    { action: "visualizar", label: "Visualizar" },
    { action: "registrar_observacao", label: "Registrar observação" },
    { action: "editar", label: "Editar" },
    { action: "enviar_compras", label: "Enviar p/ Compras" },
    { action: "retornar_oficina", label: "Retornar p/ Oficina" },
  ],
  Compras: [
    { action: "visualizar", label: "Visualizar" },
    { action: "registrar_observacao", label: "Registrar observação" },
    { action: "editar", label: "Editar" },
    { action: "retornar_almoxarifado_compras", label: "Retornar p/ Almoxarifado" },
  ],
  Finalizado: [
    { action: "visualizar", label: "Visualizar" },
    { action: "reabrir_os", label: "Reabrir OS" },
  ],
}

const setorFilters: { id: "Oficina" | "Almoxarifado" | "Compras" | "Finalizado"; label: string; icon: JSX.Element }[] = [
  { id: "Oficina", label: "Oficina", icon: <Wrench className="h-4 w-4" /> },
  { id: "Almoxarifado", label: "Almoxarifado", icon: <Package className="h-4 w-4" /> },
  { id: "Compras", label: "Compras", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "Finalizado", label: "Finalizadas", icon: <CheckCircle className="h-4 w-4" /> },
]

interface OrdemServicoMobileViewProps {
  ordens: OrdemServico[]
  loading: boolean
  onNovaOS: () => void
  onAction: (action: string, ordemId: string) => void
}

export function OrdemServicoMobileView({ ordens, loading, onNovaOS, onAction }: OrdemServicoMobileViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSetor, setSelectedSetor] = useState<"Oficina" | "Almoxarifado" | "Compras" | "Finalizado" | "all">("all")

  const termo = searchTerm.trim().toLowerCase()

  const filteredOrdens = useMemo(() => {
    return ordens.filter((ordem) => {
      const setorAtual = ordem.status === "Finalizado"
        ? "Finalizado"
        : getSetorAtualDoHistorico(ordem.historico as any[] | undefined)

      if (selectedSetor !== "all" && setorAtual !== selectedSetor) {
        return false
      }

      const matchesTerm =
        ordem.numero.toLowerCase().includes(termo) ||
        ordem.veiculoInfo.toLowerCase().includes(termo) ||
        (ordem.solicitanteInfo || "").toLowerCase().includes(termo)

      if (termo) {
        return matchesTerm
      }

      if (ordem.status === "Finalizado" && selectedSetor !== "Finalizado") {
        return false
      }

      return true
    })
  }, [ordens, termo, selectedSetor])

  return (
    <div className="p-2 relative pb-24">
      <div className="mb-4">
        <MobileBackButton />
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar número, veículo ou solicitante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex justify-center flex-wrap gap-x-6 gap-y-3 mb-4">
        {setorFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedSetor === filter.id ? "default" : "outline"}
            onClick={() => setSelectedSetor((prev) => (prev === filter.id ? "all" : filter.id))}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-full"
          >
            {filter.icon}
            <span className="sr-only">{filter.label}</span>
          </Button>
        ))}
      </div>

      <Button
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg flex items-center gap-2 px-5 py-3 text-base"
        style={{ minWidth: 112 }}
        onClick={onNovaOS}
      >
        <PlusCircle className="h-5 w-5 mr-1" /> Nova Ordem
      </Button>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrdens.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">Nenhuma ordem encontrada.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOrdens.map((ordem) => {
            const setorAtual = ordem.status === "Finalizado"
              ? "Finalizado"
              : getSetorAtualDoHistorico(ordem.historico as any[] | undefined)

            const setorActions = actionsBySetor[setorAtual] || actionsBySetor.Oficina

            return (
              <Card
                key={ordem.id}
                className="rounded-lg border border-primary/70 shadow-sm px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1" onClick={() => onAction("visualizar", ordem.id)}>
                    <div className="font-semibold text-base">OS {ordem.numero}</div>
                    <StatusBadge status={ordem.status} />
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Setor atual: <span className="font-semibold text-foreground">{setorAtual}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{ordem.data}</div>
                    <div className="text-sm mt-1">Veículo: {ordem.veiculoInfo}</div>
                    <div className="text-xs">Solicitante: {ordem.solicitanteInfo}</div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {setorActions.map(({ action, label }) => (
                        <DropdownMenuItem
                          key={action}
                          onSelect={(event) => {
                            event.preventDefault()
                            onAction(action, ordem.id)
                          }}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
