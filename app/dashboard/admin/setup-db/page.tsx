"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { checkSupabaseConnection } from "@/lib/supabase"

interface TableStatus {
  table: string
  exists: boolean
  error: string | null
}

interface SetupResult {
  message: string
  tables: TableStatus[]
  actions: string[]
}

export default function SetupDbPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningSetup, setIsRunningSetup] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Verificar conexão com o banco de dados
  useEffect(() => {
    async function checkConnection() {
      try {
        setIsLoading(true)
        const status = await checkSupabaseConnection()
        setConnectionStatus(status)
        setError(null)
      } catch (error) {
        setError("Erro ao verificar conexão com o banco de dados")
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  // Função para executar a configuração do banco de dados
  const runSetup = async () => {
    try {
      setIsRunningSetup(true)
      setError(null)
      
      const response = await fetch('/api/setup-db')
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setSetupResult(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      console.error(error)
    } finally {
      setIsRunningSetup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Configuração do Banco de Dados</h1>
        <p className="text-muted-foreground">Verifique e configure as tabelas do banco de dados</p>
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
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : connectionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span>Status:</span>
                  {connectionStatus.connected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Desconectado
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
                  {connectionStatus.error && (
                    <p className="text-sm text-red-500 mt-2">{connectionStatus.error}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Não foi possível verificar o status da conexão.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-md-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuração das Tabelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Execute a configuração para verificar e criar as tabelas necessárias no banco de dados.
                Isso incluirá a tabela de fornecedores e suas estruturas relacionadas.
              </p>
              
              {setupResult && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-sm font-medium">Resultado da configuração:</h3>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Tabelas verificadas:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {setupResult.tables.map((table) => (
                        <div key={table.table} className="flex items-center gap-2">
                          {table.exists ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span className="text-xs">{table.table}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Ações executadas:</h4>
                    <ul className="text-xs space-y-1">
                      {setupResult.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runSetup}
              disabled={isRunningSetup || !connectionStatus?.connected}
            >
              {isRunningSetup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Configurando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" /> 
                  Executar Configuração
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 