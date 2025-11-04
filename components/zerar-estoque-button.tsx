"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function ZerarEstoqueButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleZerarEstoque = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/zerar-estoque', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Estoque zerado com sucesso!",
          description: `${data.produtosAtualizados} produtos foram atualizados. Total de produtos: ${data.totalProdutos}`,
        })
        
        // Recarregar a página para mostrar as mudanças
        window.location.reload()
      } else {
        toast({
          title: "Erro ao zerar estoque",
          description: data.message || "Ocorreu um erro inesperado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isLoading}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {isLoading ? 'Zerando...' : 'Zerar Estoque de Todos os Produtos'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Zeramento de Estoque
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>Esta operação irá zerar o estoque de TODOS os produtos do sistema.</strong>
            </p>
            <p>
              Esta ação é irreversível e não pode ser desfeita automaticamente. 
              Certifique-se de que realmente deseja prosseguir.
            </p>
            <p className="text-sm text-muted-foreground">
              O sistema atualizará o campo "estoque" para 0 em todos os produtos que 
              atualmente possuem estoque positivo.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleZerarEstoque}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Zerando...' : 'Sim, Zerar Estoque'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
