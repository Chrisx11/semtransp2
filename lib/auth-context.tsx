"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabase"
import { useRouter } from "next/navigation"
import { Session } from "@supabase/supabase-js"

// Submódulos específicos para Ordem de Serviço
type SubmoduloOrdemServico = "todos" | "oficina" | "almoxarifado" | "compras" | "finalizadas"

// Submódulos específicos para Manutenções
type SubmoduloManutencao = "todos" | "painel" | "ordem-servico" | "troca-oleo" | "historicos" | "planejamento"

// Tipo para o usuário logado
export interface AuthUser {
  id: string
  nome: string
  sobrenome: string
  login: string
  perfil: string
  ativo: boolean
  permissoes_customizadas?: any
}

// Mapeamento entre rotas e permissões necessárias
export const rotasPermissoes: Record<string, {
  modulo: string; 
  acao: string; 
  submodulo?: boolean;
  pagina?: string;
}> = {
  "/dashboard": { modulo: "dashboard", acao: "visualizar" },
  "/dashboard/veiculos": { modulo: "veiculos", acao: "visualizar" },
  "/dashboard/produtos": { modulo: "produtos", acao: "visualizar" },
  "/dashboard/colaboradores": { modulo: "veiculos", acao: "visualizar" }, // Usando veículos como permissão temporária
  "/dashboard/manutencoes/painel": { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "painel" },
  "/dashboard/manutencoes/ordem-servico": { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "ordem-servico" },
  "/dashboard/manutencoes/planejamento": { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "planejamento" },
  "/dashboard/manutencoes/troca-oleo": { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "troca-oleo" },
  "/dashboard/manutencoes/historicos": { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "historicos" },
  "/dashboard/movimento/entradas": { modulo: "produtos", acao: "visualizar" },
  "/dashboard/movimento/saidas": { modulo: "produtos", acao: "visualizar" },
  "/dashboard/configuracoes": { modulo: "configuracoes", acao: "visualizar" },
}

// Interface para permissões de ordem de serviço
interface OrdemServicoPermissoes {
  acoes: string[];
  submodulos: SubmoduloOrdemServico[];
}

// Interface para permissões de manutenções
interface ManutencoesPermissoes {
  acoes: string[];
  submodulos: SubmoduloManutencao[];
}

// Interface para todas as permissões
interface Permissoes {
  dashboard: string[];
  veiculos: string[];
  produtos: string[];
  ordemServico: OrdemServicoPermissoes;
  manutencoes: ManutencoesPermissoes;
  relatorios: string[];
  configuracoes: string[];
  [key: string]: any;
}

