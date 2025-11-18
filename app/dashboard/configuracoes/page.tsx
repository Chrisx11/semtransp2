"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { UserPlus, Edit, Trash2, Loader2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

// Tipo para permissões de módulos
type ModulePermission = {
  id: string
  name: string
  view: boolean
  full: boolean
}

// Tipo específico para ordem de serviço que inclui abas
type OSPermission = ModulePermission & {
  tabs: {
    id: string
    name: string
    access: boolean
  }[]
}

// Interface para representar um usuário
interface User {
  id: string
  name: string
  username: string
  password?: string
  active: boolean
  permissions: {
    modules: ModulePermission[]
    ordemServico: OSPermission
  }
}

export default function ConfiguracoesPage() {
  // Estado para lista de usuários
  const [users, setUsers] = useState<User[]>([])
  // Estado para controlar o usuário que está sendo editado
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  // Estados para controlar diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Estado para indicar carregamento
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Estados para permissões
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({})
  
  // Toast para notificações
  const { toast } = useToast()

  // Modelo de permissões padrão para novos usuários
  const defaultPermissions = {
    modules: [
      { id: "dashboard", name: "Dashboard", view: true, full: false },
      { id: "colaboradores", name: "Colaboradores", view: false, full: false },
      { id: "veiculos", name: "Veículos", view: false, full: false },
      { id: "produtos", name: "Produtos", view: false, full: false },
      { id: "entradas", name: "Entradas", view: false, full: false },
      { id: "saidas", name: "Saídas", view: false, full: false },
      { id: "painel", name: "Painel", view: false, full: false },
      { id: "planejamento", name: "Planejamento", view: false, full: false },
      { id: "trocaOleo", name: "Troca de Óleo", view: false, full: false },
      { id: "trocaPneu", name: "Troca de Pneu", view: false, full: false },
      { id: "historico", name: "Histórico", view: false, full: false },
      { id: "configuracoes", name: "Configurações", view: false, full: false },
      { id: "borracharia", name: "Borracharia", view: false, full: false },
      { id: "lavador", name: "Serviços de Lavagem", view: false, full: false },
      { id: "servicoExterno", name: "Serviço Externo", view: false, full: false },
    ],
    ordemServico: {
      id: "ordemServico",
      name: "Ordem de Serviço",
      view: false,
      full: false,
      tabs: [
        { id: "oficina", name: "Oficina", access: false },
        { id: "almoxarifado", name: "Almoxarifado", access: false },
        { id: "compras", name: "Compras", access: false },
        { id: "finalizadas", name: "Finalizadas", access: false },
      ]
    }
  }

  // Estado para formulário de usuário
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  })

  // Estado para o formulário de permissões
  const [permissionData, setPermissionData] = useState(defaultPermissions)

  // Carregar usuários do Supabase ao iniciar
  useEffect(() => {
    fetchUsers()
  }, [])

  // Função para buscar usuários do Supabase
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Buscar usuários
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true })
      
      if (usersError) throw usersError
      
      // Para cada usuário, buscar suas permissões
      const usersWithPermissions = await Promise.all(users.map(async (user) => {
        // Buscar permissões de módulos
        const { data: modulePermissions, error: moduleError } = await supabase
          .from('user_module_permissions')
          .select('*, module:modules(*)')
          .eq('user_id', user.id)
        
        if (moduleError) throw moduleError
        
        // Buscar permissões de abas de OS
        const { data: osTabPermissions, error: osTabError } = await supabase
          .from('user_os_tab_permissions')
          .select('*, os_tab:os_tabs(*)')
          .eq('user_id', user.id)
        
        if (osTabError) throw osTabError
        
        // Formatar as permissões no formato esperado pela interface
        const formattedModules = defaultPermissions.modules.map(defaultModule => {
          const userPermission = modulePermissions.find(p => p.module.id === defaultModule.id)
          return {
            id: defaultModule.id,
            name: defaultModule.name,
            view: userPermission ? userPermission.can_view : false,
            full: userPermission ? userPermission.can_edit : false
          }
        })
        
        const osTabsFormatted = defaultPermissions.ordemServico.tabs.map(defaultTab => {
          const userPermission = osTabPermissions.find(p => p.os_tab.id === defaultTab.id)
          return {
            id: defaultTab.id,
            name: defaultTab.name,
            access: userPermission ? userPermission.has_access : false
          }
        })
        
        // Verificar se tem permissão para o módulo OS
        const osModulePermission = modulePermissions.find(p => p.module.id === 'ordemServico')
        
        // Construir o objeto usuário completo
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          active: user.active,
          permissions: {
            modules: formattedModules,
            ordemServico: {
              id: 'ordemServico',
              name: 'Ordem de Serviço',
              view: osModulePermission ? osModulePermission.can_view : false,
              full: osModulePermission ? osModulePermission.can_edit : false,
              tabs: osTabsFormatted
            }
          }
        }
      }))
      
      setUsers(usersWithPermissions)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Ocorreu um erro ao buscar usuários do banco de dados."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar usuários no localStorage quando houver alterações
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("users", JSON.stringify(users))
    }
  }, [users])

  // Handlers para o formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Funções para gerenciar permissões
  const toggleModulePermission = (moduleId: string, type: "view" | "full") => {
    setPermissionData(prev => {
      const newPermissions = { ...prev }
      
      // Encontrar o módulo que está sendo alterado
      const moduleIndex = newPermissions.modules.findIndex(m => m.id === moduleId)
      
      if (moduleIndex !== -1) {
        // Criar nova referência para evitar mutação direta
        newPermissions.modules = [...newPermissions.modules]
        
        if (type === "view") {
          // Se está desativando visualização, também desativa acesso total
          const newValue = !newPermissions.modules[moduleIndex].view
          newPermissions.modules[moduleIndex] = {
            ...newPermissions.modules[moduleIndex],
            view: newValue,
            full: newValue ? newPermissions.modules[moduleIndex].full : false
          }
        } else if (type === "full") {
          // Se está ativando acesso total, também ativa visualização
          newPermissions.modules[moduleIndex] = {
            ...newPermissions.modules[moduleIndex],
            full: !newPermissions.modules[moduleIndex].full
          }
        }
      }
      
      return newPermissions
    })
  }
  
  const toggleOSPermission = (type: "view" | "full") => {
    setPermissionData(prev => {
      const newPermissions = { ...prev }
      
      if (type === "view") {
        // Se está desativando visualização, também desativa acesso total e todas as abas
        const newValue = !newPermissions.ordemServico.view
        
        const newTabs = newPermissions.ordemServico.tabs.map(tab => ({
          ...tab,
          access: newValue ? tab.access : false
        }))
        
        newPermissions.ordemServico = {
          ...newPermissions.ordemServico,
          view: newValue,
          full: newValue ? newPermissions.ordemServico.full : false,
          tabs: newTabs
        }
      } else if (type === "full") {
        // Se está ativando acesso total
        newPermissions.ordemServico = {
          ...newPermissions.ordemServico,
          full: !newPermissions.ordemServico.full
        }
      }
      
      return newPermissions
    })
  }
  
  const toggleOSTabPermission = (tabId: string) => {
    setPermissionData(prev => {
      const newPermissions = { ...prev }
      
      // Encontrar a aba que está sendo alterada
      const tabIndex = newPermissions.ordemServico.tabs.findIndex(t => t.id === tabId)
      
      if (tabIndex !== -1) {
        // Criar nova referência para evitar mutação direta
        newPermissions.ordemServico = {
          ...newPermissions.ordemServico,
          tabs: [...newPermissions.ordemServico.tabs]
        }
        
        // Alternar acesso da aba
        newPermissions.ordemServico.tabs[tabIndex] = {
          ...newPermissions.ordemServico.tabs[tabIndex],
          access: !newPermissions.ordemServico.tabs[tabIndex].access
        }
      }
      
      return newPermissions
    })
  }

  // Função para adicionar novo usuário
  const addUser = async () => {
    // Validações básicas
    if (!formData.name || !formData.username || !formData.password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios"
      })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas diferentes",
        description: "As senhas não coincidem"
      })
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Verificar se username já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .single()
      
      if (existingUser) {
        toast({
          variant: "destructive",
          title: "Nome de usuário indisponível",
          description: "Este nome de usuário já está em uso"
        })
        return
      }
      
      // Inserir novo usuário
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            name: formData.name, 
            username: formData.username, 
            password: formData.password, // Nota: em prod. deve-se usar hash
            active: true
          }
        ])
        .select()
      
      if (insertError) throw insertError
      
      // Inserir permissões padrão para o novo usuário
      // Módulos
      const modulePermissions = defaultPermissions.modules.map(module => ({
        user_id: newUser[0].id,
        module_id: module.id,
        can_view: module.view,
        can_edit: module.full
      }))
      
      // Adicionar também o módulo de Ordem de Serviço
      modulePermissions.push({
        user_id: newUser[0].id,
        module_id: 'ordemServico',
        can_view: defaultPermissions.ordemServico.view,
        can_edit: defaultPermissions.ordemServico.full
      })
      
      const { error: modulePermError } = await supabase
        .from('user_module_permissions')
        .insert(modulePermissions)
      
      if (modulePermError) throw modulePermError
      
      // Inserir permissões para abas de Ordem de Serviço
      const osTabPermissions = defaultPermissions.ordemServico.tabs.map(tab => ({
        user_id: newUser[0].id,
        os_tab_id: tab.id,
        has_access: tab.access
      }))
      
      const { error: osTabPermError } = await supabase
        .from('user_os_tab_permissions')
        .insert(osTabPermissions)
      
      if (osTabPermError) throw osTabPermError
      
      // Atualizar a lista de usuários
      await fetchUsers()
      
      // Fechar o diálogo e limpar o formulário
      setIsAddDialogOpen(false)
      setFormData({ name: "", username: "", password: "", confirmPassword: "" })
      
      toast({
        title: "Usuário criado",
        description: `O usuário ${formData.name} foi criado com sucesso!`
      })
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: "Ocorreu um erro ao criar o usuário no banco de dados."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para preparar edição de usuário
  const prepareEditUser = (user: User) => {
    setCurrentUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      password: "",
      confirmPassword: ""
    })
    setIsEditDialogOpen(true)
  }

  // Função para preparar gerenciamento de permissões
  const prepareManagePermissions = (user: User) => {
    // Criar cópia profunda das permissões do usuário para evitar modificações diretas
    const userPermissions = {
      modules: user.permissions.modules.map(module => ({ ...module })),
      ordemServico: {
        ...user.permissions.ordemServico,
        tabs: user.permissions.ordemServico.tabs.map(tab => ({ ...tab }))
      }
    };
    
    setCurrentUser(user)
    setPermissionData(userPermissions)
  }

  // Função para preparar exclusão de usuário
  const prepareDeleteUser = (user: User) => {
    setCurrentUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Função para atualizar usuário
  const updateUser = async () => {
    if (!currentUser) return

    // Validações básicas
    if (!formData.name || !formData.username) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios"
      })
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas diferentes",
        description: "As senhas não coincidem"
      })
      return
    }

    setIsProcessing(true)

    try {
      // Verificar se username já existe para outro usuário
      if (formData.username !== currentUser.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', formData.username)
          .neq('id', currentUser.id)
          .single()
        
        if (existingUser) {
          toast({
            variant: "destructive",
            title: "Nome de usuário indisponível",
            description: "Este nome de usuário já está em uso"
          })
          return
        }
      }
      
      // Preparar objeto para atualização
      const userUpdate: any = {
        name: formData.name,
        username: formData.username
      }
      
      // Adicionar senha apenas se foi fornecida
      if (formData.password) {
        userUpdate.password = formData.password // Nota: em prod. deve-se usar hash
      }
      
      // Atualizar usuário
      const { error: updateError } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', currentUser.id)
      
      if (updateError) throw updateError
      
      // Atualizar lista de usuários
      await fetchUsers()
      
      // Fechar diálogo e limpar estado
      setIsEditDialogOpen(false)
      setCurrentUser(null)
      setFormData({ name: "", username: "", password: "", confirmPassword: "" })
      
      toast({
        title: "Usuário atualizado",
        description: `O usuário ${formData.name} foi atualizado com sucesso!`
      })
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao atualizar o usuário no banco de dados."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para salvar permissões
  const savePermissions = async () => {
    if (!currentUser) return

    setIsProcessing(true)

    try {
      // Atualizar permissões de módulos
      // Primeiro, remover permissões existentes
      const { error: deleteModuleError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', currentUser.id)
      
      if (deleteModuleError) throw deleteModuleError
      
      // Inserir novas permissões de módulos
      const modulePermissions = permissionData.modules.map(module => ({
        user_id: currentUser.id,
        module_id: module.id,
        can_view: module.view,
        can_edit: module.full
      }))
      
      // Adicionar também o módulo de Ordem de Serviço
      modulePermissions.push({
        user_id: currentUser.id,
        module_id: 'ordemServico',
        can_view: permissionData.ordemServico.view,
        can_edit: permissionData.ordemServico.full
      })
      
      const { error: insertModuleError } = await supabase
        .from('user_module_permissions')
        .insert(modulePermissions)
      
      if (insertModuleError) throw insertModuleError
      
      // Atualizar permissões de abas de OS
      // Primeiro, remover permissões existentes
      const { error: deleteTabError } = await supabase
        .from('user_os_tab_permissions')
        .delete()
        .eq('user_id', currentUser.id)
      
      if (deleteTabError) throw deleteTabError
      
      // Inserir novas permissões para abas
      const osTabPermissions = permissionData.ordemServico.tabs.map(tab => ({
        user_id: currentUser.id,
        os_tab_id: tab.id,
        has_access: tab.access
      }))
      
      const { error: insertTabError } = await supabase
        .from('user_os_tab_permissions')
        .insert(osTabPermissions)
      
      if (insertTabError) throw insertTabError
      
      // Atualizar lista de usuários
      await fetchUsers()
      
      toast({
        title: "Permissões atualizadas",
        description: `As permissões de ${currentUser.name} foram atualizadas com sucesso!`
      })
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar permissões",
        description: "Ocorreu um erro ao atualizar as permissões no banco de dados."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para excluir usuário
  const deleteUser = async () => {
    if (!currentUser) return

    setIsProcessing(true)

    try {
      // Excluir usuário (as permissões serão excluídas automaticamente pela restrição ON DELETE CASCADE)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id)
      
      if (error) throw error
      
      // Atualizar lista de usuários
      await fetchUsers()
      
      // Fechar diálogo
      setIsDeleteDialogOpen(false)
      setCurrentUser(null)
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao excluir o usuário do banco de dados."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para alternar status ativo/inativo do usuário
  const toggleUserStatus = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId)
    if (!userToUpdate) return

    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !userToUpdate.active })
        .eq('id', userId)
      
      if (error) throw error
      
      // Atualizar lista de usuários
      await fetchUsers()
      
      toast({
        title: userToUpdate.active ? "Usuário desativado" : "Usuário ativado",
        description: `O usuário ${userToUpdate.name} foi ${userToUpdate.active ? "desativado" : "ativado"} com sucesso!`
      })
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status do usuário no banco de dados."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Lista de páginas do sistema
  const pages = [
    { id: "dashboard", name: "Dashboard" },
    { id: "colaboradores", name: "Colaboradores" },
    { id: "veiculos", name: "Veículos" },
    { id: "produtos", name: "Produtos" },
    { id: "filtros", name: "Filtros" },
    { id: "entradas", name: "Entradas" },
    { id: "saidas", name: "Saídas" },
    { id: "painel", name: "Painel" },
    { id: "tela", name: "Tela" },
    { id: "ordemServico", name: "Ordem de Serviço" },
    { id: "planejamento", name: "Planejamento" },
    { id: "trocaOleo", name: "Troca de Óleo" },
    { id: "trocaPneu", name: "Troca de Pneu" },
    { id: "historico", name: "Histórico" },
    { id: "custoVeiculo", name: "Custo por Veículo" },
    { id: "borracharia", name: "Borracharia" },
    { id: "lavador", name: "Serviços de Lavagem" },
    { id: "servicoExterno", name: "Serviço Externo" },
    { id: "configuracoes", name: "Configurações" },
  ]

  // Função para carregar permissões de um usuário
  const loadUserPermissions = async (userId: string) => {
    try {
      setIsLoading(true)
      
      // Buscar permissões do usuário
      const { data: modulePermissions, error } = await supabase
        .from('user_module_permissions')
        .select('*, module:modules(*)')
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Criar objeto de permissões
      const permissions: Record<string, boolean> = {}
      
      // Inicializar todas as páginas como false
      pages.forEach(page => {
        permissions[page.id] = false
      })
      
      // Preencher com as permissões existentes
      if (modulePermissions) {
        modulePermissions.forEach((perm: any) => {
          if (perm.module && perm.can_view) {
            permissions[perm.module.id] = true
          }
        })
      }
      
      setUserPermissions(permissions)
      setSelectedUserForPermissions(userId)
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar permissões",
        description: "Não foi possível carregar as permissões do usuário."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para alternar permissão de uma página
  const togglePermission = (pageId: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }))
  }

  // Função para salvar permissões
  const saveUserPermissions = async () => {
    if (!selectedUserForPermissions) {
      toast({
        variant: "destructive",
        title: "Usuário não selecionado",
        description: "Selecione um usuário para gerenciar permissões."
      })
      return
    }

    setIsProcessing(true)

    try {
      // Primeiro, garantir que todos os módulos existam na tabela modules
      // Buscar módulos existentes
      const { data: existingModules } = await supabase
        .from('modules')
        .select('id')
      
      const existingModuleIds = new Set(existingModules?.map((m: any) => m.id) || [])
      
      // Preparar módulos que precisam ser criados
      const modulesToCreate = pages
        .filter(page => !existingModuleIds.has(page.id))
        .map(page => ({
          id: page.id,
          name: page.name,
          description: `Módulo ${page.name}`
        }))

      // Criar módulos que não existem
      if (modulesToCreate.length > 0) {
        const { error: createError } = await supabase
          .from('modules')
          .insert(modulesToCreate)
        
        if (createError) {
          console.warn('Aviso ao criar módulos:', createError)
          // Continuar mesmo se houver erro em alguns módulos
        }
      }

      // Remover todas as permissões existentes do usuário
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', selectedUserForPermissions)
      
      if (deleteError) throw deleteError
      
      // Preparar permissões para inserção
      const permissionsToInsert = Object.entries(userPermissions)
        .filter(([_, hasAccess]) => hasAccess)
        .map(([moduleId, _]) => ({
          user_id: selectedUserForPermissions,
          module_id: moduleId,
          can_view: true,
          can_edit: false // Sistema básico apenas com acesso de visualização
        }))
      
      // Inserir novas permissões
      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(permissionsToInsert)
        
        if (insertError) {
          console.error('Erro detalhado ao inserir permissões:', insertError)
          throw insertError
        }
      }
      
      // Atualizar lista de usuários
      await fetchUsers()
      
      toast({
        title: "Permissões salvas",
        description: "As permissões foram atualizadas com sucesso!"
      })
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error)
      const errorMessage = error?.message || error?.code || 'Erro desconhecido'
      toast({
        variant: "destructive",
        title: "Erro ao salvar permissões",
        description: `Ocorreu um erro ao salvar as permissões: ${errorMessage}`
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const isMobile = useIsMobile()

  // Componente Mobile View
  function ConfiguracoesMobileView({
    users,
    isLoading,
    isProcessing,
    selectedUserForPermissions,
    userPermissions,
    pages,
    onAddUser,
    onEditUser,
    onDeleteUser,
    onToggleStatus,
    onSelectUserForPermissions,
    onTogglePermission,
    onSavePermissions,
  }: {
    users: User[]
    isLoading: boolean
    isProcessing: boolean
    selectedUserForPermissions: string | null
    userPermissions: Record<string, boolean>
    pages: { id: string; name: string }[]
    onAddUser: () => void
    onEditUser: (user: User) => void
    onDeleteUser: (user: User) => void
    onToggleStatus: (userId: string) => void
    onSelectUserForPermissions: (userId: string) => void
    onTogglePermission: (pageId: string) => void
    onSavePermissions: () => void
  }) {
    const [activeTab, setActiveTab] = useState<"users" | "permissions">("users")

    return (
      <div className="w-full max-w-full overflow-x-hidden pl-3 pr-0 py-4 pb-6 flex flex-col items-start">
        <div className="w-[92%] mb-4 pl-0 pr-0">
          <MobileBackButton />
        </div>

        <div className="w-[92%] pl-0 pr-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "permissions")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <Button onClick={onAddUser} disabled={isProcessing} size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-base font-medium mb-1">Nenhum usuário encontrado</p>
                  <p className="text-sm">Crie o primeiro usuário clicando em "Novo"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Selecione o usuário</Label>
                    <Select
                      value={selectedUserForPermissions || ""}
                      onValueChange={(value) => onSelectUserForPermissions(value)}
                    >
                      <SelectTrigger className="w-full h-11 text-base">
                        <SelectValue placeholder="Selecione um usuário">
                          {selectedUserForPermissions
                            ? (() => {
                                const selectedUser = users.find((u) => u.id === selectedUserForPermissions)
                                return selectedUser ? selectedUser.name : "Selecione um usuário"
                              })()
                            : "Selecione um usuário"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="py-2">
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{user.username}</div>
                              </div>
                              <Badge
                                variant={user.active ? "default" : "secondary"}
                                className="flex-shrink-0 text-[10px]"
                              >
                                {user.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUserForPermissions && (() => {
                    const selectedUser = users.find((u) => u.id === selectedUserForPermissions)
                    if (!selectedUser) return null
                    
                    return (
                      <Card className="border-l-4 border-l-primary shadow-sm">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div>
                              <div className="font-bold text-lg text-primary">{selectedUser.name}</div>
                              <div className="text-sm text-muted-foreground">{selectedUser.username}</div>
                              <div className="mt-2">
                                <Badge variant={selectedUser.active ? "default" : "secondary"} className="text-xs">
                                  {selectedUser.active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                onClick={() => onToggleStatus(selectedUser.id)}
                                disabled={isProcessing}
                                className="w-full justify-start"
                              >
                                {selectedUser.active ? "Desativar" : "Ativar"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => onEditUser(selectedUser)}
                                disabled={isProcessing}
                                className="w-full justify-start"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => onDeleteUser(selectedUser)}
                                disabled={isProcessing}
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Permissões</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione um usuário e defina quais páginas ele pode acessar
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Selecione o usuário</Label>
                {users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    Nenhum usuário encontrado. Crie um usuário primeiro na aba "Usuários".
                  </div>
                ) : (
                  <Select
                    value={selectedUserForPermissions || ""}
                    onValueChange={(value) => onSelectUserForPermissions(value)}
                  >
                    <SelectTrigger className="w-full h-11 text-base">
                      <SelectValue placeholder="Selecione um usuário">
                        {selectedUserForPermissions
                          ? (() => {
                              const selectedUser = users.find((u) => u.id === selectedUserForPermissions)
                              return selectedUser ? selectedUser.name : "Selecione um usuário"
                            })()
                          : "Selecione um usuário"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="py-2">
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.username}</div>
                            </div>
                            <Badge
                              variant={user.active ? "default" : "secondary"}
                              className="flex-shrink-0 text-[10px]"
                            >
                              {user.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedUserForPermissions && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        Páginas que o usuário pode acessar
                      </Label>
                      <Button
                        onClick={onSavePermissions}
                        disabled={isProcessing}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
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
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3 max-h-[500px] overflow-y-auto">
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`perm-${page.id}`}
                            checked={userPermissions[page.id] || false}
                            onCheckedChange={() => onTogglePermission(page.id)}
                          />
                          <Label
                            htmlFor={`perm-${page.id}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            {page.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedUserForPermissions && users.length > 0 && (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    Selecione um usuário acima para gerenciar suas permissões
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <Toaster />
        <ConfiguracoesMobileView
          users={users}
          isLoading={isLoading}
          isProcessing={isProcessing}
          selectedUserForPermissions={selectedUserForPermissions}
          userPermissions={userPermissions}
          pages={pages}
          onAddUser={() => {
            setFormData({ name: "", username: "", password: "", confirmPassword: "" })
            setIsAddDialogOpen(true)
          }}
          onEditUser={prepareEditUser}
          onDeleteUser={prepareDeleteUser}
          onToggleStatus={toggleUserStatus}
          onSelectUserForPermissions={loadUserPermissions}
          onTogglePermission={togglePermission}
          onSavePermissions={saveUserPermissions}
        />
        {/* Diálogos - mesmos da versão desktop */}
        {/* Diálogo para Adicionar Usuário */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Insira os dados do novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nome de login"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Senha"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirme a senha"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={addUser}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para Editar Usuário */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Modifique os dados do usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-username">Nome de Usuário</Label>
                <Input
                  id="edit-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nome de login"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter atual)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nova senha"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="edit-confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="edit-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirme a nova senha"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={updateUser}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para Excluir Usuário */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <p className="pt-4">
              Você está prestes a excluir o usuário: <strong>{currentUser?.name}</strong>
            </p>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteUser}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <React.Fragment>
      <Toaster />
      <div className="space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card className="shadow-md-custom">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Gerenciamento de Usuários</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione, edite ou remova usuários do sistema
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setFormData({ name: "", username: "", password: "", confirmPassword: "" })
                      setIsAddDialogOpen(true)
                    }}
                    disabled={isProcessing}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
                </div>

                <div className="rounded-md border shadow-sm-custom overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                              <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <p className="text-muted-foreground">
                              Nenhum usuário encontrado. Crie o primeiro usuário clicando em "Novo Usuário".
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map(user => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <Badge variant={user.active ? "default" : "secondary"}>
                                {user.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id)}
                                  disabled={isProcessing}
                                >
                                  {user.active ? "Desativar" : "Ativar"}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => prepareEditUser(user)}
                                  disabled={isProcessing}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => prepareDeleteUser(user)}
                                  disabled={isProcessing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions">
            <Card className="shadow-md-custom">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">Gerenciamento de Permissões</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione um usuário e defina quais páginas ele pode acessar
                  </p>
                </div>
                
                <div className="space-y-6">
                  {/* Seleção de usuário */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      Selecione o usuário
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {users.map(user => (
                        <Card
                          key={user.id}
                          className={`cursor-pointer transition-all ${
                            selectedUserForPermissions === user.id
                              ? 'border-2 border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => loadUserPermissions(user.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.username}</p>
                              </div>
                              <Badge variant={user.active ? "default" : "secondary"}>
                                {user.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Lista de permissões */}
                  {selectedUserForPermissions && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">
                          Páginas que o usuário pode acessar
                        </Label>
                        <Button
                          onClick={saveUserPermissions}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Permissões
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {pages.map(page => (
                          <div
                            key={page.id}
                            className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                          >
                            <Checkbox
                              id={`perm-${page.id}`}
                              checked={userPermissions[page.id] || false}
                              onCheckedChange={() => togglePermission(page.id)}
                            />
                            <Label
                              htmlFor={`perm-${page.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              {page.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedUserForPermissions && users.length > 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      Selecione um usuário acima para gerenciar suas permissões
                    </div>
                  )}

                  {users.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      Nenhum usuário encontrado. Crie um usuário primeiro na aba "Usuários".
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para Adicionar Usuário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Insira os dados do novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nome de login"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Senha"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirme a senha"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={addUser}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique os dados do usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-username">Nome de Usuário</Label>
              <Input
                id="edit-username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nome de login"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter atual)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nova senha"
                disabled={isProcessing}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="edit-confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirme a nova senha"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={updateUser}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para Excluir Usuário */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <p className="pt-4">
            Você está prestes a excluir o usuário: <strong>{currentUser?.name}</strong>
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteUser}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}
