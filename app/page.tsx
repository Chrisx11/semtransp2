"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  Car,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  Smartphone,
  User,
  Wrench,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", senha: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile">("desktop")
  const [isIOS, setIsIOS] = useState(false)
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
        description: "Por favor, preencha todos os campos.",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await login(formData.username, formData.senha)

      if (result.success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando para o dashboard...",
        })
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Erro de login",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao tentar fazer login. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const ua = navigator.userAgent.toLowerCase()
    const mobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
    const ios = /iphone|ipad|ipod/i.test(ua)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setDeviceType(mobile ? "mobile" : "desktop")
    setIsIOS(ios)
    setIsInstalled(standalone)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setIsInstallDialogOpen(false)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const installTitle = useMemo(
    () => (deviceType === "mobile" ? "Instalar no celular" : "Instalar no computador"),
    [deviceType],
  )

  const installDescription = useMemo(() => {
    if (isInstalled) return "Aplicativo já instalado neste dispositivo."
    if (deviceType === "mobile") {
      return "Abra mais rápido pelo celular, com ícone na tela inicial."
    }
    return "Instale a versão para computador e use o sistema como aplicativo."
  }, [deviceType, isInstalled])

  const installSteps = useMemo(() => {
    if (deviceType === "mobile" && isIOS) {
      return [
        'Toque no botão "Compartilhar" do Safari.',
        'Escolha "Adicionar à Tela de Início".',
        "Confirme para instalar o SEMTRANSP no celular.",
      ]
    }

    if (deviceType === "mobile") {
      return [
        'Abra o menu do navegador no celular.',
        'Toque em "Instalar aplicativo" ou "Adicionar à tela inicial".',
        "Confirme a instalação para criar o atalho do SEMTRANSP.",
      ]
    }

    return [
      "Abra este sistema no Chrome ou Edge.",
      'Clique no ícone de instalar na barra de endereço ou use o menu do navegador.',
      "Confirme a instalação para abrir o SEMTRANSP como aplicativo no computador.",
    ]
  }, [deviceType, isIOS])

  const handleInstall = async () => {
    if (isInstalled) {
      toast({
        title: "Aplicativo já instalado",
        description: "O SEMTRANSP já está disponível neste dispositivo.",
      })
      return
    }

    if (installPrompt) {
      try {
        setIsInstalling(true)
        await installPrompt.prompt()
        const choice = await installPrompt.userChoice

        if (choice.outcome === "accepted") {
          toast({
            title: "Instalação iniciada",
            description: "O SEMTRANSP será adicionado ao seu dispositivo.",
          })
        } else {
          toast({
            title: "Instalação cancelada",
            description: "Você pode instalar novamente quando quiser.",
          })
        }
      } catch (error) {
        console.error("Erro ao iniciar instalação:", error)
        setIsInstallDialogOpen(true)
      } finally {
        setIsInstalling(false)
      }
      return
    }

    setIsInstallDialogOpen(true)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%)] bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="absolute right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-10">
        <section className="order-2 flex flex-col justify-center rounded-[2rem] border border-white/60 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 text-white shadow-2xl shadow-blue-950/20 dark:border-white/10 lg:order-1 lg:p-10">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Badge className="border-0 bg-white/15 px-3 py-1 text-white backdrop-blur">
              Sistema de manutenção da frota
            </Badge>
            <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-white backdrop-blur">
              Prefeitura Municipal de Italva
            </Badge>
          </div>

          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-blue-100/80">
              SEMTRANSP
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
              Gestão de oficina, frota e ordens de serviço em um só lugar.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/85 lg:text-lg">
              Controle a manutenção dos veículos, acompanhe o fluxo das ordens e tenha uma
              operação mais organizada no computador ou no celular.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Car className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Gestão da frota</h3>
              <p className="mt-1 text-sm text-blue-100/80">
                Veículos, manutenção preventiva e acompanhamento do histórico.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Ordens em tempo real</h3>
              <p className="mt-1 text-sm text-blue-100/80">
                Oficina, almoxarifado e compras trabalhando com a mesma informação.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-blue-100/85 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>Acesso seguro por usuário</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span>Controle de estoque e serviços</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Fluxo operacional mais organizado</span>
            </div>
          </div>
        </section>

        <section className="order-1 flex items-center justify-center lg:order-2">
          <div className="w-full max-w-lg space-y-5">
            <Card className="overflow-hidden border-white/70 bg-white/85 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <CardHeader className="space-y-4 border-b border-slate-200/70 pb-6 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      Acessar o sistema
                    </CardTitle>
                    <CardDescription className="mt-2 text-base text-slate-600 dark:text-slate-400">
                      Entre com seu usuário e senha para abrir o painel do SEMTRANSP.
                    </CardDescription>
                  </div>
                  <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary sm:flex">
                    <MonitorSmartphone className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {deviceType === "mobile" ? "Acesso móvel" : "Acesso em computador"}
                  </Badge>
                  {isInstalled && (
                    <Badge className="rounded-full border-0 bg-emerald-600 px-3 py-1 text-white">
                      Aplicativo instalado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Usuário
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="username"
                        name="username"
                        placeholder="Digite seu usuário"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200 bg-white pl-10 shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="senha"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="senha"
                        name="senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={formData.senha}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200 bg-white pl-10 shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-800"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-2 text-primary shadow-sm dark:bg-slate-900">
                        {deviceType === "mobile" ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <MonitorSmartphone className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {installTitle}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {installDescription}
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="mt-1 h-auto px-0 text-primary"
                          onClick={handleInstall}
                          disabled={isInstalling}
                        >
                          {isInstalling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Preparando instalação...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              {installTitle}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 border-t border-slate-200/70 p-6 dark:border-slate-800">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:from-blue-700 hover:to-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar no sistema
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    © 2025 Christian Nunes Marvila. Todos os direitos reservados.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </section>
      </div>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{installTitle}</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para instalar o SEMTRANSP neste{" "}
              {deviceType === "mobile" ? "celular" : "computador"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {installSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm text-foreground/90">{step}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-600 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-slate-300">
            Após instalar, o SEMTRANSP pode ser aberto como aplicativo, com acesso mais rápido e
            melhor aproveitamento da tela.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