// Permissões padrão para cada tipo de perfil
const permissoesPreDefinidas: Record<string, Permissoes> = {
  admin: {
    dashboard: ["visualizar"],
    veiculos: ["visualizar", "criar", "editar", "excluir"],
    produtos: ["visualizar", "criar", "editar", "excluir"],
    ordemServico: {
      acoes: ["visualizar", "criar", "editar", "excluir"],
      submodulos: ["todos", "oficina", "almoxarifado", "compras"]
    },
    manutencoes: {
      acoes: ["visualizar", "criar", "editar", "excluir"],
      submodulos: ["todos", "painel", "ordem-servico", "troca-oleo", "historicos", "planejamento"]
    },
    relatorios: ["visualizar", "criar"],
    configuracoes: ["visualizar", "criar", "editar", "excluir"]
  },
  gestor: {
    dashboard: ["visualizar"],
    veiculos: ["visualizar", "criar", "editar"],
    produtos: ["visualizar", "criar", "editar"],
    ordemServico: {
      acoes: ["visualizar", "editar"],
      submodulos: ["todos", "oficina", "almoxarifado", "compras"]
    },
    manutencoes: {
      acoes: ["visualizar", "criar", "editar"],
      submodulos: ["todos", "painel", "ordem-servico", "troca-oleo", "historicos", "planejamento"]
    },
    relatorios: ["visualizar", "criar"],
    configuracoes: ["visualizar"]
  },
  almoxarifado: {
    dashboard: ["visualizar"],
    veiculos: ["visualizar"],
    produtos: ["visualizar", "criar", "editar", "excluir"],
    ordemServico: {
      acoes: ["visualizar"],
      submodulos: ["almoxarifado"]
    },
    manutencoes: {
      acoes: ["visualizar"],
      submodulos: ["painel", "ordem-servico", "planejamento"]
    },
    relatorios: ["visualizar"],
    configuracoes: []
  },
  oficina: {
    dashboard: ["visualizar"],
    veiculos: ["visualizar"],
    produtos: ["visualizar"],
    ordemServico: {
      acoes: ["visualizar", "editar", "criar"],
      submodulos: ["oficina", "finalizadas"]
    },
    manutencoes: {
      acoes: ["visualizar", "criar", "editar"],
      submodulos: ["ordem-servico", "troca-oleo", "planejamento"]
    },
    relatorios: ["visualizar"],
    configuracoes: []
  },
  basico: {
    dashboard: ["visualizar"],
    veiculos: ["visualizar"],
    produtos: ["visualizar"],
    ordemServico: {
      acoes: ["visualizar"],
      submodulos: ["compras"]
    },
    manutencoes: {
      acoes: ["visualizar"],
      submodulos: ["painel", "planejamento"]
    },
    relatorios: ["visualizar"],
    configuracoes: []
  }
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (login: string, senha: string) => Promise<{ success: boolean, message: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  verificarPermissao: (caminho: string) => boolean
}

// Criar contexto com valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false, message: "Contexto não inicializado" }),
  logout: async () => {},
  isAuthenticated: false,
  verificarPermissao: () => false
})

// Hook para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext)

