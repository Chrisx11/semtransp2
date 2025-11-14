"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { testSupabaseConnection, testInsertFornecedor, testTableExists, testBasicAccess } from "@/services/fornecedor-service"
import { supabase } from "@/lib/supabase"

export function SupabaseDiagnostic() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{
    connection: boolean | null
    tables: { fornecedores: boolean | null; notas: boolean | null; veiculos: boolean | null }
    rls: { fornecedores: boolean | null; notas: boolean | null }
    insertTest: { success: boolean | null; error?: string }
    tableExists: { exists: boolean | null; error?: string }
    basicAccess: { success: boolean | null; error?: string }
  }>({
    connection: null,
    tables: { fornecedores: null, notas: null, veiculos: null },
    rls: { fornecedores: null, notas: null },
    insertTest: { success: null },
    tableExists: { exists: null },
    basicAccess: { success: null }
  })

  const runDiagnostic = async () => {
    setIsRunning(true)
    setResults({
      connection: null,
      tables: { fornecedores: null, notas: null, veiculos: null },
      rls: { fornecedores: null, notas: null },
      insertTest: { success: null },
      tableExists: { exists: null },
      basicAccess: { success: null }
    })

    try {
      // Testar conexão básica
      const connectionTest = await testSupabaseConnection()
      setResults(prev => ({ ...prev, connection: connectionTest }))

      // Testar existência das tabelas
      const [fornecedoresTest, notasTest, veiculosTest] = await Promise.all([
        supabase.from("fornecedores").select("count").limit(1).then(r => ({ exists: !r.error })),
        supabase.from("notas").select("count").limit(1).then(r => ({ exists: !r.error })),
        supabase.from("veiculos").select("count").limit(1).then(r => ({ exists: !r.error }))
      ])

      setResults(prev => ({
        ...prev,
        tables: {
          fornecedores: fornecedoresTest.exists,
          notas: notasTest.exists,
          veiculos: veiculosTest.exists
        }
      }))

      // Testar RLS
      const [fornecedoresRLS, notasRLS] = await Promise.all([
        supabase.from("fornecedores").select("*").limit(1).then(r => ({ enabled: !r.error })),
        supabase.from("notas").select("*").limit(1).then(r => ({ enabled: !r.error }))
      ])

      setResults(prev => ({
        ...prev,
        rls: {
          fornecedores: fornecedoresRLS.enabled,
          notas: notasRLS.enabled
        }
      }))

      // Testar acesso básico
      const basicAccessTest = await testBasicAccess()
      setResults(prev => ({
        ...prev,
        basicAccess: basicAccessTest
      }))

      // Testar se a tabela existe
      const tableExistsTest = await testTableExists()
      setResults(prev => ({
        ...prev,
        tableExists: tableExistsTest
      }))

      // Testar inserção de dados
      const insertTest = await testInsertFornecedor()
      setResults(prev => ({
        ...prev,
        insertTest
      }))

    } catch (error) {
      console.error("Erro no diagnóstico:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Testando...</Badge>
    return status ? <Badge variant="default">OK</Badge> : <Badge variant="destructive">Erro</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Diagnóstico do Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostic} disabled={isRunning} className="w-full">
          {isRunning ? "Executando diagnóstico..." : "Executar Diagnóstico"}
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.connection)}
              Conexão com Supabase
            </span>
            {getStatusBadge(results.connection)}
          </div>

          <div className="ml-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.tables.fornecedores)}
                Tabela fornecedores
              </span>
              {getStatusBadge(results.tables.fornecedores)}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.tables.notas)}
                Tabela notas
              </span>
              {getStatusBadge(results.tables.notas)}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.tables.veiculos)}
                Tabela veiculos
              </span>
              {getStatusBadge(results.tables.veiculos)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.rls.fornecedores)}
              RLS fornecedores
            </span>
            {getStatusBadge(results.rls.fornecedores)}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.rls.notas)}
              RLS notas
            </span>
            {getStatusBadge(results.rls.notas)}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.basicAccess.success)}
              Acesso básico
            </span>
            {getStatusBadge(results.basicAccess.success)}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.tableExists.exists)}
              Tabela existe
            </span>
            {getStatusBadge(results.tableExists.exists)}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(results.insertTest.success)}
              Teste de inserção
            </span>
            {getStatusBadge(results.insertTest.success)}
          </div>
        </div>

        {results.connection === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Problema de conexão:</strong> Verifique se as variáveis de ambiente do Supabase estão configuradas corretamente.
            </p>
          </div>
        )}

        {(results.tables.fornecedores === false || results.tables.notas === false) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Tabelas não encontradas:</strong> Execute o script 'setup-complete-tables.sql' no Supabase.
            </p>
          </div>
        )}

        {(results.rls.fornecedores === false || results.rls.notas === false) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Problema de RLS:</strong> As políticas de Row Level Security estão bloqueando as operações. Execute o script 'fix-rls-policies.sql' no Supabase.
            </p>
          </div>
        )}

        {results.basicAccess.success === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Erro de acesso básico:</strong> {results.basicAccess.error || "Não foi possível acessar a tabela fornecedores. Verifique se a tabela existe e as políticas de RLS."}
            </p>
          </div>
        )}

        {results.tableExists.exists === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Tabela não encontrada:</strong> {results.tableExists.error || "A tabela 'fornecedores' não existe. Execute o script 'setup-complete-tables.sql' no Supabase."}
            </p>
          </div>
        )}

        {results.insertTest.success === false && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Erro na inserção:</strong> {results.insertTest.error || "Não foi possível inserir dados na tabela fornecedores."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
