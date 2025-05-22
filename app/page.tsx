"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Settings, Wrench, Car, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Área esquerda - Design para oficina mecânica */}
        <div className="hidden md:flex md:flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 text-white relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-4 border-blue-400"></div>
            <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full border-4 border-blue-500"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full border-2 border-blue-300"></div>
          </div>
          
          {/* Conteúdo principal */}
          <div className="z-10 p-8 max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <Settings className="h-16 w-16 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-blue-400">SEMTRANSP</h1>
            <h2 className="text-2xl font-bold mb-6">Gestão de Oficina Mecânica</h2>
            <p className="text-gray-300 mb-8">Sistema completo para gerenciamento de serviços, peças e manutenção de veículos.</p>
            
            {/* Cards de recursos */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                <Car className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium">Gestão de Frotas</h3>
              </div>
              <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                <Wrench className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium">Controle de Serviços</h3>
              </div>
              <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                <Settings className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium">Manutenção</h3>
              </div>
              <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium">Relatórios</h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* Área direita - formulário de login */}
        <div className="flex flex-col items-center justify-center p-4 relative">
          <Card className="w-full max-w-md shadow-xl-custom hover-lift">
            <CardHeader className="space-y-1 text-center bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
              <CardTitle className="text-2xl font-bold">SEMTRANSP</CardTitle>
              <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Nome de usuário"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-slate-600"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    name="senha"
                    type="password"
                    value={formData.senha}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-slate-600"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-md-custom hover:shadow-lg-custom transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {/* Direitos reservados - apenas no lado direito */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 w-full absolute bottom-4">
            © Direitos Reservados para Christian Nunes Marvila 2025
          </div>
        </div>
      </div>
    </div>
  )
}
