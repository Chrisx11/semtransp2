"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { v4 as uuidv4 } from "uuid"

export default function DiagnosticoPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Função para testar a criação de fornecedor diretamente no localStorage
  const testLocalStorage = () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const FORNECEDORES_STORAGE_KEY = "fornecedores_data"
      const id = uuidv4()
      const now = new Date()
      
      const newFornecedor = {
        id,
        nome: "Fornecedor Teste",
        endereco: "Endereço de Teste, 123",
        telefone: "(11) 99999-9999",
        createdAt: now,
        updatedAt: now
      }
      
      // Obter fornecedores existentes
      const existingData = localStorage.getItem(FORNECEDORES_STORAGE_KEY)
      const fornecedores = existingData ? JSON.parse(existingData) : []
      
      // Adicionar novo fornecedor
      fornecedores.push(newFornecedor)
      
      // Salvar no localStorage
      localStorage.setItem(FORNECEDORES_STORAGE_KEY, JSON.stringify(fornecedores))
      
      // Verificar se foi salvo corretamente
      const updatedData = localStorage.getItem(FORNECEDORES_STORAGE_KEY)
      const updatedFornecedores = updatedData ? JSON.parse(updatedData) : []
      const saved = updatedFornecedores.find(f => f.id === id)
      
      setResult({
        success: !!saved,
        message: saved ? "Fornecedor salvo com sucesso no localStorage" : "Fornecedor não foi salvo",
        fornecedor: saved,
        totalFornecedores: updatedFornecedores.length
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
      localStorage.removeItem("fornecedores_data")
      setResult({
        success: true,
        message: "localStorage limpo com sucesso",
        totalFornecedores: 0
      })
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    }
  }
  
  // Função para verificar fornecedores no localStorage
  const checkLocalStorage = () => {
    try {
      const FORNECEDORES_STORAGE_KEY = "fornecedores_data"
      const data = localStorage.getItem(FORNECEDORES_STORAGE_KEY)
      const fornecedores = data ? JSON.parse(data) : []
      
      setResult({
        success: true,
        message: "Verificação concluída",
        fornecedores,
        totalFornecedores: fornecedores.length
      })
    } catch (error) {
      console.error("Erro ao verificar localStorage:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Diagnóstico de Fornecedores</h1>
        <p className="text-muted-foreground">Ferramentas para diagnosticar problemas com fornecedores</p>
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
              Este teste cria um fornecedor diretamente no localStorage, sem usar o serviço.
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
                  <p className="text-sm text-muted-foreground">Total de fornecedores: {result.totalFornecedores}</p>
                </div>
                
                {result.fornecedor && (
                  <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(result.fornecedor, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.fornecedores && result.fornecedores.length > 0 && (
                  <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900 max-h-60 overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(result.fornecedores, null, 2)}
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
          <li>Verifique o localStorage para ver os fornecedores salvos</li>
          <li>Se o teste funcionar, o problema está no serviço, não no armazenamento</li>
          <li>Limpe o localStorage se necessário para começar do zero</li>
          <li>Após os testes, volte para a página de fornecedores e tente criar um novo fornecedor</li>
        </ol>
      </div>
    </div>
  )
} 