// Função auxiliar para obter um cookie por nome
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null; // Verificação para SSR
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Provedor do contexto de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Verificar se há um usuário na sessão ao carregar
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let sessionError: Error | null = null;
    
    const checkSession = async () => {
      try {
        setLoading(true)
        sessionError = null;
        
        // Verificar se há um usuário no localStorage
        const storedUser = localStorage.getItem("authUser")
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Configurar cookie para persistência adicional
          document.cookie = `semtransp_auth=${parsedUser.id}; path=/; max-age=2592000; SameSite=Strict`; // 30 dias
        } else {
          // Se não tiver no localStorage, verificar se existe o cookie de autenticação
          const authCookie = getCookie('semtransp_auth');
          
          if (authCookie) {
            // Tentar obter os dados do usuário a partir do Supabase
            try {
              console.log("Restaurando sessão a partir do cookie:", authCookie);
              
              // Buscar o usuário pelo ID
              const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", authCookie)
                .single();
              
              if (data && !error) {
                console.log("Usuário restaurado a partir do cookie");
                
                // Buscar todas as permissões necessárias
                const { data: modulePermissions, error: moduleError } = await supabase
                  .from('user_module_permissions')
                  .select('*, module:modules(*)')
                  .eq('user_id', data.id);
                
                const { data: osTabPermissions, error: osTabError } = await supabase
                  .from('user_os_tab_permissions')
                  .select('*, os_tab:os_tabs(*)')
                  .eq('user_id', data.id);
                
                if (moduleError || osTabError) {
                  console.error("Erro ao buscar permissões:", moduleError || osTabError);
                  // Usar permissões básicas como fallback
                  const authUser: AuthUser = {
                    id: data.id,
                    nome: data.name,
                    sobrenome: "",
                    login: data.username,
                    perfil: "basico", // Fallback para permissões básicas
                    ativo: data.active,
                    permissoes_customizadas: permissoesPreDefinidas.basico
                  };
                  
                  setUser(authUser);
                  localStorage.setItem("authUser", JSON.stringify(authUser));
                } else {
                  // Processar as permissões como na função login
                  // Formatação simplificada para este exemplo
                  const authUser: AuthUser = {
                    id: data.id,
                    nome: data.name,
                    sobrenome: "",
                    login: data.username,
                    perfil: "customizado",
                    ativo: data.active,
                    permissoes_customizadas: {
                      dashboard: ["visualizar"],
                      veiculos: ["visualizar"],
                      produtos: ["visualizar"],
                      // Dados simplificados, você deve processar modulePermissions e osTabPermissions adequadamente
                      manutencoes: {
                        acoes: ["visualizar"],
                        submodulos: ["painel", "troca-oleo", "ordem-servico"]
                      },
                      ordemServico: {
                        acoes: ["visualizar"],
                        submodulos: ["oficina"]
                      },
                      configuracoes: [],
                      relatorios: ["visualizar"]
                    }
                  };
                  
                  setUser(authUser);
                  localStorage.setItem("authUser", JSON.stringify(authUser));
                }
              } else {
                // Cookie inválido, remover
                document.cookie = "semtransp_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
              }
            } catch (e) {
              console.error("Erro ao restaurar sessão do cookie:", e);
              // Remover cookie inválido
              document.cookie = "semtransp_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
            }
          }
        }
      } catch (error) {
        sessionError = error as Error;
        console.error("Erro ao verificar sessão:", error);
        setError("Falha ao verificar sessão");
        
        // Tentar novamente em caso de erro (pode ser um problema temporário de rede)
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Tentando reconectar (${retryCount}/${maxRetries})...`);
          // Esperar um pouco antes de tentar novamente (tempo crescente)
          setTimeout(checkSession, 1000 * retryCount);
          return; // Não setar loading como false ainda
        }
      } finally {
        // Só definir loading como false se não estiver em uma tentativa de reconexão
        if (retryCount >= maxRetries || !sessionError) {
          setLoading(false);
        }
      }
    }

    // Verificar se a sessão existe
    checkSession();
    
    // Também verificar periodicamente a validade do cookie (a cada 5 minutos)
    const intervalId = setInterval(() => {
      const authCookie = getCookie('semtransp_auth');
      const storedUser = localStorage.getItem("authUser");
      
      // Se tiver cookie mas não tiver usuário no localStorage, restaurar
      if (authCookie && !storedUser) {
        console.log("Detectada inconsistência - restaurando sessão");
        checkSession();
      }
      // Se não tiver cookie mas tiver usuário, revalidar o cookie
      else if (!authCookie && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        document.cookie = `semtransp_auth=${parsedUser.id}; path=/; max-age=2592000; SameSite=Strict`;
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => {
      clearInterval(intervalId);
    };
  }, [])

  // Verificar permissão para uma rota específica
  const verificarPermissao = (caminho: string): boolean => {
    // Se não há usuário, não tem permissão
    if (!user) return false
    
    // Log especial para página de troca de óleo
    if (caminho.includes("troca-oleo")) {
      console.log("=-=-=-=-= VERIFICANDO PERMISSÃO PARA TROCA DE ÓLEO =-=-=-=-=");
      console.log("Usuário:", user.nome);
      console.log("Perfil:", user.perfil);
      if (user.permissoes_customizadas) {
        console.log("Permissões customizadas:", user.permissoes_customizadas);
        console.log("Módulo manutenções - ações:", user.permissoes_customizadas.manutencoes?.acoes);
        console.log("Módulo manutenções - submódulos:", user.permissoes_customizadas.manutencoes?.submodulos);
        console.log("Contém troca-oleo?", user.permissoes_customizadas.manutencoes?.submodulos?.includes("troca-oleo"));
      }
    }
    
    // Admin tem acesso a tudo
    if (user.perfil === "admin") return true
    
    // Usuário oficina tem acesso explícito às rotas de ordem de serviço e manutenções específicas
    if (user.perfil === "oficina") {
      // Acesso ao dashboard
      if (caminho === "/dashboard") return true;
      
      // Acesso à página de ordem-servico
      if (caminho === "/dashboard/manutencoes/ordem-servico") return true;
      
      // Acesso à página de troca-oleo
      if (caminho === "/dashboard/manutencoes/troca-oleo") return true;
      
      // Acesso a visualização de veículos
      if (caminho === "/dashboard/veiculos") return true;
      
      // Para outras rotas, continuamos com a verificação normal
    }
    
    // Obter configuração da rota
    // Primeiro verificamos rotas exatas, depois rotas que começam com o padrão
    let rotaConfig = rotasPermissoes[caminho];
    if (!rotaConfig) {
      // Verificar se o caminho começa com alguma das rotas registradas
      const rotaBase = Object.keys(rotasPermissoes).find(r => 
        caminho.startsWith(r) && (caminho === r || caminho[r.length] === '/')
      );
      if (rotaBase) {
        rotaConfig = rotasPermissoes[rotaBase];
      }
    }
    
    // Se não houver configuração para esta rota, negamos acesso
    if (!rotaConfig) return false;
    
    // Obter permissões do usuário (customizadas ou do perfil)
    const permissoes = user.permissoes_customizadas || 
                        (user.perfil !== "customizado" ? permissoesPreDefinidas[user.perfil] : permissoesPreDefinidas.basico);
    
    // Verificar permissão específica
    const { modulo, acao, submodulo, pagina } = rotaConfig;
    
    // Log para debug
    console.log("Verificando permissão:", { 
      caminho, modulo, acao, submodulo, pagina, 
      perfil: user.perfil
    });
    
    // Caso especial para ordem de serviço
    if (modulo === "ordemServico" && submodulo) {
      // Se o usuário não tem permissão para visualizar ordem de serviço, nega acesso
      if (!permissoes.ordemServico?.acoes?.includes(acao)) {
        console.log("Permissão negada: sem permissão para ação em ordem de serviço");
        return false;
      }
      
      // Verifica se tem permissão para o submódulo específico (oficina/almoxarifado/etc)
      const submodulos = permissoes.ordemServico?.submodulos || [];
      console.log("Submódulos permitidos:", submodulos);
      
      // Se tem permissão para "todos" os submódulos, permite acesso
      if (submodulos.includes("todos")) {
        console.log("Permissão concedida: tem acesso a todos os submódulos");
        return true;
      }
      
      // Extrai o submódulo da URL (para ordem-servico, geralmente é "oficina", "almoxarifado", etc.)
      const urlPartes = caminho.split('/');
      const submoduloUrl = urlPartes[urlPartes.length - 1];
      
      // Verifica se tem permissão para este submódulo específico
      const temPermissao = submodulos.includes(submoduloUrl);
      console.log(`Verificando permissão para submódulo ${submoduloUrl}: ${temPermissao}`);
      return temPermissao;
    }
    
    // Caso especial para manutenções
    if (modulo === "manutencoes" && submodulo) {
      // Se o usuário não tem permissão para visualizar manutenções, nega acesso
      if (!permissoes.manutencoes?.acoes?.includes(acao)) {
        console.log("Permissão negada: sem permissão para ação em manutenções");
        return false;
      }
      
      // Verifica se tem permissão para o submódulo específico (painel/ordem-servico/etc)
      const submodulos = permissoes.manutencoes?.submodulos || [];
      console.log("Submódulos de manutenções permitidos:", submodulos);
      
      // Log especial para debug de troca-oleo
      if (pagina === "troca-oleo") {
        console.log("Verificando acesso específico para troca-oleo...");
        console.log("Página solicitada:", pagina);
        console.log("Permissões contém troca-oleo?", submodulos.includes("troca-oleo"));
      }
      
      // Se tem permissão para "todos" os submódulos, permite acesso
      if (submodulos.includes("todos")) {
        console.log("Permissão concedida: tem acesso a todos os submódulos de manutenções");
        return true;
      }
      
      // Verifica se tem permissão para esta página específica
      const temPermissao = pagina ? submodulos.includes(pagina) : false;
      console.log(`Verificando permissão para página ${pagina}: ${temPermissao}`);
      return temPermissao;
    }
    
    // Para outros módulos, verificamos se a ação está incluída
    const temPermissao = Array.isArray(permissoes[modulo]) && permissoes[modulo].includes(acao);
    console.log(`Verificando permissão para módulo ${modulo} e ação ${acao}: ${temPermissao}`);
    return temPermissao;
  };

  // Função para fazer login
  const login = async (login: string, senha: string) => {
    try {
      setLoading(true)
      setError(null)

      // Validar entrada
      if (!login || !senha) {
        setError("Login e senha são obrigatórios")
        return { success: false, message: "Login e senha são obrigatórios" }
      }

      // Buscar usuário pelo login (agora usando a tabela 'users')
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", login.trim())
        .single()

      if (error) {
        console.error("Erro ao buscar usuário:", error)
        setError("Usuário não encontrado")
        return { success: false, message: "Usuário não encontrado" }
      }

      if (!data) {
        setError("Credenciais inválidas")
        return { success: false, message: "Credenciais inválidas" }
      }

      // Verificar se o usuário está ativo
      if (!data.active) {
        setError("Usuário inativo. Contate o administrador.")
        return { success: false, message: "Usuário inativo. Contate o administrador." }
      }

      // Verificar senha
      if (data.password !== senha) {
        setError("Senha incorreta")
        return { success: false, message: "Senha incorreta" }
      }

      // Buscar permissões do módulo do usuário
      const { data: modulePermissions, error: moduleError } = await supabase
        .from('user_module_permissions')
        .select('*, module:modules(*)')
        .eq('user_id', data.id)
      
      if (moduleError) {
        console.error("Erro ao buscar permissões:", moduleError)
        setError("Erro ao carregar permissões")
        return { success: false, message: "Erro ao carregar permissões" }
      }
      
      // Buscar permissões de abas de OS do usuário
      const { data: osTabPermissions, error: osTabError } = await supabase
        .from('user_os_tab_permissions')
        .select('*, os_tab:os_tabs(*)')
        .eq('user_id', data.id)
      
      if (osTabError) {
        console.error("Erro ao buscar permissões de OS:", osTabError)
        setError("Erro ao carregar permissões")
        return { success: false, message: "Erro ao carregar permissões" }
      }
      
      // Formatar as permissões no formato esperado pelo sistema
      const formattedPermissions = {
        dashboard: modulePermissions
          .filter(p => p.module.id === 'dashboard')
          .map(p => p.can_view ? 'visualizar' : []),
        veiculos: modulePermissions
          .filter(p => p.module.id === 'veiculos')
          .map(p => {
            const perms = [];
            if (p.can_view) perms.push('visualizar');
            if (p.can_edit) perms.push('criar', 'editar', 'excluir');
            return perms;
          }).flat(),
        produtos: modulePermissions
          .filter(p => p.module.id === 'produtos')
          .map(p => {
            const perms = [];
            if (p.can_view) perms.push('visualizar');
            if (p.can_edit) perms.push('criar', 'editar', 'excluir');
            return perms;
          }).flat(),
        ordemServico: {
          acoes: (() => {
            const osModule = modulePermissions.find(p => p.module.id === 'ordemServico');
            const perms = [];
            if (osModule?.can_view) perms.push('visualizar');
            if (osModule?.can_edit) perms.push('criar', 'editar', 'excluir');
            return perms;
          })(),
          submodulos: osTabPermissions
            .filter(p => p.has_access)
            .map(p => p.os_tab.id as SubmoduloOrdemServico)
        },
        manutencoes: {
          acoes: (() => {
            // Verificar se tem permissão de visualização para qualquer módulo de manutenção
            const trocaOleoModule = modulePermissions.find(p => p.module.id === 'trocaOleo');
            const painelModule = modulePermissions.find(p => p.module.id === 'painel');
            const historicoModule = modulePermissions.find(p => p.module.id === 'historico');
            const planejamentoModule = modulePermissions.find(p => p.module.id === 'planejamento');
            
            const perms = [];
            
            // Se tem permissão para visualizar qualquer submódulo, adiciona visualização para o módulo pai
            if (trocaOleoModule?.can_view || painelModule?.can_view || historicoModule?.can_view || planejamentoModule?.can_view) {
              perms.push('visualizar');
            }
            
            // Se tem permissão para editar qualquer submódulo, adiciona essas permissões
            if (trocaOleoModule?.can_edit || painelModule?.can_edit || historicoModule?.can_edit || planejamentoModule?.can_edit) {
              perms.push('criar', 'editar', 'excluir');
            }
            
            return perms;
          })(),
          submodulos: (() => {
            const submodulos: SubmoduloManutencao[] = [];
            
            // Verificar cada submódulo e adicionar se tiver permissão
            const trocaOleoModule = modulePermissions.find(p => p.module.id === 'trocaOleo');
            const painelModule = modulePermissions.find(p => p.module.id === 'painel');
            const historicoModule = modulePermissions.find(p => p.module.id === 'historico');
            const planejamentoModule = modulePermissions.find(p => p.module.id === 'planejamento');
            
            // Adicionar acesso à ordem de serviço se tiver permissão para esse módulo
            const osModule = modulePermissions.find(p => p.module.id === 'ordemServico');
            if (osModule?.can_view) {
              submodulos.push('ordem-servico');
            }
            
            // Adicionar outros submodulos
            if (painelModule?.can_view) submodulos.push('painel');
            if (trocaOleoModule?.can_view) submodulos.push('troca-oleo');
            if (historicoModule?.can_view) submodulos.push('historicos');
            if (planejamentoModule?.can_view) submodulos.push('planejamento');
            
            // Log especial para debug do planejamento
            console.log("Verificando permissão para planejamento:", planejamentoModule);
            console.log("planejamento permissão:", planejamentoModule?.can_view);
            
            // Se tiver acesso a todos os submodulos, adiciona "todos"
            if (
              trocaOleoModule?.can_view && 
              painelModule?.can_view && 
              historicoModule?.can_view && 
              osModule?.can_view
            ) {
              submodulos.push('todos');
            }
            
            return submodulos;
          })()
        },
        relatorios: ["visualizar"],
        configuracoes: modulePermissions
          .filter(p => p.module.id === 'configuracoes')
          .map(p => {
            const perms = [];
            if (p.can_view) perms.push('visualizar');
            if (p.can_edit) perms.push('criar', 'editar', 'excluir');
            return perms;
          }).flat(),
      };

      // Mapear dados do usuário
      const authUser: AuthUser = {
        id: data.id,
        nome: data.name,
        sobrenome: "", // Não temos sobrenome na tabela users
        login: data.username,
        perfil: "customizado", // Usamos o perfil customizado
        ativo: data.active,
        permissoes_customizadas: formattedPermissions
      }

      // Log para debug das permissões
      console.log("Permissões mapeadas para o usuário:", formattedPermissions);
      console.log("Verificar permissões para troca-oleo:", 
        formattedPermissions.manutencoes.submodulos.includes("troca-oleo"));

      // Salvar usuário no estado e localStorage
      setUser(authUser)
      localStorage.setItem("authUser", JSON.stringify(authUser))
      
      // Configurar um cookie para persistência adicional
      document.cookie = `semtransp_auth=${authUser.id}; path=/; max-age=2592000; SameSite=Strict`; // 30 dias

      return { success: true, message: "Login realizado com sucesso" }
    } catch (err) {
      console.error("Erro durante login:", err)
      setError("Falha ao fazer login")
      return { success: false, message: "Falha ao fazer login" }
    } finally {
      setLoading(false)
    }
  }

  // Função para fazer logout
  const logout = async () => {
    try {
      setLoading(true)
      
      // Limpar dados de autenticação
      setUser(null)
      localStorage.removeItem("authUser")
      
      // Remover cookie de persistência
      document.cookie = "semtransp_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      
      // Redirecionar para a página de login
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      setError("Falha ao fazer logout")
    } finally { 
      setLoading(false)
    }
  }

  // Valor do contexto que será fornecido aos componentes
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    verificarPermissao
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 