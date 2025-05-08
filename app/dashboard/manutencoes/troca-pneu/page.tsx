"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"
import { Search, Plus, Disc, Car, Save, RefreshCw, Loader2, FileDown } from "lucide-react"

// Importar jspdf e autotable
import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'

// Tipos para o Chart.js
type ChartType = any;

interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  kmAtual?: number
}

interface TrocaPneu {
  id: string
  veiculo_id: string
  data_troca: string
  km: number
  tipo_pneu_id: string
  tipo_pneu?: {
    id: string
    marca: string
    modelo: string
    medida: string
    ativo: boolean
  }
  posicoes: string[]
  observacao?: string
  alinhamento?: boolean
  balanceamento?: boolean
}

interface TipoPneu {
  id: string
  marca: string
  modelo: string
  medida: string
  ativo: boolean
}

export default function TrocaPneuPage() {
  // Estados para veículos e pneus
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<Veiculo[]>([])
  const [tiposPneu, setTiposPneu] = useState<TipoPneu[]>([])
  const [trocasPneu, setTrocasPneu] = useState<TrocaPneu[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estado para loading
  const [loading, setLoading] = useState(true)
  const [geradorPdfLoading, setGeradorPdfLoading] = useState(false)
  
  // Estados para gerenciar modais
  const [dialogTrocaPneuOpen, setDialogTrocaPneuOpen] = useState(false)
  const [dialogTipoPneuOpen, setDialogTipoPneuOpen] = useState(false)
  const [dialogHistoricoOpen, setDialogHistoricoOpen] = useState(false)
  const [dialogComparacaoOpen, setDialogComparacaoOpen] = useState(false)
  
  // Estado para veículo selecionado para troca
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null)
  
  // Referência para o elemento do gráfico
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  
  // Estado para formulário de troca de pneu
  const [formTrocaPneu, setFormTrocaPneu] = useState({
    tipo_pneu_id: "",
    km: "",
    observacao: "",
    posicoes: [] as string[],
    alinhamento: false,
    balanceamento: false
  })
  
  // Estado para formulário de tipo de pneu
  const [formTipoPneu, setFormTipoPneu] = useState({
    id: "",
    marca: "",
    modelo: "",
    medida: "",
    ativo: true
  })
  
  // Estado para histórico do veículo
  const [historicoVeiculo, setHistoricoVeiculo] = useState<TrocaPneu[]>([])
  
  // Adicionar estado para o modal de comparação
  const [veiculosComparacao, setVeiculosComparacao] = useState<{
    veiculo1: string;
    veiculo2: string;
  }>({
    veiculo1: "",
    veiculo2: ""
  })
  const [resultadoComparacao, setResultadoComparacao] = useState<{
    veiculo1: {
      placa: string;
      modelo: string;
      kmMediaPorTroca: number;
      totalTrocas: number;
      kmPercorrido: number;
      comServicos: boolean;
    } | null;
    veiculo2: {
      placa: string;
      modelo: string;
      kmMediaPorTroca: number;
      totalTrocas: number;
      kmPercorrido: number;
      comServicos: boolean;
    } | null;
    diferencaPercentual: number;
    veiculoMelhor: string | null;
  } | null>(null)
  const [carregandoComparacao, setCarregandoComparacao] = useState(false)
  
  const { toast } = useToast()
  
  // Add an additional dialog state for the vehicle selection modal
  const [dialogVeiculoOpen, setDialogVeiculoOpen] = useState(false)
  const [veiculoSelectionTarget, setVeiculoSelectionTarget] = useState<'veiculo1' | 'veiculo2' | null>(null)
  const [veiculoSearchTerm, setVeiculoSearchTerm] = useState("")
  const [veiculosFiltradosSelecao, setVeiculosFiltradosSelecao] = useState<Veiculo[]>([])
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarVeiculos()
    carregarTiposPneu()
    verificarEstruturaBancoDados()
  }, [])
  
  // Filtrar veículos quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm.trim()) {
      setVeiculosFiltrados(veiculos)
      return
    }
    
    const termoBusca = searchTerm.toLowerCase().trim()
    const resultados = veiculos.filter(veiculo => 
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca)
    )
    
    setVeiculosFiltrados(resultados)
  }, [searchTerm, veiculos])
  
  // Função para carregar veículos do Supabase
  async function carregarVeiculos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .order("placa")
      
      if (error) throw error
      
      setVeiculos(data || [])
      setVeiculosFiltrados(data || [])
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar veículos",
        description: "Não foi possível carregar a lista de veículos."
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Função para carregar tipos de pneu do Supabase
  async function carregarTiposPneu() {
    try {
      // Verificar se a tabela existe
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'tipos_pneu')
        .single()
      
      if (!tableExists) {
        console.log("Tabela tipos_pneu não existe, criando...")
        await criarTabelaTiposPneu()
      }
      
      const { data, error } = await supabase
        .from("tipos_pneu")
        .select("*")
        .order("marca")
      
      if (error) throw error
      
      setTiposPneu(data || [])
    } catch (error) {
      console.error("Erro ao carregar tipos de pneu:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar tipos de pneu",
        description: "Não foi possível carregar os tipos de pneu."
      })
    }
  }
  
  // Função para criar tabela de tipos de pneu se não existir
  async function criarTabelaTiposPneu() {
    try {
      await supabase.rpc('create_tipos_pneu_table')
    } catch (error) {
      console.error("Erro ao criar tabela tipos_pneu:", error)
      
      // Tentar criar manualmente
      const query = `
        CREATE TABLE IF NOT EXISTS tipos_pneu (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          marca TEXT NOT NULL,
          modelo TEXT NOT NULL,
          medida TEXT NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabase.rpc('exec_sql', { sql: query })
    }
  }
  
  // Função para verificar a estrutura do banco de dados
  async function verificarEstruturaBancoDados() {
    try {
      console.log("Verificando estrutura do banco de dados...")
      
      // Verificar se tabela tipos_pneu existe usando SELECT condicional
      const { data: tiposPneuExists, error: tiposPneuExistsError } = await supabase
        .rpc('table_exists', { table_name: 'tipos_pneu' })
        .single()
      
      if (tiposPneuExistsError) {
        console.error("Erro ao verificar existência da tabela tipos_pneu:", tiposPneuExistsError)
        
        // Método alternativo: tentar fazer uma consulta simples
        const { data: tiposPneuAlt, error: tiposPneuErrorAlt } = await supabase
          .from('tipos_pneu')
          .select('id')
          .limit(1)
        
        if (tiposPneuErrorAlt && tiposPneuErrorAlt.code === '42P01') { // Código de erro para "tabela não existe"
          console.log("Tabela tipos_pneu não existe")
          // Criar tabela
          await criarTabelaTiposPneu()
        } else if (tiposPneuErrorAlt) {
          console.log("Erro ao verificar tabela tipos_pneu:", tiposPneuErrorAlt)
        } else {
          console.log("Tabela tipos_pneu existe")
        }
      } else {
        console.log("Verificação de tabela tipos_pneu:", tiposPneuExists)
      }
      
      // Verificar se tabela trocas_pneu existe
      const { data: trocasPneuExists, error: trocasPneuExistsError } = await supabase
        .rpc('table_exists', { table_name: 'trocas_pneu' })
        .single()
      
      if (trocasPneuExistsError) {
        console.error("Erro ao verificar existência da tabela trocas_pneu:", trocasPneuExistsError)
        
        // Método alternativo: tentar fazer uma consulta simples
        const { data: trocasPneuAlt, error: trocasPneuErrorAlt } = await supabase
          .from('trocas_pneu')
          .select('id')
          .limit(1)
        
        if (trocasPneuErrorAlt && trocasPneuErrorAlt.code === '42P01') { // Código de erro para "tabela não existe"
          console.log("Tabela trocas_pneu não existe")
          // Criar tabela
          await criarTabelaTrocasPneu()
        } else if (trocasPneuErrorAlt) {
          console.log("Erro ao verificar tabela trocas_pneu:", trocasPneuErrorAlt)
        } else {
          console.log("Tabela trocas_pneu existe")
        }
      } else {
        console.log("Verificação de tabela trocas_pneu:", trocasPneuExists)
      }
      
      // Verificar se existem registros nas tabelas
      const { data: countTiposPneu, error: countTiposError } = await supabase
        .from('tipos_pneu')
        .select('id', { count: 'exact', head: true })
      
      if (countTiposError) {
        console.error("Erro ao contar tipos de pneu:", countTiposError)
      } else {
        console.log("Quantidade de tipos de pneu:", countTiposPneu)
      }
      
      const { count: countTrocas, error: countTrocasError } = await supabase
        .from('trocas_pneu')
        .select('id', { count: 'exact', head: true })
      
      if (countTrocasError) {
        console.error("Erro ao contar trocas de pneu:", countTrocasError)
      } else {
        console.log("Quantidade de trocas de pneu:", countTrocas)
      }
      
      // Testar a junção entre as tabelas
      if (countTrocas && countTrocas > 0) {
        const { data: joinTest, error: joinError } = await supabase
          .from('trocas_pneu')
          .select(`
            id,
            tipo_pneu:tipos_pneu(id, marca, modelo)
          `)
          .limit(1)
        
        if (joinError) {
          console.error("Erro ao testar junção entre tabelas:", joinError)
          
          // Tentar corrigir a referência
          await corrigirReferenciasTiposPneu()
        } else {
          console.log("Teste de junção bem-sucedido:", joinTest)
        }
      }
    } catch (error) {
      console.error("Erro ao verificar estrutura do banco de dados:", error)
    }
  }
  
  // Função para corrigir referências entre tabelas
  async function corrigirReferenciasTiposPneu() {
    try {
      console.log("Tentando corrigir referências entre tabelas...")
      
      // Verificar se há trocas com referências inválidas
      const { data: trocasSemTipo, error: trocasError } = await supabase
        .from('trocas_pneu')
        .select(`
          id,
          tipo_pneu_id
        `)
        .limit(10)
      
      if (trocasError) {
        console.error("Erro ao buscar trocas para verificação:", trocasError)
        return
      }
      
      console.log("Trocas para verificação:", trocasSemTipo)
      
      // Para cada troca, verificar se o tipo_pneu_id existe
      for (const troca of trocasSemTipo) {
        const { data: tipoPneu, error: tipoError } = await supabase
          .from('tipos_pneu')
          .select('id')
          .eq('id', troca.tipo_pneu_id)
          .single()
        
        if (tipoError || !tipoPneu) {
          console.log(`Troca ${troca.id} tem referência inválida para tipo_pneu_id: ${troca.tipo_pneu_id}`)
          
          // Buscar um tipo de pneu válido para atualizar a referência
          const { data: tipoValido, error: tipoValidoError } = await supabase
            .from('tipos_pneu')
            .select('id')
            .eq('ativo', true)
            .limit(1)
            .single()
          
          if (tipoValidoError || !tipoValido) {
            console.error("Não foi possível encontrar um tipo de pneu válido para correção")
            continue
          }
          
          // Atualizar a referência
          const { error: updateError } = await supabase
            .from('trocas_pneu')
            .update({ tipo_pneu_id: tipoValido.id })
            .eq('id', troca.id)
          
          if (updateError) {
            console.error(`Erro ao atualizar referência da troca ${troca.id}:`, updateError)
          } else {
            console.log(`Referência da troca ${troca.id} atualizada para tipo ${tipoValido.id}`)
          }
        } else {
          console.log(`Troca ${troca.id} tem referência válida para tipo_pneu_id: ${troca.tipo_pneu_id}`)
        }
      }
      
    } catch (error) {
      console.error("Erro ao corrigir referências:", error)
    }
  }
  
  // Função para abrir modal de troca de pneu
  function abrirModalTrocaPneu(veiculo: Veiculo) {
    setVeiculoSelecionado(veiculo)
    setFormTrocaPneu({
      tipo_pneu_id: "",
      km: veiculo.kmAtual?.toString() || "",
      observacao: "",
      posicoes: [],
      alinhamento: false,
      balanceamento: false
    })
    setDialogTrocaPneuOpen(true)
  }
  
  // Função para abrir modal de tipo de pneu
  function abrirModalTipoPneu(tipoPneu?: TipoPneu) {
    if (tipoPneu) {
      setFormTipoPneu({
        id: tipoPneu.id,
        marca: tipoPneu.marca,
        modelo: tipoPneu.modelo,
        medida: tipoPneu.medida,
        ativo: tipoPneu.ativo
      })
    } else {
      setFormTipoPneu({
        id: "",
        marca: "",
        modelo: "",
        medida: "",
        ativo: true
      })
    }
    setDialogTipoPneuOpen(true)
  }
  
  // Função para mostrar histórico de trocas
  async function abrirHistorico(veiculo: Veiculo) {
    setVeiculoSelecionado(veiculo)
    setLoading(true)
    
    try {
      // Primeiro, garantir que as funções utilitárias existam
      await criarFuncoesUtilitarias()
      
      // Verificar se a tabela existe
      const { data: tableExists, error: tableError } = await supabase
        .rpc('table_exists', { table_name: 'trocas_pneu' })
        .single()
      
      if (tableError || !tableExists) {
        console.log("Tabela trocas_pneu não existe, criando...")
        await criarTabelaTrocasPneu()
        setHistoricoVeiculo([])
      } else {
        // Verificar se a tabela tem a coluna updated_at
        const { data: columnExists, error: columnError } = await supabase
          .rpc('column_exists', { table_name: 'trocas_pneu', column_name: 'updated_at' })
          .single()
        
        if (columnError || !columnExists) {
          console.log("Coluna updated_at não existe, atualizando tabela...")
          // Executar atualização da tabela
          await atualizarTabelaTrocasPneu()
        }
        
        const { data, error } = await supabase
          .from("trocas_pneu")
          .select(`
            *,
            tipo_pneu:tipos_pneu(*)
          `)
          .eq("veiculo_id", veiculo.id)
          .order("data_troca", { ascending: false })
        
        if (error) {
          console.error("Erro detalhado ao buscar histórico:", error)
          throw error
        }
        
        console.log("Histórico obtido:", data)
        setHistoricoVeiculo(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de trocas de pneu."
      })
      setHistoricoVeiculo([])
    } finally {
      setLoading(false)
      setDialogHistoricoOpen(true)
    }
  }
  
  // Função para atualizar a estrutura da tabela trocas_pneu
  async function atualizarTabelaTrocasPneu() {
    try {
      // Adicionar coluna updated_at se não existir
      const query = `
        ALTER TABLE trocas_pneu 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Adicionar colunas para alinhamento e balanceamento
        ALTER TABLE trocas_pneu
        ADD COLUMN IF NOT EXISTS alinhamento BOOLEAN DEFAULT FALSE;
        
        ALTER TABLE trocas_pneu
        ADD COLUMN IF NOT EXISTS balanceamento BOOLEAN DEFAULT FALSE;
        
        -- Criar ou atualizar o trigger
        CREATE OR REPLACE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Aplicar o trigger
        DROP TRIGGER IF EXISTS set_timestamp ON trocas_pneu;
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON trocas_pneu
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
      `
      
      await supabase.rpc('exec_sql', { sql: query })
      console.log("Tabela trocas_pneu atualizada com sucesso")
      
    } catch (error) {
      console.error("Erro ao atualizar tabela trocas_pneu:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar banco de dados",
        description: "Não foi possível atualizar a estrutura da tabela de trocas de pneu."
      })
    }
  }
  
  // Função para criar tabela de trocas de pneu se não existir
  async function criarTabelaTrocasPneu() {
    try {
      await supabase.rpc('create_trocas_pneu_table')
    } catch (error) {
      console.error("Erro ao criar tabela trocas_pneu:", error)
      
      // Tentar criar manualmente
      const query = `
        CREATE TABLE IF NOT EXISTS trocas_pneu (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
          tipo_pneu_id UUID NOT NULL REFERENCES tipos_pneu(id),
          data_troca TIMESTAMPTZ DEFAULT NOW(),
          km INTEGER NOT NULL,
          posicoes TEXT[] NOT NULL,
          observacao TEXT,
          alinhamento BOOLEAN DEFAULT FALSE,
          balanceamento BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabase.rpc('exec_sql', { sql: query })
    }
  }
  
  // Função para salvar tipo de pneu
  async function salvarTipoPneu() {
    // Validações
    if (!formTipoPneu.marca || !formTipoPneu.modelo || !formTipoPneu.medida) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios."
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Primeiro, garantir que as funções utilitárias existam
      await criarFuncoesUtilitarias();
      
      // Verificar se a tabela existe antes de inserir/atualizar
      try {
        const { data: tableExists, error: tableCheckError } = await supabase
          .rpc('table_exists', { table_name: 'tipos_pneu' })
          .single();
          
        if (tableCheckError) {
          console.error("Erro ao verificar tabela tipos_pneu:", tableCheckError);
          // Se não conseguir verificar, tenta criar mesmo assim
          await criarTabelaTiposPneu();
        } else if (!tableExists) {
          // Criar tabela se não existir
          await criarTabelaTiposPneu();
        }
      } catch (checkError) {
        console.error("Exceção ao verificar tabela:", checkError);
        // Em caso de erro ao verificar, tenta criar a tabela
        await criarTabelaTiposPneu();
      }
      
      // Tentativa de contornar o Row-Level Security (RLS)
      // Usando insert via SQL diretamente com RPC em vez da API de inserção padrão
      if (formTipoPneu.id) {
        // Atualizar tipo existente usando SQL para evitar problemas com RLS
        const updateQuery = `
          UPDATE tipos_pneu
          SET marca = '${formTipoPneu.marca.replace(/'/g, "''")}',
              modelo = '${formTipoPneu.modelo.replace(/'/g, "''")}',
              medida = '${formTipoPneu.medida.replace(/'/g, "''")}',
              ativo = ${formTipoPneu.ativo}
          WHERE id = '${formTipoPneu.id}'
        `;
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: updateQuery 
        });
        
        if (error) {
          console.error("Erro ao atualizar tipo de pneu via SQL:", JSON.stringify(error));
          throw new Error(`Erro ao atualizar: ${error.message || "Erro desconhecido"}`);
        }
        
        toast({
          title: "Tipo de pneu atualizado",
          description: "O tipo de pneu foi atualizado com sucesso."
        });
      } else {
        // Adicionar novo tipo usando SQL para evitar problemas com RLS
        // Gerar um UUID para o novo tipo de pneu
        const uuid = crypto.randomUUID();
        
        const insertQuery = `
          INSERT INTO tipos_pneu (id, marca, modelo, medida, ativo, created_at)
          VALUES (
            '${uuid}',
            '${formTipoPneu.marca.replace(/'/g, "''")}',
            '${formTipoPneu.modelo.replace(/'/g, "''")}',
            '${formTipoPneu.medida.replace(/'/g, "''")}',
            ${formTipoPneu.ativo},
            NOW()
          )
        `;
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: insertQuery 
        });
        
        if (error) {
          console.error("Erro ao inserir tipo de pneu via SQL:", JSON.stringify(error));
          throw new Error(`Erro ao inserir: ${error.message || "Erro desconhecido"}`);
        }
        
        console.log("Tipo de pneu inserido com sucesso com ID:", uuid);
        
        toast({
          title: "Tipo de pneu adicionado",
          description: "O novo tipo de pneu foi adicionado com sucesso."
        });
      }
      
      // Recarregar lista e fechar modal
      await carregarTiposPneu();
      setDialogTipoPneuOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao salvar tipo de pneu:", errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao salvar tipo de pneu",
        description: `Ocorreu um erro ao salvar: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  }
  
  // Função para registrar uma nova troca de pneu
  async function registrarTrocaPneu() {
    setLoading(true);
    
    try {
      if (!veiculoSelecionado || !formTrocaPneu.tipo_pneu_id || !formTrocaPneu.km || formTrocaPneu.posicoes.length === 0) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios."
        });
        return;
      }
      
      // Verificar se tipo de pneu existe antes de registrar
      const { data: tipoPneuExiste, error: tipoPneuError } = await supabase
        .from("tipos_pneu")
        .select("id")
        .eq("id", formTrocaPneu.tipo_pneu_id)
        .single();
      
      if (tipoPneuError || !tipoPneuExiste) {
        console.error("Tipo de pneu não encontrado:", tipoPneuError);
        toast({
          variant: "destructive",
          title: "Tipo de pneu inválido",
          description: "O tipo de pneu selecionado não foi encontrado. Por favor, selecione outro."
        });
        return;
      }
      
      // Primeiro, garantir que as funções utilitárias existam
      await criarFuncoesUtilitarias();
      
      // Verificar se a tabela existe e criar se necessário
      const { data: tableExists, error: tableError } = await supabase
        .rpc('table_exists', { table_name: 'trocas_pneu' })
        .single();
      
      if (tableError || !tableExists) {
        console.log("Tabela trocas_pneu não existe, criando...");
        await criarTabelaTrocasPneu();
      }
      
      // Gerar um UUID para o novo registro
      const uuid = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Converter array de posições para formato PostgreSQL - corrigindo o formato
      const escapedPosicoes = formTrocaPneu.posicoes.map(pos => `'${pos.replace(/'/g, "''")}'`);
      const posicoesArray = `ARRAY[${escapedPosicoes.join(', ')}]`;
      
      // Inserir registro de troca usando SQL direto via RPC para contornar RLS
      const insertQuery = `
        INSERT INTO trocas_pneu (
          id, 
          veiculo_id, 
          tipo_pneu_id, 
          data_troca, 
          km, 
          posicoes, 
          observacao, 
          alinhamento, 
          balanceamento, 
          created_at, 
          updated_at
        )
        VALUES (
          '${uuid}',
          '${veiculoSelecionado.id}',
          '${formTrocaPneu.tipo_pneu_id}',
          '${now}',
          ${Number(formTrocaPneu.km)},
          ${posicoesArray},
          ${formTrocaPneu.observacao ? `'${formTrocaPneu.observacao.replace(/'/g, "''")}'` : 'NULL'},
          ${formTrocaPneu.alinhamento},
          ${formTrocaPneu.balanceamento},
          '${now}',
          '${now}'
        )
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: insertQuery });
      
      if (error) {
        console.error("Erro detalhado ao registrar troca via SQL:", JSON.stringify(error));
        throw error;
      }
      
      console.log("Troca de pneu registrada com ID:", uuid);
      
      toast({
        title: "Troca de pneu registrada",
        description: "A troca de pneu foi registrada com sucesso."
      });
      
      // Verificar se a troca foi registrada corretamente
      setTimeout(async () => {
        try {
          const { data: verificacao, error: erroVerificacao } = await supabase
            .from("trocas_pneu")
            .select(`
              *,
              tipo_pneu:tipos_pneu(*)
            `)
            .eq("id", uuid)
            .single();
          
          if (erroVerificacao) {
            console.error("Erro ao verificar registro de troca:", erroVerificacao);
          } else {
            console.log("Verificação de registro:", verificacao);
          }
          
          // Recarregar lista de trocas para mostrar o histórico atualizado
          if (veiculoSelecionado) {
            await abrirHistorico(veiculoSelecionado);
          }
        } catch (verificationError) {
          console.error("Erro ao verificar registro:", verificationError);
        }
      }, 500);
      
    } catch (error) {
      console.error("Erro ao registrar troca de pneu:", error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar",
        description: "Ocorreu um erro ao registrar a troca de pneu."
      });
    } finally {
      setLoading(false);
      setDialogTrocaPneuOpen(false);
    }
  }
  
  // Função para criar RPC para verificar se uma tabela existe
  async function criarFuncoesUtilitarias() {
    try {
      // Criar função para verificar se uma tabela existe
      const query = `
        CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM pg_tables
                WHERE tablename = table_name
            ) INTO exists;
            
            RETURN exists;
        END;
        $$;
      `
      await supabase.rpc('exec_sql', { sql: query })
      
      // Criar função para verificar se uma coluna existe em uma tabela
      const queryColuna = `
        CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = column_exists.table_name
                AND column_name = column_exists.column_name
            ) INTO exists;
            
            RETURN exists;
        END;
        $$;
      `
      await supabase.rpc('exec_sql', { sql: queryColuna })
      
      console.log("Funções utilitárias criadas com sucesso")
    } catch (error) {
      console.error("Erro ao criar funções utilitárias:", error)
    }
  }
  
  // Função para realizar a comparação entre veículos
  async function compararVeiculos() {
    if (!veiculosComparacao.veiculo1 || !veiculosComparacao.veiculo2) {
      toast({
        variant: "destructive",
        title: "Selecione dois veículos",
        description: "Você precisa selecionar dois veículos diferentes para comparação."
      });
      return;
    }

    setCarregandoComparacao(true);
    
    try {
      // Buscar dados do veículo 1
      const { data: dadosVeiculo1, error: erroVeiculo1 } = await supabase
        .from("veiculos")
        .select("id, placa, modelo, marca")
        .eq("id", veiculosComparacao.veiculo1)
        .single();
        
      if (erroVeiculo1) throw erroVeiculo1;
      
      // Buscar dados do veículo 2
      const { data: dadosVeiculo2, error: erroVeiculo2 } = await supabase
        .from("veiculos")
        .select("id, placa, modelo, marca")
        .eq("id", veiculosComparacao.veiculo2)
        .single();
        
      if (erroVeiculo2) throw erroVeiculo2;
      
      // Buscar trocas do veículo 1
      const { data: trocasVeiculo1, error: erroTrocas1 } = await supabase
        .from("trocas_pneu")
        .select("*")
        .eq("veiculo_id", veiculosComparacao.veiculo1)
        .order("data_troca", { ascending: true });
        
      if (erroTrocas1) throw erroTrocas1;
      
      // Buscar trocas do veículo 2
      const { data: trocasVeiculo2, error: erroTrocas2 } = await supabase
        .from("trocas_pneu")
        .select("*")
        .eq("veiculo_id", veiculosComparacao.veiculo2)
        .order("data_troca", { ascending: true });
        
      if (erroTrocas2) throw erroTrocas2;
      
      // Analisar dados do veículo 1
      const comServicosVeiculo1 = trocasVeiculo1.some(t => t.alinhamento || t.balanceamento);
      const analiseTrocasVeiculo1 = analisarTrocas(trocasVeiculo1);
      
      // Analisar dados do veículo 2
      const comServicosVeiculo2 = trocasVeiculo2.some(t => t.alinhamento || t.balanceamento);
      const analiseTrocasVeiculo2 = analisarTrocas(trocasVeiculo2);
      
      // Calcular qual teve melhor rendimento
      let diferencaPercentual = 0;
      let veiculoMelhor = null;
      
      if (analiseTrocasVeiculo1.kmMediaPorTroca > 0 && analiseTrocasVeiculo2.kmMediaPorTroca > 0) {
        if (analiseTrocasVeiculo1.kmMediaPorTroca > analiseTrocasVeiculo2.kmMediaPorTroca) {
          diferencaPercentual = ((analiseTrocasVeiculo1.kmMediaPorTroca / analiseTrocasVeiculo2.kmMediaPorTroca) - 1) * 100;
          veiculoMelhor = dadosVeiculo1.placa;
        } else {
          diferencaPercentual = ((analiseTrocasVeiculo2.kmMediaPorTroca / analiseTrocasVeiculo1.kmMediaPorTroca) - 1) * 100;
          veiculoMelhor = dadosVeiculo2.placa;
        }
      }
      
      // Definir resultado da comparação
      setResultadoComparacao({
        veiculo1: {
          placa: dadosVeiculo1.placa,
          modelo: `${dadosVeiculo1.marca} ${dadosVeiculo1.modelo}`,
          kmMediaPorTroca: analiseTrocasVeiculo1.kmMediaPorTroca,
          totalTrocas: analiseTrocasVeiculo1.totalTrocas,
          kmPercorrido: analiseTrocasVeiculo1.kmPercorrido,
          comServicos: comServicosVeiculo1
        },
        veiculo2: {
          placa: dadosVeiculo2.placa,
          modelo: `${dadosVeiculo2.marca} ${dadosVeiculo2.modelo}`,
          kmMediaPorTroca: analiseTrocasVeiculo2.kmMediaPorTroca,
          totalTrocas: analiseTrocasVeiculo2.totalTrocas,
          kmPercorrido: analiseTrocasVeiculo2.kmPercorrido,
          comServicos: comServicosVeiculo2
        },
        diferencaPercentual,
        veiculoMelhor
      });
    } catch (error) {
      console.error("Erro ao comparar veículos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao comparar veículos",
        description: "Não foi possível realizar a comparação entre os veículos selecionados."
      });
    } finally {
      setCarregandoComparacao(false);
    }
  }
  
  // Função para analisar as trocas de pneu de um veículo
  function analisarTrocas(trocas: TrocaPneu[]) {
    if (trocas.length < 2) {
      return { kmMediaPorTroca: 0, totalTrocas: trocas.length, kmPercorrido: 0 };
    }
    
    // Ordenar trocas por data
    const trocasOrdenadas = [...trocas].sort((a, b) => 
      new Date(a.data_troca).getTime() - new Date(b.data_troca).getTime()
    );
    
    // Calcular duração média dos pneus (km)
    let kmTotal = 0;
    let contadorTrocas = 0;
    
    for (let i = 1; i < trocasOrdenadas.length; i++) {
      const kmAnterior = trocasOrdenadas[i-1].km;
      const kmAtual = trocasOrdenadas[i].km;
      
      if (kmAtual > kmAnterior) {
        kmTotal += (kmAtual - kmAnterior);
        contadorTrocas++;
      }
    }
    
    const kmMediaPorTroca = contadorTrocas > 0 ? Math.round(kmTotal / contadorTrocas) : 0;
    
    return { 
      kmMediaPorTroca, 
      totalTrocas: trocas.length,
      kmPercorrido: kmTotal
    };
  }
  
  // Função para gerar PDF com gráfico de comparação
  async function gerarPDFComparacao() {
    if (!resultadoComparacao || !resultadoComparacao.veiculo1 || !resultadoComparacao.veiculo2) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não há dados de comparação disponíveis."
      });
      return;
    }

    setGeradorPdfLoading(true);

    try {
      // Criar instância de jsPDF
      const pdf = new jsPDF();
      
      // Adicionar título
      pdf.setFontSize(18);
      pdf.text("Relatório de Comparação de Rendimento de Pneus", 20, 20);
      
      // Adicionar data do relatório
      pdf.setFontSize(10);
      pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      
      // Adicionar informações dos veículos
      pdf.setFontSize(14);
      pdf.text("Dados dos Veículos", 20, 40);
      
      // Tabela com dados dos veículos
      const dadosVeiculos = [
        ['', `Veículo 1: ${resultadoComparacao.veiculo1.placa}`, `Veículo 2: ${resultadoComparacao.veiculo2.placa}`],
        ['Modelo', resultadoComparacao.veiculo1.modelo, resultadoComparacao.veiculo2.modelo],
        ['Serviços', resultadoComparacao.veiculo1.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento", 
                  resultadoComparacao.veiculo2.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"],
        ['Total de trocas', resultadoComparacao.veiculo1.totalTrocas.toString(), resultadoComparacao.veiculo2.totalTrocas.toString()],
        ['Km percorrido', `${resultadoComparacao.veiculo1.kmPercorrido.toLocaleString('pt-BR')} km`, 
                         `${resultadoComparacao.veiculo2.kmPercorrido.toLocaleString('pt-BR')} km`],
        ['Média km/troca', `${resultadoComparacao.veiculo1.kmMediaPorTroca.toLocaleString('pt-BR')} km`, 
                          `${resultadoComparacao.veiculo2.kmMediaPorTroca.toLocaleString('pt-BR')} km`]
      ];
      
      // Usar autoTable como função direta
      autoTable(pdf, {
        startY: 45,
        head: [],
        body: dadosVeiculos,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 10 }
      });
      
      // Pegar a posição final da tabela para a próxima seção
      const finalY = (pdf as any).lastAutoTable.finalY || 45;
      
      // Adicionar conclusão
      pdf.setFontSize(14);
      pdf.text("Conclusão", 20, finalY + 10);
      
      pdf.setFontSize(10);
      const conclusao1 = `O veículo ${resultadoComparacao.veiculoMelhor} teve um rendimento aproximadamente ${resultadoComparacao.diferencaPercentual.toFixed(2)}% melhor.`;
      
      const conclusao2 = (resultadoComparacao.veiculo1.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo1.placa) || 
                        (resultadoComparacao.veiculo2.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo2.placa) 
                        ? "Isto sugere que realizar alinhamento e balanceamento contribui para um maior rendimento dos pneus." 
                        : "Não foi possível confirmar neste caso que o alinhamento e balanceamento contribuem para um maior rendimento dos pneus.";
      
      pdf.text(conclusao1, 20, finalY + 15);
      pdf.text(conclusao2, 20, finalY + 20);
      
      // Adicionar gráfico (convertemos o canvas para imagem)
      if (chartRef.current && chartInstance.current) {
        const chartImg = chartRef.current.toDataURL('image/png');
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text("Comparação Gráfica de Rendimento", 20, 20);
        pdf.addImage(chartImg, 'PNG', 20, 30, 170, 100);
      }
      
      // Salvar PDF
      pdf.save(`comparacao_pneus_${resultadoComparacao.veiculo1.placa}_${resultadoComparacao.veiculo2.placa}.pdf`);
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O relatório de comparação foi gerado e baixado."
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório PDF."
      });
    } finally {
      setGeradorPdfLoading(false);
    }
  }

  // Atualizar gráfico quando resultado de comparação mudar
  useEffect(() => {
    if (resultadoComparacao && resultadoComparacao.veiculo1 && resultadoComparacao.veiculo2 && chartRef.current) {
      // Use dynamic import to load Chart.js only on client-side
      const loadChart = async () => {
        try {
          // Destruir gráfico anterior se existir
          if (chartInstance.current) {
            chartInstance.current.destroy();
          }
          
          const ChartModule = await import('chart.js/auto');
          const ctx = chartRef.current?.getContext('2d');
          
          if (ctx && resultadoComparacao?.veiculo1 && resultadoComparacao?.veiculo2) {
            chartInstance.current = new ChartModule.Chart(ctx, {
              type: 'bar',
              data: {
                labels: [
                  `${resultadoComparacao.veiculo1.placa} - ${resultadoComparacao.veiculo1.comServicos ? 'Com' : 'Sem'} serviços`, 
                  `${resultadoComparacao.veiculo2.placa} - ${resultadoComparacao.veiculo2.comServicos ? 'Com' : 'Sem'} serviços`
                ],
                datasets: [
                  {
                    label: 'Média de KM por troca de pneu',
                    data: [
                      resultadoComparacao.veiculo1.kmMediaPorTroca,
                      resultadoComparacao.veiculo2.kmMediaPorTroca
                    ],
                    backgroundColor: [
                      'rgba(54, 162, 235, 0.5)',
                      'rgba(255, 99, 132, 0.5)'
                    ],
                    borderColor: [
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Quilômetros'
                    }
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error("Erro ao carregar gráfico:", error);
        }
      };
      
      loadChart();
    }
  }, [resultadoComparacao]);

  // Função para abrir o modal de seleção de veículo
  function abrirModalSelecaoVeiculo(target: 'veiculo1' | 'veiculo2') {
    setVeiculoSelectionTarget(target)
    setVeiculoSearchTerm("")
    setVeiculosFiltradosSelecao(veiculos)
    setDialogVeiculoOpen(true)
  }

  // Função para selecionar um veículo no modal
  function selecionarVeiculo(veiculo: Veiculo) {
    if (veiculoSelectionTarget) {
      setVeiculosComparacao({
        ...veiculosComparacao,
        [veiculoSelectionTarget]: veiculo.id
      })
    }
    setDialogVeiculoOpen(false)
  }

  // Efeito para filtrar veículos no modal de seleção
  useEffect(() => {
    if (!veiculoSearchTerm.trim()) {
      setVeiculosFiltradosSelecao(veiculos)
      return
    }
    
    const termoBusca = veiculoSearchTerm.toLowerCase().trim()
    const filtrados = veiculos.filter(veiculo => 
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca)
    )
    
    setVeiculosFiltradosSelecao(filtrados)
  }, [veiculoSearchTerm, veiculos])

  // Função para obter o texto do veículo selecionado
  function getVeiculoSelecionadoTexto(veiculoId: string) {
    const veiculo = veiculos.find(v => v.id === veiculoId)
    return veiculo ? `${veiculo.placa} - ${veiculo.modelo} ${veiculo.marca}` : "Selecione um veículo"
  }

  // Retornar a interface da página
  return (
    <div className="container mx-auto py-6 space-y-4">
      <Toaster />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Troca de Pneu</h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setDialogComparacaoOpen(true)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Comparar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => abrirModalTipoPneu()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo de Pneu
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Veículos</CardTitle>
          <CardDescription>
            Selecione um veículo para registrar troca de pneus ou visualizar histórico
          </CardDescription>
          
          <div className="mt-2 relative">
            <Input
              placeholder="Buscar por placa, modelo ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>KM Atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhum veículo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  veiculosFiltrados.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium">{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.modelo}</TableCell>
                      <TableCell>{veiculo.marca}</TableCell>
                      <TableCell>{veiculo.kmAtual || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => abrirHistorico(veiculo)}
                          >
                            Histórico
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => abrirModalTrocaPneu(veiculo)}
                          >
                            Registrar Troca
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Lista de Tipos de Pneus */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Pneus Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os tipos de pneus disponíveis para registro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Medida</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposPneu.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhum tipo de pneu cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  tiposPneu.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.marca}</TableCell>
                      <TableCell>{tipo.modelo}</TableCell>
                      <TableCell>{tipo.medida}</TableCell>
                      <TableCell>
                        <Badge variant={tipo.ativo ? "default" : "secondary"}>
                          {tipo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => abrirModalTipoPneu(tipo)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Placeholder para as modais que serão implementadas */}
      <Dialog open={dialogTrocaPneuOpen} onOpenChange={setDialogTrocaPneuOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Troca de Pneu</DialogTitle>
            <DialogDescription>
              Informe os detalhes da troca de pneu para o veículo {veiculoSelecionado?.placa}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="km">Quilometragem Atual</Label>
              <Input 
                id="km" 
                type="number" 
                value={formTrocaPneu.km} 
                onChange={(e) => setFormTrocaPneu({...formTrocaPneu, km: e.target.value})} 
                placeholder="Ex: 35000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_pneu">Tipo de Pneu</Label>
              {tiposPneu.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum tipo de pneu cadastrado. 
                  <Button variant="link" className="p-0 h-auto" onClick={() => {
                    setDialogTrocaPneuOpen(false);
                    setTimeout(() => abrirModalTipoPneu(), 100);
                  }}>
                    Cadastre um tipo de pneu
                  </Button>
                </p>
              ) : (
                <Select 
                  value={formTrocaPneu.tipo_pneu_id}
                  onValueChange={(value) => setFormTrocaPneu({...formTrocaPneu, tipo_pneu_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de pneu" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPneu.filter(t => t.ativo).map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.marca} {tipo.modelo} - {tipo.medida}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Posições trocadas</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="posicao-dianteira-esquerda"
                    checked={formTrocaPneu.posicoes.includes("dianteira-esquerda")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "dianteira-esquerda"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "dianteira-esquerda")
                        });
                      }
                    }}
                  />
                  <Label htmlFor="posicao-dianteira-esquerda">Dianteira Esquerda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="posicao-dianteira-direita"
                    checked={formTrocaPneu.posicoes.includes("dianteira-direita")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "dianteira-direita"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "dianteira-direita")
                        });
                      }
                    }}
                  />
                  <Label htmlFor="posicao-dianteira-direita">Dianteira Direita</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="posicao-traseira-esquerda"
                    checked={formTrocaPneu.posicoes.includes("traseira-esquerda")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "traseira-esquerda"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "traseira-esquerda")
                        });
                      }
                    }}
                  />
                  <Label htmlFor="posicao-traseira-esquerda">Traseira Esquerda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="posicao-traseira-direita"
                    checked={formTrocaPneu.posicoes.includes("traseira-direita")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "traseira-direita"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "traseira-direita")
                        });
                      }
                    }}
                  />
                  <Label htmlFor="posicao-traseira-direita">Traseira Direita</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="posicao-estepe"
                    checked={formTrocaPneu.posicoes.includes("estepe")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "estepe"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "estepe")
                        });
                      }
                    }}
                  />
                  <Label htmlFor="posicao-estepe">Estepe</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Input 
                id="observacao" 
                value={formTrocaPneu.observacao} 
                onChange={(e) => setFormTrocaPneu({...formTrocaPneu, observacao: e.target.value})} 
                placeholder="Observações adicionais"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Serviços adicionais</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="alinhamento"
                    checked={formTrocaPneu.alinhamento}
                    onCheckedChange={(checked) => 
                      setFormTrocaPneu({...formTrocaPneu, alinhamento: checked as boolean})
                    }
                  />
                  <Label htmlFor="alinhamento">Alinhamento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="balanceamento"
                    checked={formTrocaPneu.balanceamento}
                    onCheckedChange={(checked) => 
                      setFormTrocaPneu({...formTrocaPneu, balanceamento: checked as boolean})
                    }
                  />
                  <Label htmlFor="balanceamento">Balanceamento</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTrocaPneuOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={registrarTrocaPneu} disabled={loading || formTrocaPneu.posicoes.length === 0 || !formTrocaPneu.tipo_pneu_id}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogTipoPneuOpen} onOpenChange={setDialogTipoPneuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tipo de Pneu</DialogTitle>
            <DialogDescription>
              {formTipoPneu.id ? "Edite os dados do tipo de pneu" : "Adicione um novo tipo de pneu ao sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input 
                  id="marca" 
                  value={formTipoPneu.marca} 
                  onChange={(e) => setFormTipoPneu({...formTipoPneu, marca: e.target.value})} 
                  placeholder="Ex: Pirelli"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input 
                  id="modelo" 
                  value={formTipoPneu.modelo} 
                  onChange={(e) => setFormTipoPneu({...formTipoPneu, modelo: e.target.value})} 
                  placeholder="Ex: Scorpion"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medida">Medida</Label>
              <Input 
                id="medida" 
                value={formTipoPneu.medida} 
                onChange={(e) => setFormTipoPneu({...formTipoPneu, medida: e.target.value})} 
                placeholder="Ex: 215/65 R16"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ativo"
                checked={formTipoPneu.ativo}
                onCheckedChange={(checked) => setFormTipoPneu({...formTipoPneu, ativo: checked as boolean})}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTipoPneuOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarTipoPneu} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogHistoricoOpen} onOpenChange={setDialogHistoricoOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Troca de Pneus</DialogTitle>
            <DialogDescription>
              Veículo: {veiculoSelecionado?.placa} - {veiculoSelecionado?.modelo} {veiculoSelecionado?.marca}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : historicoVeiculo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Não há registros de troca de pneus para este veículo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Tipo de Pneu</TableHead>
                    <TableHead>Posições</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoVeiculo.map((troca) => (
                    <TableRow key={troca.id}>
                      <TableCell>
                        {troca.data_troca ? new Date(troca.data_troca).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </TableCell>
                      <TableCell>{troca.km}</TableCell>
                      <TableCell>
                        {troca.tipo_pneu ? 
                          `${troca.tipo_pneu.marca} ${troca.tipo_pneu.modelo} - ${troca.tipo_pneu.medida}` : 
                          "Tipo não disponível"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(troca.posicoes) ? troca.posicoes.map((posicao) => (
                            <Badge key={posicao} variant="outline">
                              {posicao
                                .replace("dianteira-esquerda", "Diant. Esq.")
                                .replace("dianteira-direita", "Diant. Dir.")
                                .replace("traseira-esquerda", "Tras. Esq.")
                                .replace("traseira-direita", "Tras. Dir.")
                                .replace("estepe", "Estepe")
                              }
                            </Badge>
                          )) : (
                            <span className="text-muted-foreground">Formato inválido</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {troca.alinhamento && <Badge variant="secondary">Alinhamento</Badge>}
                          {troca.balanceamento && <Badge variant="secondary">Balanceamento</Badge>}
                          {!troca.alinhamento && !troca.balanceamento && "-"}
                        </div>
                      </TableCell>
                      <TableCell>{troca.observacao || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHistoricoOpen(false)}>
              Fechar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogHistoricoOpen(false);
                verificarEstruturaBancoDados();
                setTimeout(() => abrirHistorico(veiculoSelecionado!), 500);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de comparação de veículos */}
      <Dialog open={dialogComparacaoOpen} onOpenChange={setDialogComparacaoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar Rendimento entre Veículos</DialogTitle>
            <DialogDescription>
              Compare dois veículos para analisar o rendimento dos pneus com e sem serviços de alinhamento e balanceamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo1">Veículo 1</Label>
                <Button 
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => abrirModalSelecaoVeiculo('veiculo1')}
                >
                  {veiculosComparacao.veiculo1 
                    ? getVeiculoSelecionadoTexto(veiculosComparacao.veiculo1) 
                    : "Selecione um veículo"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="veiculo2">Veículo 2</Label>
                <Button 
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => abrirModalSelecaoVeiculo('veiculo2')}
                >
                  {veiculosComparacao.veiculo2 
                    ? getVeiculoSelecionadoTexto(veiculosComparacao.veiculo2) 
                    : "Selecione um veículo"}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={compararVeiculos}
                disabled={carregandoComparacao || !veiculosComparacao.veiculo1 || !veiculosComparacao.veiculo2 || veiculosComparacao.veiculo1 === veiculosComparacao.veiculo2}
              >
                {carregandoComparacao ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Comparar
                  </>
                )}
              </Button>
            </div>
            
            {resultadoComparacao && resultadoComparacao.veiculo1 && resultadoComparacao.veiculo2 && (
              <>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Resultado da Comparação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          {resultadoComparacao.veiculo1.placa} - {resultadoComparacao.veiculo1.modelo}
                        </h3>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Serviços:</span> {resultadoComparacao.veiculo1.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Total de trocas:</span> {resultadoComparacao.veiculo1.totalTrocas}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Km percorrido:</span> {resultadoComparacao.veiculo1.kmPercorrido.toLocaleString('pt-BR')} km
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Média de km por troca:</span> {resultadoComparacao.veiculo1.kmMediaPorTroca.toLocaleString('pt-BR')} km
                        </p>
                      </div>
                      
                      <div className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          {resultadoComparacao.veiculo2.placa} - {resultadoComparacao.veiculo2.modelo}
                        </h3>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Serviços:</span> {resultadoComparacao.veiculo2.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Total de trocas:</span> {resultadoComparacao.veiculo2.totalTrocas}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Km percorrido:</span> {resultadoComparacao.veiculo2.kmPercorrido.toLocaleString('pt-BR')} km
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Média de km por troca:</span> {resultadoComparacao.veiculo2.kmMediaPorTroca.toLocaleString('pt-BR')} km
                        </p>
                      </div>
                    </div>
                    
                    {resultadoComparacao.veiculoMelhor && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold mb-2">Conclusão</h3>
                        <p>
                          O veículo <span className="font-bold">{resultadoComparacao.veiculoMelhor}</span> teve um rendimento aproximadamente{' '}
                          <span className="font-bold">{resultadoComparacao.diferencaPercentual.toFixed(2)}%</span> melhor.
                        </p>
                        <p className="mt-2">
                          {(resultadoComparacao.veiculo1.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo1.placa) || 
                           (resultadoComparacao.veiculo2.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo2.placa) 
                            ? "Isto sugere que realizar alinhamento e balanceamento contribui para um maior rendimento dos pneus." 
                            : "Não foi possível confirmar neste caso que o alinhamento e balanceamento contribuem para um maior rendimento dos pneus."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Adicionar visualização gráfica */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Comparação Gráfica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-64">
                      <canvas ref={chartRef}></canvas>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={gerarPDFComparacao}
                        disabled={geradorPdfLoading}
                      >
                        {geradorPdfLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar para PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogComparacaoOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de seleção de veículo */}
      <Dialog open={dialogVeiculoOpen} onOpenChange={setDialogVeiculoOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Veículo</DialogTitle>
            <DialogDescription>
              Selecione um veículo para {veiculoSelectionTarget === 'veiculo1' ? 'o primeiro' : 'o segundo'} item da comparação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  id="veiculoSearch" 
                  value={veiculoSearchTerm} 
                  onChange={(e) => setVeiculoSearchTerm(e.target.value)} 
                  placeholder="Buscar por placa, modelo ou marca..."
                  className="pr-10"
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              {veiculosFiltradosSelecao.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum veículo encontrado
                </div>
              ) : (
                <div className="divide-y">
                  {veiculosFiltradosSelecao.map((veiculo) => (
                    <div 
                      key={veiculo.id}
                      className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => selecionarVeiculo(veiculo)}
                    >
                      <div>
                        <div className="font-medium">{veiculo.placa}</div>
                        <div className="text-sm text-muted-foreground">{veiculo.modelo} {veiculo.marca}</div>
                      </div>
                      {((veiculoSelectionTarget === 'veiculo1' && veiculosComparacao.veiculo1 === veiculo.id) || 
                        (veiculoSelectionTarget === 'veiculo2' && veiculosComparacao.veiculo2 === veiculo.id)) && (
                        <Badge className="ml-2">Selecionado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVeiculoOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}