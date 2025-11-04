// Script para zerar o estoque de todos os produtos
// Execute este script com: node scripts/zerar-estoque.js

const { createClient } = require('@supabase/supabase-js')

// Você precisa definir estas variáveis manualmente ou usar as do seu .env.local
// Para este exemplo, vamos usar valores placeholder - você deve substituir pelos seus valores reais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUA_URL_DO_SUPABASE'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUA_CHAVE_DO_SUPABASE'

if (supabaseUrl === 'SUA_URL_DO_SUPABASE' || supabaseKey === 'SUA_CHAVE_DO_SUPABASE') {
  console.error('❌ Erro: Você precisa definir as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Opções:')
  console.error('1. Criar um arquivo .env.local com as variáveis')
  console.error('2. Exportar as variáveis no terminal: export NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('3. Editar este script e colocar os valores diretamente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function zerarEstoqueProdutos() {
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
      console.log('✅ Todos os produtos já têm estoque zerado!')
      return
    }
    
    // Mostrar alguns exemplos dos produtos que serão atualizados
    console.log('\n📋 Exemplos de produtos que serão atualizados:')
    produtosAtuais.slice(0, 5).forEach((produto, index) => {
      console.log(`   ${index + 1}. ${produto.descricao} - Estoque atual: ${produto.estoque}`)
    })
    
    if (produtosAtuais.length > 5) {
      console.log(`   ... e mais ${produtosAtuais.length - 5} produtos`)
    }
    
    // Confirmar a operação
    console.log('\n⚠️  ATENÇÃO: Esta operação irá zerar o estoque de TODOS os produtos!')
    console.log('   Esta ação não pode ser desfeita automaticamente.')
    
    // Para execução automática, vamos prosseguir
    console.log('\n🚀 Prosseguindo com a atualização...')
    
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
    
    console.log('\n📊 Relatório final:')
    console.log(`   Total de produtos: ${totalProdutos}`)
    console.log(`   Produtos com estoque zero: ${produtosComEstoqueZero}`)
    console.log(`   Produtos com estoque positivo: ${produtosComEstoquePositivo}`)
    
    if (produtosComEstoquePositivo === 0) {
      console.log('\n🎉 Operação concluída com sucesso! Todos os produtos agora têm estoque zerado.')
    } else {
      console.log('\n⚠️  Alguns produtos ainda têm estoque positivo. Verifique se houve algum erro.')
    }
    
  } catch (error) {
    console.error('❌ Erro durante a operação:', error.message)
    if (error.details) {
      console.error('Detalhes:', error.details)
    }
    process.exit(1)
  }
}

// Executar o script
zerarEstoqueProdutos()
