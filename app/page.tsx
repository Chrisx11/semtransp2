"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Settings, Wrench, Car, CheckCircle, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", senha: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.senha) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos."
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await login(formData.username, formData.senha)
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando para o dashboard..."
        })
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Erro de login",
          description: result.message
        })
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Toggle de tema no canto superior direito */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Área esquerda - Branding profissional */}
        <div className="hidden lg:flex lg:flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          {/* Padrão de fundo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          {/* Elementos decorativos geométricos */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-400/5 rounded-full blur-3xl"></div>
          </div>
          
          {/* Conteúdo principal */}
          <div className="relative z-10 px-12 py-16 max-w-lg">
            {/* Logo/Brand */}
            <div className="mb-12">
              <h1 className="text-5xl font-bold mb-3 text-white tracking-tight">
                SEMTRANSP
              </h1>
              <div className="h-1 w-20 bg-blue-300/50 rounded-full"></div>
            </div>
            
            {/* Descrição */}
            <p className="text-blue-100 text-lg mb-12 leading-relaxed font-light">
              Sistema completo e profissional para gestão de oficina mecânica, 
              manutenção de frotas e controle de serviços.
            </p>
            
            {/* Features em lista */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-lg">Gestão de Frotas</h3>
                  <p className="text-blue-100/80 text-sm">Controle completo de veículos e suas informações</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-lg">Ordens de Serviço</h3>
                  <p className="text-blue-100/80 text-sm">Acompanhamento completo do ciclo de manutenção</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-lg">Controle de Estoque</h3>
                  <p className="text-blue-100/80 text-sm">Gestão inteligente de peças e produtos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-lg">Relatórios e Analytics</h3>
                  <p className="text-blue-100/80 text-sm">Insights valiosos para tomada de decisão</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Área direita - Formulário de login */}
        <div className="flex flex-col items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Card de login */}
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="space-y-3 text-center pb-8 pt-10">
                <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  SEMTRANSP
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Entre com suas credenciais para acessar o sistema
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 px-8">
                  {/* Campo Usuário */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Usuário
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="username"
                        name="username"
                        placeholder="Digite seu usuário"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  
                  {/* Campo Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="senha" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="senha"
                        name="senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={formData.senha}
                        onChange={handleChange}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 px-8 pb-10">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © 2025 Christian Nunes Marvila. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
