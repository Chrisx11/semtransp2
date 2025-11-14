"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Minus, Plus, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Produto } from "@/services/produto-service"
import { SelecionarProdutosDialog } from "./selecionar-produtos-dialog"
import type { HistoricoItem } from "./historico-trocas-dialog"
import { addHistoricoTrocaOleoSupabase, updateVeiculoSupabase } from "@/services/veiculo-service"
import { getColaboradores, type Colaborador } from "@/services/colaborador-service"
import { addSaidaSupabase } from "../services/saida-service"
import { SelecionarResponsavelDialog } from "./selecionar-responsavel-dialog"

interface TrocaOleoDialogProps {
  isOpen: boolean
  onClose: () => void
  veiculo: {
    id: string
    placa: string
    marca: string
    modelo: string
    medicao: "Hodometro" | "Horimetro"
    kmAtual: number
    kmProxTroca: number
    periodoTrocaOleo: number
    historico: HistoricoItem[]
  }
  onSuccess: (veiculoAtualizado: any) => void
}

interface ProdutoSelecionado {
  produto: Produto
  quantidade: number
}

export function TrocaOleoDialog({ isOpen, onClose, veiculo, onSuccess }: TrocaOleoDialogProps) {
  const [activeTab, setActiveTab] = useState("informacoes")
  const [kmAtual, setKmAtual] = useState((veiculo.kmAtual ?? 0).toString())
  const [kmProxTroca, setKmProxTroca] = useState(((veiculo.kmAtual ?? 0) + (veiculo.periodoTrocaOleo || 10000)).toString())
  const [dataInput, setDataInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Estados para a aba de produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([])
  const [isSelectingProducts, setIsSelectingProducts] = useState(false)
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [colaboradorErro, setColaboradorErro] = useState<string | null>(null)
  const [showSelecionarResponsavel, setShowSelecionarResponsavel] = useState(false)

  // Inicializar a data com a data atual formatada
  useEffect(() => {
    const hoje = new Date()
    const dia = hoje.getDate().toString().padStart(2, "0")
    const mes = (hoje.getMonth() + 1).toString().padStart(2, "0")
    const ano = hoje.getFullYear()
    setDataInput(`${dia}/${mes}/${ano}`)
  }, [])

  // Buscar colaboradores ao abrir o dialog
  useEffect(() => {
    if (isOpen) {
      getColaboradores().then(setColaboradores).catch(() => setColaboradores([]))
    }
  }, [isOpen])

  // Função para aplicar máscara de data
  const formatarData = useCallback((value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, "")

    // Limita a 8 dígitos (DD/MM/AAAA)
    const limitedValue = numericValue.slice(0, 8)

    let formattedDate = ""

    if (limitedValue.length <= 2) {
      // Apenas dia
      formattedDate = limitedValue
    } else if (limitedValue.length <= 4) {
      // Dia e mês parcial: DD/MM
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`
    } else {
      // Data completa: DD/MM/AAAA
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4)}`
    }

    return formattedDate
  }, [])

  // Handler para mudança no campo de data
  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatarData(value)
    setDataInput(formattedValue)
  }

  // Efeito para atualizar o kmProxTroca quando o kmAtual mudar
  useEffect(() => {
    if (kmAtual && !isNaN(Number(kmAtual))) {
      const kmAtualNum = Number(kmAtual)
      const periodoTroca = veiculo.periodoTrocaOleo || (veiculo.medicao === "Hodometro" ? 10000 : 500)
      const novoKmProxTroca = (kmAtualNum + periodoTroca).toString()
      if (novoKmProxTroca !== kmProxTroca) {
        setKmProxTroca(novoKmProxTroca)
      }
    }
  }, [kmAtual, veiculo.periodoTrocaOleo, veiculo.medicao, kmProxTroca])

  // Adicionar produtos selecionados do diálogo
  const handleSaveProdutos = (produtos: Produto[]) => {
    // Filtrar produtos que já estão na lista
    const novosProdutos = produtos.filter((produto) => !produtosSelecionados.some((p) => p.produto.id === produto.id))

    // Adicionar novos produtos com quantidade 1
    const novosProdutosSelecionados = [
      ...produtosSelecionados,
      ...novosProdutos.map((produto) => ({ produto, quantidade: 1 })),
    ]

    setProdutosSelecionados(novosProdutosSelecionados)
  }

  // Remover produto da lista de selecionados
  const removerProduto = (id: string) => {
    setProdutosSelecionados(produtosSelecionados.filter((p) => p.produto.id !== id))
  }

  // Alterar quantidade de um produto
  const alterarQuantidade = (id: string, delta: number) => {
    setProdutosSelecionados(
      produtosSelecionados.map((p) => {
        if (p.produto.id === id) {
          const novaQuantidade = p.quantidade + delta
          return novaQuantidade > 0 ? { ...p, quantidade: novaQuantidade } : p
        }
        return p
      }),
    )
  }

  // Gerar ID único para o novo registro de histórico
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
  }

  // Validar data no formato DD/MM/YYYY
  const validarData = (dataStr: string): boolean => {
    // Verificar o formato
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dataStr.match(regex)

    if (!match) return false

    const dia = Number.parseInt(match[1], 10)
    const mes = Number.parseInt(match[2], 10) - 1 // Mês em JS é 0-11
    const ano = Number.parseInt(match[3], 10)

    // Validar limites dos valores
    if (dia < 1 || dia > 31) return false
    if (mes < 0 || mes > 11) return false
    if (ano < 1900 || ano > 2100) return false

    // Criar um objeto Date e verificar se é válido
    const data = new Date(ano, mes, dia)
    return (
      data.getDate() === dia &&
      data.getMonth() === mes &&
      data.getFullYear() === ano
    )
  }

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD
  const toISODate = (dateStr: string): string => {
    if (!validarData(dateStr)) return ""
    const [dia, mes, ano] = dateStr.split('/')
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }

  // Função para validar UUID v4
  function isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar a data antes de prosseguir
    if (!validarData(dataInput)) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const kmAtualNum = Number.parseInt(kmAtual)
    const kmProxTrocaNum = Number.parseInt(kmProxTroca)
    const periodoNum = veiculo.periodoTrocaOleo

    if (isNaN(kmAtualNum) || isNaN(kmProxTrocaNum) || kmAtualNum <= 0 || kmProxTrocaNum <= 0) {
      toast({
        title: "Erro de validação",
        description: `Preencha os campos de KM corretamente.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      await updateVeiculoSupabase(veiculo.id, {
        kmAtual: kmAtualNum,
        kmProxTroca: kmProxTrocaNum,
        periodoTrocaOleo: periodoNum,
      })

      // Converter a data para o formato ISO antes de salvar
      const dataISO = toISODate(dataInput)
      
      await addHistoricoTrocaOleoSupabase({
        data: dataISO,
        tipo: "Troca de Óleo",
        kmatual: kmAtualNum,
        kmproxtroca: kmProxTrocaNum,
        veiculoid: String(veiculo.id),
      })

      toast({
        title: `Troca de óleo registrada`,
        description: `Troca de óleo do veículo ${veiculo.placa} registrada com sucesso.`,
      })
      
      // Disparar eventos para notificar outras páginas da atualização
      window.dispatchEvent(new CustomEvent('veiculo-atualizado', { 
        detail: { veiculoId: veiculo.id, kmAtual: kmAtualNum } 
      }))
      
      // Usar localStorage para notificar outras abas E mesma aba
      const updateData = {
        veiculoId: veiculo.id,
        kmAtual: kmAtualNum,
        timestamp: Date.now()
      }
      
      localStorage.setItem('veiculo-km-atualizado', JSON.stringify(updateData))
      localStorage.setItem('last-veiculo-update', Date.now().toString())
      
      // Remover após um delay para disparar evento storage em outras abas
      setTimeout(() => {
        localStorage.removeItem('veiculo-km-atualizado')
      }, 100)
      
      setIsSubmitting(false)
      onSuccess({ kmAtual: kmAtualNum, kmProxTroca: kmProxTrocaNum, periodoTrocaOleo: periodoNum })
      onClose()
    } catch (err: any) {
      toast({
        title: "Erro ao registrar troca de óleo",
        description: err && err.message ? err.message : "Erro desconhecido ao salvar no banco.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  // Texto para o tipo de medição
  const unidade = veiculo.medicao === "Hodometro" ? "Km" : "Horas"

  const handleOpenChangeProdutos = (open: boolean) => {
    if (open !== isSelectingProducts) {
      setIsSelectingProducts(open)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Troca de Óleo</DialogTitle>
            <DialogDescription>
              Veículo: {veiculo.marca} {veiculo.modelo} - Placa: {veiculo.placa}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informacoes">Informações</TabsTrigger>
              <TabsTrigger value="produtos">Produtos Utilizados</TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                    <Label htmlFor="data" className="text-base font-semibold">Data da Troca</Label>
                    <Input
                      id="data"
                      value={dataInput}
                      onChange={handleDataChange}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kmAtual">{unidade} na Troca</Label>
                    <Input
                      id="kmAtual"
                      type="number"
                      value={kmAtual}
                      onChange={(e) => setKmAtual(e.target.value)}
                      min={veiculo.kmAtual}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {unidade} atual: {(veiculo.kmAtual ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kmProxTroca">{unidade} Próxima Troca</Label>
                    <Input
                      id="kmProxTroca"
                      type="number"
                      value={kmProxTroca}
                      onChange={(e) => setKmProxTroca(e.target.value)}
                      min={Number.parseInt(kmAtual) + (veiculo.medicao === "Hodometro" ? 1000 : 100)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Período recomendado: {veiculo.periodoTrocaOleo || (veiculo.medicao === "Hodometro" ? 10000 : 500)}{" "}
                      {unidade}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="produtos">
              <div className="space-y-4 py-4">
                <div className="flex flex-col gap-4">
                  <Button variant="outline" onClick={() => setIsSelectingProducts(true)}>
                    Selecionar Produtos
                  </Button>
                  {/* Produtos selecionados visualmente */}
                  {produtosSelecionados.length > 0 && (
                    <div className="space-y-2">
                      {produtosSelecionados.map((item) => (
                        <div key={item.produto.id} className="p-3 flex items-center justify-between border rounded-md">
                          <div>
                            <div className="font-medium">{item.produto.descricao}</div>
                            <div className="text-sm text-muted-foreground">{item.produto.categoria}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => alterarQuantidade(item.produto.id, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantidade}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => alterarQuantidade(item.produto.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removerProduto(item.produto.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Campo de seleção de condutor */}
                <div className="space-y-2">
                  <Label>Condutor responsável pela troca</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSelecionarResponsavel(true)}
                      disabled={colaboradores.length === 0 || produtosSelecionados.length === 0}
                    >
                      {colaboradorSelecionado ? `Responsável: ${colaboradorSelecionado.nome}` : "Selecionar responsável"}
                    </Button>
                    {colaboradorSelecionado && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setColaboradorSelecionado(null)}
                        title="Remover responsável"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {produtosSelecionados.length > 0 && !colaboradorSelecionado && (
                    <span className="text-xs text-destructive">Selecione o condutor responsável</span>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (produtosSelecionados.length > 0 && !colaboradorSelecionado)}
            >
              {isSubmitting ? "Salvando..." : "Registrar Troca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog SelecionarProdutosDialog */}
      <SelecionarProdutosDialog
        open={isSelectingProducts}
        onOpenChange={setIsSelectingProducts}
        onSave={handleSaveProdutos}
        produtosSelecionadosIds={produtosSelecionados.map(p => p.produto.id)}
      />

      {/* Dialog SelecionarResponsavelDialog */}
      <SelecionarResponsavelDialog
        open={showSelecionarResponsavel}
        onOpenChange={setShowSelecionarResponsavel}
        onSelect={colab => {
          setColaboradorSelecionado(colab)
          setColaboradorErro(null)
        }}
      />

      {/* Dialog de teste simples para isolar erro do Radix/React/Next.js */}
      {/* Remova após o teste! */}
      {/*
      <TesteDialog />
      */}
    </>
  )
}

/*
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export function TesteDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir Dialog Teste</button>
      {open && (
        <Dialog open={true} onOpenChange={setOpen}>
          <DialogContent>
            <div>Dialog de Teste</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
*/

