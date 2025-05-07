"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { OrdemServicoVisualizacao } from "@/components/ordem-servico-visualizacao"
import { getOrdemServicoById, getOrdemServicoByIdSupabase } from "@/services/ordem-servico-service"
import { Loader2 } from "lucide-react"
import { OrdemServicoEdicaoDialog } from "@/components/ordem-servico-edicao-dialog"

export default function OrdemServicoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [ordem, setOrdem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEdicaoDialogOpen, setIsEdicaoDialogOpen] = useState(false)

  useEffect(() => {
    if (params && params.id) {
      setLoading(true)
      const fetchOrdem = async () => {
        const ordemData = await getOrdemServicoByIdSupabase(params.id as string)
        setOrdem(ordemData)
        setLoading(false)
      }
      fetchOrdem()
    }
  }, [params])

  const handleBack = () => {
    router.back()
  }

  const handleEdit = () => {
    setIsEdicaoDialogOpen(true)
  }

  const handleEditSuccess = () => {
    // Recarregar os dados da ordem após a edição
    if (params && params.id) {
      const fetchOrdem = async () => {
        const ordemAtualizada = await getOrdemServicoByIdSupabase(params.id as string)
        setOrdem(ordemAtualizada)
      }
      fetchOrdem()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Ordem de Serviço não encontrada</h2>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <OrdemServicoVisualizacao ordem={ordem} onBack={handleBack} onEdit={handleEdit} />

      {/* Diálogo de Edição */}
      <OrdemServicoEdicaoDialog
        open={isEdicaoDialogOpen}
        onOpenChange={setIsEdicaoDialogOpen}
        ordemId={params && params.id ? (params.id as string) : ""}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
