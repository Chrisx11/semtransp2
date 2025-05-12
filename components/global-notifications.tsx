"use client"

import { useEffect, useState, useRef } from "react"
import { subscribeToOrdensServico, type OrdemServico } from "@/services/ordem-servico-service"
import { BellRing, BellOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export const GlobalNotifications = () => {
  const [somAtivado, setSomAtivado] = useState<boolean>(true)
  const [novaOrdemDetectada, setNovaOrdemDetectada] = useState<boolean>(false)
  const [ordemModificadaDetectada, setOrdemModificadaDetectada] = useState<boolean>(false)
  const [ultimaOrdemModificada, setUltimaOrdemModificada] = useState<OrdemServico | null>(null)
  const [componenteMontado, setComponenteMontado] = useState<boolean>(false)
  const [audioDesbloqueado, setAudioDesbloqueado] = useState<boolean>(false)
  const [ultimasOrdensIds, setUltimasOrdensIds] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unblockRef = useRef<boolean>(false)
  const subscriptionRef = useRef<(() => void) | null>(null)
  const audioElements = useRef<HTMLAudioElement[]>([])
  
  // Hook para inicializar o componente
  useEffect(() => {
    setComponenteMontado(true)
    console.log('GlobalNotifications - componente montado')
    
    // Pré-criar múltiplos elementos de áudio para contornar limitações dos navegadores
    for (let i = 0; i < 5; i++) {
      const audio = new Audio('/level-up-191997.mp3')
      audio.volume = 1.0
      audio.preload = 'auto'
      audioElements.current.push(audio)
    }
    
    // Tentar desbloquear áudio em diferentes eventos do usuário
    const desbloquearAudio = () => {
      if (audioDesbloqueado) return
      
      try {
        console.log('Tentativa de desbloqueio de áudio via interação')
        
        // Tenta reproduzir o som (vai falhar silenciosamente, mas "desbloqueia" para futuras reproduções)
        const audio = new Audio('/level-up-191997.mp3')
        audio.volume = 0.01 // Volume muito baixo para não incomodar
        
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Áudio desbloqueado com sucesso!')
              setAudioDesbloqueado(true)
              unblockRef.current = true
              // Pausar o áudio depois de desbloquear
              setTimeout(() => audio.pause(), 10)
            })
            .catch(e => {
              console.log('Falha esperada no desbloqueio:', e)
            })
        }
      } catch (e) {
        console.error('Erro ao tentar desbloquear áudio:', e)
      }
    }
    
    // Registrar em vários eventos para maximizar chances de desbloqueio
    document.addEventListener('click', desbloquearAudio, { once: false })
    document.addEventListener('touchstart', desbloquearAudio, { once: false })
    document.addEventListener('keydown', desbloquearAudio, { once: false })
    document.addEventListener('mousedown', desbloquearAudio, { once: false })
    
    return () => {
      setComponenteMontado(false)
      console.log('GlobalNotifications - componente desmontado')
      
      // Limpar listeners
      document.removeEventListener('click', desbloquearAudio)
      document.removeEventListener('touchstart', desbloquearAudio)
      document.removeEventListener('keydown', desbloquearAudio)
      document.removeEventListener('mousedown', desbloquearAudio)
      
      // Limpar elementos de áudio
      audioElements.current = []
    }
  }, [audioDesbloqueado])
  
  // Função para tocar o som de notificação com múltiplas estratégias
  const tocarSomNotificacao = () => {
    console.log('Tentando reproduzir som de notificação...')
    
    try {
      // Estratégia 1: usar elementos pré-criados
      let tentouReproducao = false
      
      for (const audio of audioElements.current) {
        if (!audio.paused) continue // Pular áudios já em reprodução
        
        try {
          // Reiniciar áudio e tentar reproduzir
          audio.currentTime = 0
          
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            tentouReproducao = true
            playPromise
              .then(() => {
                console.log('Som reproduzido com sucesso (estratégia 1)!')
              })
              .catch(error => {
                console.error('Erro na estratégia 1:', error)
              })
            
            // Se conseguimos iniciar a reprodução, podemos parar
            break
          }
        } catch (e) {
          console.error('Erro ao usar elemento de áudio pré-criado:', e)
        }
      }
      
      // Estratégia 2: criar um novo elemento de áudio
      if (!tentouReproducao) {
        const novoAudio = new Audio('/level-up-191997.mp3')
        novoAudio.volume = 1.0
        
        const playPromise = novoAudio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Som reproduzido com sucesso (estratégia 2)!')
            })
            .catch(error => {
              console.error('Erro na estratégia 2:', error)
              
              // Estratégia 3: usar o elemento DOM diretamente
              try {
                const audioElement = document.createElement('audio')
                audioElement.src = '/level-up-191997.mp3'
                audioElement.volume = 1.0
                document.body.appendChild(audioElement)
                
                audioElement.play()
                  .then(() => {
                    console.log('Som reproduzido com sucesso (estratégia 3)!')
                    // Remover elemento após reprodução
                    setTimeout(() => {
                      document.body.removeChild(audioElement)
                    }, 2000)
                  })
                  .catch(e => {
                    console.error('Erro na estratégia 3:', e)
                    document.body.removeChild(audioElement)
                  })
              } catch (domError) {
                console.error('Erro na estratégia 3:', domError)
              }
            })
        }
      }
    } catch (error) {
      console.error('Exceção ao tentar reproduzir som:', error)
    }
  }
  
  // Alternar som ligado/desligado
  const toggleSom = () => {
    const novoEstado = !somAtivado
    setSomAtivado(novoEstado)
    // Salvar preferência no localStorage
    localStorage.setItem('notificacoes_som_ativado', novoEstado ? 'true' : 'false')
    
    // Mostrar toast com mensagem
    toast({
      title: novoEstado ? "Notificações sonoras ativadas" : "Notificações sonoras desativadas",
      description: novoEstado 
        ? "Você receberá alertas sonoros para novas ordens de serviço" 
        : "Você não receberá alertas sonoros",
      duration: 3000,
    })
    
    // Testar o som ao ativar
    if (novoEstado) {
      setTimeout(() => {
        tocarSomNotificacao()
      }, 500)
    }
  }
  
  // Função para tratar uma nova ordem (chamada pelo listener em tempo real)
  const handleNovaOrdem = (ordem: OrdemServico) => {
    console.log("Nova OS detectada globalmente:", ordem.numero)
    
    // Verificar se já processamos esta ordem antes (evitar duplicatas)
    if (ultimasOrdensIds.has(ordem.id)) {
      console.log("Ordem já processada, ignorando:", ordem.id)
      return
    }
    
    // Adicionar à lista de ordens processadas
    setUltimasOrdensIds(prev => {
      const novoSet = new Set(prev)
      novoSet.add(ordem.id)
      // Manter apenas as últimas 20 ordens processadas
      if (novoSet.size > 20) {
        const valores = Array.from(novoSet)
        return new Set(valores.slice(valores.length - 20))
      }
      return novoSet
    })
    
    setNovaOrdemDetectada(true)
    setUltimaOrdemModificada(ordem)
    
    // Mostrar toast com notificação
    toast({
      title: "Nova ordem de serviço",
      description: `OS ${ordem.numero} criada para o veículo ${ordem.veiculoInfo}`,
      duration: 5000,
    })
    
    if (somAtivado) {
      console.log('Som ativado, reproduzindo notificação para nova OS')
      
      // Tentar reproduzir o som em múltiplas tentativas com intervalos diferentes
      tocarSomNotificacao() // Imediatamente
      
      // Tentativas adicionais em intervalos diferentes para contornar restrições
      setTimeout(() => tocarSomNotificacao(), 100)
      setTimeout(() => tocarSomNotificacao(), 500)
      setTimeout(() => tocarSomNotificacao(), 1000)
    }
    
    // Resetar flags de notificação após 5 segundos
    setTimeout(() => {
      setNovaOrdemDetectada(false)
    }, 5000)
  }
  
  // Função para tratar uma ordem atualizada (chamada pelo listener em tempo real)
  const handleOrdemAtualizada = (ordem: OrdemServico) => {
    console.log("OS atualizada globalmente:", ordem.numero)
    setOrdemModificadaDetectada(true)
    setUltimaOrdemModificada(ordem)
    
    // Mostrar toast com notificação
    toast({
      title: "Ordem de serviço atualizada",
      description: `OS ${ordem.numero} - ${ordem.status}`,
      duration: 5000,
    })
    
    if (somAtivado) {
      console.log('Som ativado, reproduzindo notificação para OS atualizada')
      
      // Múltiplas tentativas
      tocarSomNotificacao()
      setTimeout(() => tocarSomNotificacao(), 300)
    }
    
    // Resetar flags de notificação após 5 segundos
    setTimeout(() => {
      setOrdemModificadaDetectada(false)
    }, 5000)
  }
  
  // Hook para lidar com subscrições e áudio
  useEffect(() => {
    if (!componenteMontado) return
    
    console.log('GlobalNotifications - configurando listeners')
    // Recuperar preferência de som do localStorage
    const somPreferencia = localStorage.getItem('notificacoes_som_ativado')
    if (somPreferencia !== null) {
      setSomAtivado(somPreferencia === 'true')
    }
    
    // Verificar se o storage tem acesso para debug
    try {
      localStorage.setItem('teste_storage', 'ok')
      localStorage.removeItem('teste_storage')
      console.log('Acesso ao localStorage OK')
    } catch (e) {
      console.error('Erro ao acessar localStorage:', e)
    }
    
    // Configurar listener para mudanças em tempo real na tabela de ordens
    console.log('Configurando subscription para ordens de serviço')
    try {
      subscriptionRef.current = subscribeToOrdensServico(handleNovaOrdem, handleOrdemAtualizada)
    } catch (error) {
      console.error('Erro ao configurar subscription:', error)
    }
    
    // Configurar listener para evento personalizado de nova OS
    const handleNovaOrdemEvento = (event: CustomEvent) => {
      console.log('Evento nova-ordem-servico recebido!', event.detail)
      if (event.detail && event.detail.ordem) {
        // Processar a ordem como se fosse recebida do Supabase
        handleNovaOrdem(event.detail.ordem)
        
        // Tentar várias reproduções de som para maximizar chances
        if (somAtivado) {
          console.log('Tocando som via evento personalizado')
          for (let i = 0; i < 5; i++) {
            setTimeout(() => tocarSomNotificacao(), i * 200)
          }
        }
      }
    }
    
    // Adicionar o listener ao window
    window.addEventListener('nova-ordem-servico', handleNovaOrdemEvento as EventListener)
    
    // Adicionar um listener global para eventos de teclado (para tocar sons em novas ordens)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Usar F8 como tecla para testar o som
      if (e.key === 'F8') {
        console.log('Tecla F8 pressionada, testando som')
        tocarSomNotificacao()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    // Limpar listener quando o componente for desmontado
    return () => {
      console.log('Limpando listeners e subscription')
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
      }
      
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('nova-ordem-servico', handleNovaOrdemEvento as EventListener)
    }
  }, [componenteMontado, somAtivado])

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {/* Elementos de áudio escondidos na página */}
      <audio id="notificationSound1" src="/level-up-191997.mp3" preload="auto" style={{display: 'none'}} />
      <audio id="notificationSound2" src="/level-up-191997.mp3" preload="auto" style={{display: 'none'}} />
      
      {/* Botão para ligar/desligar som */}
      <button 
        onClick={(e) => {
          e.stopPropagation()
          toggleSom()
        }}
        className={`p-3 rounded-full transition-colors flex items-center gap-2 ${
          somAtivado 
            ? "bg-primary text-white hover:bg-primary/90" 
            : "bg-muted hover:bg-muted/80"
        }`}
        aria-label={somAtivado ? "Desativar notificações sonoras" : "Ativar notificações sonoras"}
        title={somAtivado ? "Desativar notificações sonoras" : "Ativar notificações sonoras"}
      >
        {somAtivado ? (
          <>
            <BellRing className="h-5 w-5" />
            <span className="text-sm">Som ativado</span>
          </>
        ) : (
          <>
            <BellOff className="h-5 w-5" />
            <span className="text-sm">Som desativado</span>
          </>
        )}
      </button>
    </div>
  )
} 