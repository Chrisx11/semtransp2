"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  Settings,
  ShieldCheck,
  Truck,
  User,
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
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-blue-500/8 blur-[100px] dark:bg-blue-600/10" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-8 lg:py-10">
        {/* Hero panel */}
        <section className="relative order-2 flex min-h-[380px] flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-6 text-white lg:order-1 lg:min-h-0 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent" aria-hidden="true" />

          <div className="relative z-10">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-blue-300/60">
              Prefeitura Municipal de Italva
            </p>

            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300/70">
                SEMTRANSP
              </p>
              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-[3.5rem] lg:leading-[1.02]">
                Gestão de oficina, frota e ordens de serviço em um só lugar.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-blue-100/70 lg:text-base">
                Controle a manutenção dos veículos, acompanhe o fluxo das ordens e tenha uma
                operação mais organizada no computador ou no celular.
              </p>
            </div>

            <p className="mt-10 max-w-md text-sm leading-relaxed text-blue-100/55">
              Da oficina ao almoxarifado — um fluxo integrado para manter a frota municipal
              sempre em operação.
            </p>

            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-8">
              <li className="flex items-center gap-2 text-sm text-blue-100/65">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-400/80" />
                Acesso seguro
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-100/65">
                <Settings className="h-3.5 w-3.5 flex-shrink-0 text-blue-400/80" />
                Estoque e serviços
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-100/65">
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-blue-400/80" />
                Fluxo organizado
              </li>
            </ul>
          </div>
        </section>

        {/* Login panel */}
        <section className="order-1 flex items-center justify-center lg:order-2">
          <div className="w-full max-w-lg lg:max-w-xl">
            <Card className="overflow-hidden border-0 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:bg-slate-900/70 dark:shadow-slate-950/30">
              <CardHeader className="space-y-4 px-7 pb-2 pt-8 sm:px-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Truck className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">SEMTRANSP</span>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                      Acessar o sistema
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                      Entre com seu usuário e senha para abrir o painel.
                    </CardDescription>
                  </div>
                  <ThemeToggle />
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {deviceType === "mobile" ? "Acesso móvel" : "Acesso em computador"}
                  {isInstalled && (
                    <span className="text-emerald-600 dark:text-emerald-400"> · Aplicativo instalado</span>
                  )}
                </p>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 px-7 py-7 sm:px-9">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Usuário
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="username"
                        name="username"
                        placeholder="Digite seu usuário"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200/60 bg-transparent pl-11 transition focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700/60 dark:bg-transparent"
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
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="senha"
                        name="senha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={formData.senha}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200/60 bg-transparent pl-11 transition focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700/60 dark:bg-transparent"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {/* PWA install */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
                      {installDescription}
                    </p>
                    <button
                      type="button"
                      className="flex flex-shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600 transition hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={handleInstall}
                      disabled={isInstalling}
                    >
                      {isInstalling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {installTitle}
                    </button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-7 pb-8 pt-2 sm:px-9">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01] hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30"
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

                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
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
