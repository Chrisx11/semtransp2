"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Colaborador, addColaborador, updateColaborador } from "@/services/colaborador-service"
import { useToast } from "@/hooks/use-toast"
import { PhoneInput } from "@/components/phone-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ColaboradorFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  colaborador?: Colaborador | null
}

export function ColaboradorForm({ isOpen, onClose, onSubmit, colaborador }: ColaboradorFormProps) {
  const [nome, setNome] = useState("")
  const [funcao, setFuncao] = useState("")
  const [telefone, setTelefone] = useState("")
  const [secretaria, setSecretaria] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Lista de secretarias igual ao formulário de veículos
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
    "Leonardo",
  ]

  useEffect(() => {
    if (colaborador) {
      setNome(colaborador.nome)
      setFuncao(colaborador.funcao)
      setTelefone(colaborador.telefone)
      setSecretaria(colaborador.secretaria)
    } else {
      setNome("")
      setFuncao("")
      setTelefone("")
      setSecretaria("")
    }
  }, [colaborador])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome || !funcao) {
      toast({
        title: "Erro",
        description: "Nome e função são campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (colaborador) {
        await updateColaborador(colaborador.id, {
          nome,
          funcao,
          telefone,
          secretaria: secretaria.toUpperCase(),
        })
        toast({
          title: "Sucesso",
          description: "Colaborador atualizado com sucesso.",
        })
      } else {
        await addColaborador({
          nome,
          funcao,
          telefone,
          secretaria: secretaria.toUpperCase(),
        })
        toast({
          title: "Sucesso",
          description: "Colaborador adicionado com sucesso.",
        })
      }
      onSubmit()
      onClose() // Adicionar esta linha para fechar o formulário automaticamente
    } catch (error) {
      console.error("Erro ao salvar colaborador:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o colaborador.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{colaborador ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do colaborador"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="funcao">Função</Label>
            <Input
              id="funcao"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              placeholder="Função do colaborador"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <PhoneInput id="telefone" value={telefone} onChange={setTelefone} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretaria">Secretaria</Label>
            <Select
              value={secretaria}
              onValueChange={setSecretaria}
            >
              <SelectTrigger id="secretaria">
                <SelectValue placeholder="Selecione a secretaria" />
              </SelectTrigger>
              <SelectContent>
                {secretarias.map((secretaria) => (
                  <SelectItem key={secretaria} value={secretaria.toUpperCase()}>
                    {secretaria.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : colaborador ? (
                "Atualizar"
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
