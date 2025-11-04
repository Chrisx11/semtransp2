"use client"

import { useState, useEffect } from "react"
import { checkSupabaseConnection, listSupabaseTables, supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"

// Verificar estrutura da tabela ordens_servico
const verificarEstruturaTabela = async () => {
  try {
    // Vamos fazer uma consulta para retornar uma ordem e examinar sua estrutura
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Erro ao consultar tabela ordens_servico:', error);
      return {
        success: false,
        message: 'Erro ao verificar estrutura',
        error: error.message
      };
    }
    
    if (!data || data.length === 0) {
      return {
        success: true,
        message: 'Tabela existe, mas não há registros',
        fields: []
      };
    }
    
    // Obter os campos de um registro
    const campos = Object.keys(data[0]).map(field => {
      const valor = data[0][field];
      const tipo = typeof valor;
      return {
        nome: field,
        tipo,
        exemplo: valor !== null ? (tipo === 'object' ? JSON.stringify(valor).substring(0, 50) : String(valor).substring(0, 50)) : 'null'
      };
    });
    
    // Verificar especificamente o campo ordem_execucao
    const temOrdemExecucao = campos.some(campo => campo.nome === 'ordem_execucao');
    
    return {
      success: true,
      message: 'Estrutura da tabela verificada',
      fields: campos,
      hasOrdemExecucao: temOrdemExecucao
    };
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    return {
      success: false,
      message: 'Exceção ao verificar estrutura',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

// Tentar atualizar um campo na tabela
const testarAtualizacao = async () => {
  try {
    const agora = new Date().toISOString();
    
    // Primeiro, obter uma ordem para testar
    const { data: ordens, error: errorConsulta } = await supabase
      .from('ordens_servico')
      .select('id')
      .limit(1);
      
    if (errorConsulta || !ordens || ordens.length === 0) {
      return {
        success: false,
        message: 'Não foi possível obter uma ordem para testar',
        error: errorConsulta ? errorConsulta.message : 'Nenhuma ordem encontrada'
      };
    }
    
    const ordemId = ordens[0].id;
    
    // Tentar atualizar a ordem_execucao
    const { data, error } = await supabase
      .from('ordens_servico')
      .update({ 
        ordem_execucao: 999,
        updatedAt: agora 
      })
      .eq('id', ordemId)
      .select();
      
    if (error) {
      return {
        success: false,
        message: 'Erro ao atualizar ordem',
        error: error.message,
        details: error
      };
    }
    
    return {
      success: true,
      message: `Atualização bem-sucedida na ordem ${ordemId}`,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Exceção ao testar atualização',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

export default function SupabaseDiagnostico() {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [tablesStatus, setTablesStatus] = useState<any[]>([])
  const [estruturaTabela, setEstruturaTabela] = useState<any>(null)
  const [resultadoTeste, setResultadoTeste] = useState<any>(null)

  const verificarConexao = async () => {
    setIsCheckingConnection(true)
    try {
      const status = await checkSupabaseConnection()
      setConnectionStatus(status)
      
      if (status.connected) {
        const tables = await listSupabaseTables()
        setTablesStatus(tables)
      }
    } catch (error) {
      console.error("Erro ao verificar conexão:", error)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  useEffect(() => {
    verificarConexao()
  }, [])

  const verificarEstrutura = async () => {
    const resultado = await verificarEstruturaTabela();
    setEstruturaTabela(resultado);
  }
  
  const testarAtualizar = async () => {
    const resultado = await testarAtualizacao();
    setResultadoTeste(resultado);
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Diagnóstico do Supabase</h1>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={verificarConexao}
          disabled={isCheckingConnection}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingConnection ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {isCheckingConnection ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connectionStatus?.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Status da Conexão
              </CardTitle>
              <CardDescription>
                {connectionStatus?.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!connectionStatus?.connected && connectionStatus?.error && (
                <div className="bg-muted p-3 rounded-md text-sm mb-4 overflow-auto">
                  <p className="font-semibold">Erro:</p>
                  <pre className="whitespace-pre-wrap">{connectionStatus.error}</pre>
                  
                  {connectionStatus.details && (
                    <>
                      <p className="font-semibold mt-2">Detalhes:</p>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(connectionStatus.details, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}
              
              <div className="text-sm">
                <p className="mb-2">Verifique se:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>As variáveis de ambiente estão configuradas corretamente</li>
                  <li>O projeto Supabase está ativo</li>
                  <li>As restrições de segurança (RLS) estão configuradas adequadamente</li>
                  <li>Você está autenticado (se necessário)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {tablesStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status das Tabelas</CardTitle>
                <CardDescription>
                  Verificação da existência das tabelas necessárias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tablesStatus.map((table: any) => (
                    <div 
                      key={table.table}
                      className="flex items-center p-3 rounded-md border"
                    >
                      {table.exists ? (
                        <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 mr-3 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{table.table}</p>
                        {!table.exists && table.error && (
                          <p className="text-xs text-muted-foreground">{table.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <Button onClick={verificarEstrutura} variant="outline">
          Verificar Estrutura da Tabela
        </Button>
        
        <Button onClick={testarAtualizar} variant="outline">
          Testar Atualização
        </Button>
      </div>

      {estruturaTabela && (
        <div className="mt-6 bg-card rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Estrutura da Tabela Ordens de Serviço</h2>
          
          <div className="mb-2">
            <span className="font-medium">Status: </span>
            <span className={estruturaTabela.success ? "text-green-500" : "text-red-500"}>
              {estruturaTabela.message}
            </span>
          </div>
          
          {estruturaTabela.hasOrdemExecucao !== undefined && (
            <div className="mb-4">
              <span className="font-medium">Campo ordem_execucao: </span>
              <span className={estruturaTabela.hasOrdemExecucao ? "text-green-500" : "text-red-500"}>
                {estruturaTabela.hasOrdemExecucao ? "Presente" : "Ausente"}
              </span>
            </div>
          )}
          
          {estruturaTabela.fields && estruturaTabela.fields.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-sm font-medium text-left">Campo</th>
                    <th className="p-2 text-sm font-medium text-left">Tipo</th>
                    <th className="p-2 text-sm font-medium text-left">Exemplo</th>
                  </tr>
                </thead>
                <tbody>
                  {estruturaTabela.fields.map((field: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-sm">{field.nome}</td>
                      <td className="p-2 text-sm">{field.tipo}</td>
                      <td className="p-2 text-sm font-mono text-xs truncate max-w-xs">{field.exemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {estruturaTabela.error && (
            <div className="bg-muted p-3 rounded-md text-sm mt-4">
              <p className="font-medium text-red-500 mb-1">Erro:</p>
              <pre className="whitespace-pre-wrap">{estruturaTabela.error}</pre>
            </div>
          )}
        </div>
      )}
      
      {resultadoTeste && (
        <div className="mt-6 bg-card rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resultado do Teste de Atualização</h2>
          
          <div className="mb-4">
            <span className="font-medium">Status: </span>
            <span className={resultadoTeste.success ? "text-green-500" : "text-red-500"}>
              {resultadoTeste.message}
            </span>
          </div>
          
          {resultadoTeste.data && (
            <div className="mt-4">
              <p className="font-medium mb-2">Dados retornados:</p>
              <pre className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
                {JSON.stringify(resultadoTeste.data, null, 2)}
              </pre>
            </div>
          )}
          
          {resultadoTeste.error && (
            <div className="bg-muted p-3 rounded-md text-sm mt-4">
              <p className="font-medium text-red-500 mb-1">Erro:</p>
              <pre className="whitespace-pre-wrap">{resultadoTeste.error}</pre>
              
              {resultadoTeste.details && (
                <div className="mt-2">
                  <p className="font-medium mb-1">Detalhes:</p>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(resultadoTeste.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 