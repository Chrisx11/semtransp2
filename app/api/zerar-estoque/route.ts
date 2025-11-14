import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando processo de zerar estoque de todos os produtos...')
    
    // Primeiro, vamos verificar quantos produtos existem e quantos têm estoque > 0
    const { data: produtosAtuais, error: errorConsulta } = await supabase
      .from('produtos')
      .select('id, descricao, estoque')
      .gt('estoque', 0)
    
    if (errorConsulta) {
      throw errorConsulta
    }
    
    console.log(`📊 Encontrados ${produtosAtuais?.length || 0} produtos com estoque > 0`)
    
    if (!produtosAtuais || produtosAtuais.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os produtos já têm estoque zerado!',
        produtosAtualizados: 0,
        produtosComEstoqueZero: 0,
        totalProdutos: 0
      })
    }
    
    // Atualizar todos os produtos para estoque = 0
    const { data: produtosAtualizados, error: errorAtualizacao } = await supabase
      .from('produtos')
      .update({ 
        estoque: 0,
        updatedAt: new Date().toISOString()
      })
      .gt('estoque', 0)
      .select('id, descricao, estoque')
    
    if (errorAtualizacao) {
      throw errorAtualizacao
    }
    
    console.log(`✅ Sucesso! ${produtosAtualizados?.length || 0} produtos foram atualizados`)
    
    // Verificar o resultado final
    const { data: verificacaoFinal, error: errorVerificacao } = await supabase
      .from('produtos')
      .select('id, estoque')
    
    if (errorVerificacao) {
      throw errorVerificacao
    }
    
    const totalProdutos = verificacaoFinal?.length || 0
    const produtosComEstoqueZero = verificacaoFinal?.filter(p => p.estoque === 0).length || 0
    const produtosComEstoquePositivo = totalProdutos - produtosComEstoqueZero
    
    const resultado = {
      success: true,
      message: 'Estoque zerado com sucesso!',
      produtosAtualizados: produtosAtualizados?.length || 0,
      totalProdutos,
      produtosComEstoqueZero,
      produtosComEstoquePositivo,
      produtosExemplo: produtosAtuais.slice(0, 5).map(p => ({
        descricao: p.descricao,
        estoqueAnterior: p.estoque
      }))
    }
    
    console.log('📊 Relatório final:', resultado)
    
    return NextResponse.json(resultado)
    
  } catch (error: any) {
    console.error('❌ Erro durante a operação:', error.message)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao zerar estoque dos produtos',
      error: error.message,
      details: error.details || null
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para zerar o estoque de todos os produtos',
    warning: 'Esta operação não pode ser desfeita automaticamente'
  })
}
