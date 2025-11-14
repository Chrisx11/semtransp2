"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { v4 as uuidv4 } from "uuid"

export default function DiagnosticoPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Função para testar a criação de serviço de borracharia diretamente no localStorage
  const testLocalStorage = () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const BORRACHARIA_STORAGE_KEY = "borracharia_data"
      const id = uuidv4()
      const now = new Date()
      
      const newServico = {
        id,
        veiculo: {
          placa: "ABC1234",
          modelo: "Modelo Teste",
          marca: "Marca Teste",
          secretaria: "Secretaria Teste"
        },
        fornecedorId: "fornecedor-teste",
        solicitanteId: "Solicitante Teste",
        servico: "Serviço de Teste",
        quantidade: 2,
        createdAt: now,
        updatedAt: now
      }
      
      // Obter serviços existentes
      const existingData = localStorage.getItem(BORRACHARIA_STORAGE_KEY)
      const servicos = existingData ? JSON.parse(existingData) : []
      
      // Adicionar novo serviço
      servicos.push(newServico)
      
      // Salvar no localStorage
      localStorage.setItem(BORRACHARIA_STORAGE_KEY, JSON.stringify(servicos))
      
      // Verificar se foi salvo corretamente
      const updatedData = localStorage.getItem(BORRACHARIA_STORAGE_KEY)
      const updatedServicos = updatedData ? JSON.parse(updatedData) : []
      const saved = updatedServicos.find((s: any) => s.id === id)
      
      setResult({
        success: !!saved,
        message: saved ? "Serviço salvo com sucesso no localStorage" : "Serviço não foi salvo",
        servico: saved,
        totalServicos: updatedServicos.length
      })
    } catch (error) {
      console.error("Erro ao testar localStorage:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para limpar o localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("borracharia_data")
      setResult({
        success: true,
        message: "localStorage limpo com sucesso",
        totalServicos: 0
      })
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    }
  }
  
  // Função para verificar serviços no localStorage
  const checkLocalStorage = () => {
    try {
      const BORRACHARIA_STORAGE_KEY = "borracharia_data"
      const data = localStorage.getItem(BORRACHARIA_STORAGE_KEY)
      const servicos = data ? JSON.parse(data) : []
      
      setResult({
        success: true,
        message: "Verificação concluída",
        servicos,
        totalServicos: servicos.length
      })
    } catch (error) {
      console.error("Erro ao verificar localStorage:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Diagnóstico de Borracharia</h1>
        <p className="text-muted-foreground">Ferramentas para diagnosticar problemas com serviços de borracharia</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md-custom">
          <CardHeader>
            <CardTitle>Teste de localStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Este teste cria um serviço de borracharia diretamente no localStorage, sem usar o serviço.
            </p>
            <div className="flex gap-2">
              <Button onClick={testLocalStorage} disabled={isLoading}>
                {isLoading ? "Testando..." : "Testar localStorage"}
              </Button>
              <Button variant="outline" onClick={clearLocalStorage}>
                Limpar localStorage
              </Button>
              <Button variant="secondary" onClick={checkLocalStorage}>
                Verificar localStorage
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md-custom">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${result.success ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span className="font-medium">{result.message}</span>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Total de serviços: {result.totalServicos}</p>
                </div>
                
                {result.servico && (
                  <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(result.servico, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.servicos && result.servicos.length > 0 && (
                  <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900 max-h-60 overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(result.servicos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Execute um teste para ver o resultado</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
        <h3 className="font-medium mb-2">Instruções</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Execute o teste de localStorage para verificar se é possível salvar dados</li>
          <li>Verifique o localStorage para ver os serviços salvos</li>
          <li>Se o teste funcionar, o problema está no serviço, não no armazenamento</li>
          <li>Limpe o localStorage se necessário para começar do zero</li>
          <li>Após os testes, volte para a página de borracharia e tente criar um novo serviço</li>
        </ol>
      </div>
    </div>
  )
} 