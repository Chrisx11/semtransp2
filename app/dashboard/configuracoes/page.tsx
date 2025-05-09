"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Edit, Trash2, Eye, CheckCircle, Circle, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

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

// Componente CustomCheckbox para melhorar feedback visual
const CustomCheckbox = ({ id, checked, onChange, disabled = false }: {
  id: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`h-6 w-6 rounded-full flex items-center justify-center cursor-pointer border ${
          disabled 
            ? "border-gray-300 bg-gray-100" 
            : checked 
              ? "border-primary bg-primary/10" 
              : "border-gray-300"
        }`}
        onClick={() => {
          if (!disabled) {
            onChange()
          }
        }}
      >
        {checked && <CheckCircle className="h-5 w-5 text-primary" />}
        {!checked && <Circle className="h-5 w-5 text-gray-300" />}
      </div>
    </div>
  )
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
      { id: "fornecedores", name: "Fornecedores", view: false, full: false },
      { id: "borracharia", name: "Borracharia", view: false, full: false },
      { id: "lavador", name: "Serviços de Lavagem", view: false, full: false },
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

  // Força uma atualização do componente
  const [refreshKey, setRefreshKey] = useState(0);
  const forceUpdate = () => setRefreshKey(prev => prev + 1);

  // Estado para controlar a aba atual
  const [activeTab, setActiveTab] = useState("users");
  
  return (
    <div className="container mx-auto py-10" key={refreshKey}>
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Adicione, edite ou remova usuários do sistema
                </CardDescription>
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
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
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
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Nenhum usuário encontrado. Crie o primeiro usuário clicando em "Novo Usuário".
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Controle de Acesso</CardTitle>
              <CardDescription>
                Defina quais páginas e funcionalidades cada usuário pode acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Selecione o usuário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map(user => (
                        <Card 
                          key={user.id} 
                          className={`cursor-pointer hover:border-primary ${currentUser?.id === user.id ? 'border-2 border-primary' : ''}`}
                          onClick={() => {
                            prepareManagePermissions(user);
                            // Mantém a aba ativa como "permissions"
                            setActiveTab("permissions");
                          }}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.username}</p>
                            </div>
                            <Badge variant={user.active ? "default" : "secondary"}>
                              {user.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {currentUser && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-4">Permissões: {currentUser.name}</h3>
                      
                      <Tabs defaultValue="modules">
                        <TabsList className="mb-4">
                          <TabsTrigger value="modules">Módulos do Sistema</TabsTrigger>
                          <TabsTrigger value="os">Ordem de Serviço</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="modules" className="space-y-4">
                          <div className="grid gap-4">
                            <div className="grid grid-cols-12 font-medium pb-2 border-b">
                              <div className="col-span-6">Módulo</div>
                              <div className="col-span-3 text-center">Visualizar</div>
                              <div className="col-span-3 text-center">Acesso Total</div>
                            </div>
                            
                            {permissionData.modules.map(module => (
                              <div key={module.id} className="grid grid-cols-12 items-center py-2 border-b">
                                <div className="col-span-6 font-medium">{module.name}</div>
                                <div className="col-span-3 flex justify-center">
                                  <CustomCheckbox 
                                    id={`view-${module.id}`}
                                    checked={module.view}
                                    onChange={() => {
                                      toggleModulePermission(module.id, "view");
                                      forceUpdate(); // Força atualização após alteração
                                      // Garantir que a aba ativa permaneça a mesma
                                      setActiveTab("permissions");
                                    }}
                                  />
                                </div>
                                <div className="col-span-3 flex justify-center">
                                  <CustomCheckbox 
                                    id={`full-${module.id}`}
                                    checked={module.full}
                                    onChange={() => {
                                      toggleModulePermission(module.id, "full");
                                      forceUpdate(); // Força atualização após alteração
                                      // Garantir que a aba ativa permaneça a mesma
                                      setActiveTab("permissions");
                                    }}
                                    disabled={!module.view}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="os" className="space-y-4">
                          <div>
                            <div className="grid grid-cols-12 font-medium pb-2 border-b">
                              <div className="col-span-6">Módulo Ordem de Serviço</div>
                              <div className="col-span-3 text-center">Visualizar</div>
                              <div className="col-span-3 text-center">Acesso Total</div>
                            </div>
                            
                            <div className="grid grid-cols-12 items-center py-2 border-b">
                              <div className="col-span-6 font-medium">{permissionData.ordemServico.name}</div>
                              <div className="col-span-3 flex justify-center">
                                <CustomCheckbox 
                                  id="view-os"
                                  checked={permissionData.ordemServico.view}
                                  onChange={() => {
                                    toggleOSPermission("view");
                                    forceUpdate(); // Força atualização após alteração
                                    // Garantir que a aba ativa permaneça a mesma
                                    setActiveTab("permissions");
                                  }}
                                />
                              </div>
                              <div className="col-span-3 flex justify-center">
                                <CustomCheckbox 
                                  id="full-os"
                                  checked={permissionData.ordemServico.full}
                                  onChange={() => {
                                    toggleOSPermission("full");
                                    forceUpdate(); // Força atualização após alteração
                                    // Garantir que a aba ativa permaneça a mesma
                                    setActiveTab("permissions");
                                  }}
                                  disabled={!permissionData.ordemServico.view}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <div className="font-medium mb-2">Abas de Ordem de Serviço</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Selecione as abas que o usuário poderá acessar.
                            </p>
                            
                            <div className="grid gap-3">
                              {permissionData.ordemServico.tabs.map(tab => (
                                <div key={tab.id} className="flex items-center space-x-2">
                                  <CustomCheckbox 
                                    id={`tab-${tab.id}`}
                                    checked={tab.access}
                                    onChange={() => {
                                      toggleOSTabPermission(tab.id);
                                      forceUpdate(); // Força atualização após alteração
                                      // Garantir que a aba ativa permaneça a mesma
                                      setActiveTab("permissions");
                                    }}
                                    disabled={!permissionData.ordemServico.view}
                                  />
                                  <Label 
                                    htmlFor={`tab-${tab.id}`}
                                    className={`${!permissionData.ordemServico.view ? "text-muted-foreground" : "cursor-pointer"}`}
                                    onClick={() => {
                                      if (!permissionData.ordemServico.view) return;
                                      toggleOSTabPermission(tab.id);
                                      forceUpdate(); // Força atualização após alteração
                                      // Garantir que a aba ativa permaneça a mesma
                                      setActiveTab("permissions");
                                    }}
                                  >
                                    {tab.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={() => {
                            savePermissions();
                            forceUpdate(); // Força atualização após salvar
                            // Garantir que a aba ativa permaneça a mesma
                            setActiveTab("permissions");
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isProcessing}
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
                    </div>
                  )}
                  
                  {!currentUser && (
                    <div className="text-center p-12 border rounded-md text-muted-foreground">
                      Selecione um usuário para gerenciar suas permissões
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      
      {/* Remover o diálogo de permissões, pois agora está incorporado na página */}
    </div>
  )
}
