"use client"

import { useEffect, useState, useRef } from "react"
import { subscribeToOrdensServico, getOrdemServicoByIdSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import { toast } from "@/hooks/use-toast"

export const GlobalNotifications = () => {
  const [somAtivado, setSomAtivado] = useState<boolean>(true)
  const [novaOrdemDetectada, setNovaOrdemDetectada] = useState<boolean>(false)
  const [ordemModificadaDetectada, setOrdemModificadaDetectada] = useState<boolean>(false)
  const [ultimaOrdemModificada, setUltimaOrdemModificada] = useState<OrdemServico | null>(null)
  const [componenteMontado, setComponenteMontado] = useState<boolean>(false)
  const [audioDesbloqueado, setAudioDesbloqueado] = useState<boolean>(false)
  const [ultimasOrdensIds, setUltimasOrdensIds] = useState<Set<string>>(new Set())
  const ultimasOrdensIdsRef = useRef<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unblockRef = useRef<boolean>(false)
  const subscriptionRef = useRef<(() => void) | null>(null)
  const audioElements = useRef<HTMLAudioElement[]>([])
  const ultimoSomRef = useRef<number>(0) // Timestamp da última reprodução de som
  
  // Hook para inicializar o componente
  useEffect(() => {
    setComponenteMontado(true)
    console.log('GlobalNotifications - componente montado')
    
    // Pré-criar múltiplos elementos de áudio para contornar limitações dos navegadores
    for (let i = 0; i < 5; i++) {
      try {
        const audio = new Audio('/level-up-191997.mp3')
        audio.volume = 1.0
        audio.preload = 'auto'
        // Adicionar tratamento de erro para evitar erros no console
        audio.addEventListener('error', (e) => {
          console.warn('Erro ao carregar áudio de notificação:', e)
        })
        audioElements.current.push(audio)
      } catch (error) {
        console.warn('Erro ao criar elemento de áudio:', error)
      }
    }
    
    // Tentar desbloquear áudio em diferentes eventos do usuário
    const desbloquearAudio = () => {
      if (audioDesbloqueado) return
      
      try {
        console.log('Tentativa de desbloqueio de áudio via interação')
        
        // Tenta reproduzir o som (vai falhar silenciosamente, mas "desbloqueia" para futuras reproduções)
        const audio = new Audio('/level-up-191997.mp3')
        audio.volume = 0.01 // Volume muito baixo para não incomodar
        
        // Adicionar tratamento de erro
        audio.addEventListener('error', (e) => {
          console.warn('Erro ao carregar áudio para desbloqueio:', e)
        })
        
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
              // Erro silencioso - é esperado em alguns casos
              console.log('Falha esperada no desbloqueio:', e)
            })
        }
      } catch (e) {
        // Erro silencioso - não crítico
        console.warn('Erro ao tentar desbloquear áudio:', e)
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
    // Evitar tocar som várias vezes em um curto período de tempo
    const agora = Date.now()
    if (agora - ultimoSomRef.current < 2000) {
      console.log('Som já tocado recentemente, ignorando nova chamada')
      return
    }
    
    // Atualizar o timestamp da última reprodução
    ultimoSomRef.current = agora
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
        try {
          const novoAudio = new Audio('/level-up-191997.mp3')
          novoAudio.volume = 1.0
          
          // Adicionar tratamento de erro
          novoAudio.addEventListener('error', (e) => {
            console.warn('Erro ao carregar áudio (estratégia 2):', e)
          })
          
          const playPromise = novoAudio.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Som reproduzido com sucesso (estratégia 2)!')
              })
              .catch(error => {
                console.warn('Erro na estratégia 2:', error)
                
                // Estratégia 3: usar o elemento DOM diretamente
                try {
                  const audioElement = document.createElement('audio')
                  audioElement.src = '/level-up-191997.mp3'
                  audioElement.volume = 1.0
                  
                  // Adicionar tratamento de erro
                  audioElement.addEventListener('error', (e) => {
                    console.warn('Erro ao carregar áudio (estratégia 3):', e)
                    if (document.body.contains(audioElement)) {
                      document.body.removeChild(audioElement)
                    }
                  })
                  
                  document.body.appendChild(audioElement)
                  
                  audioElement.play()
                    .then(() => {
                      console.log('Som reproduzido com sucesso (estratégia 3)!')
                      // Remover elemento após reprodução
                      setTimeout(() => {
                        if (document.body.contains(audioElement)) {
                          document.body.removeChild(audioElement)
                        }
                      }, 2000)
                    })
                    .catch(e => {
                      console.warn('Erro na estratégia 3:', e)
                      if (document.body.contains(audioElement)) {
                        document.body.removeChild(audioElement)
                      }
                    })
                } catch (domError) {
                  console.warn('Erro na estratégia 3:', domError)
                }
              })
          }
        } catch (error) {
          console.warn('Erro ao criar novo elemento de áudio:', error)
        }
      }
    } catch (error) {
      console.error('Exceção ao tentar reproduzir som:', error)
    }
  }
  
  // Função helper para extrair o nome do usuário que fez a ação
  const extrairNomeUsuario = (ordem: OrdemServico): string => {
    // Tentar pegar do último evento do histórico (sempre priorizar o histórico)
    if (ordem.historico && ordem.historico.length > 0) {
      const ultimoEvento = ordem.historico[ordem.historico.length - 1]
      if (ultimoEvento.usuarioNome) {
        return ultimoEvento.usuarioNome
      }
    }
    // Se não houver no histórico, retornar "Sistema" (não usar solicitante/mecânico)
    return "Sistema"
  }

  // Função para tratar uma nova ordem (chamada pelo listener em tempo real)
  const handleNovaOrdem = async (ordem: OrdemServico) => {
    console.log("Nova OS detectada globalmente:", ordem.numero)
    // Controle de duplicidade usando ref para garantir sincronia
    if (ultimasOrdensIdsRef.current.has(ordem.id)) {
      console.log("Ordem já processada, ignorando:", ordem.id)
      return
    }
    ultimasOrdensIdsRef.current.add(ordem.id)
    setUltimasOrdensIds(new Set(ultimasOrdensIdsRef.current))
    setNovaOrdemDetectada(true)
    setUltimaOrdemModificada(ordem)
    
    // Buscar a ordem atualizada do banco para garantir que temos o histórico completo
    // Adicionar um pequeno delay para garantir que o histórico foi salvo no banco
    let ordemCompleta = ordem
    try {
      // Aguardar um pouco para garantir que o histórico foi persistido
      await new Promise(resolve => setTimeout(resolve, 100))
      const ordemAtualizada = await getOrdemServicoByIdSupabase(ordem.id)
      if (ordemAtualizada) {
        ordemCompleta = ordemAtualizada
        console.log("Ordem buscada do banco com histórico completo:", JSON.stringify(ordemAtualizada.historico, null, 2))
      }
    } catch (error) {
      console.error("Erro ao buscar ordem atualizada:", error)
    }
    
    // Extrair o nome do usuário que criou a ordem do histórico completo
    const nomeUsuario = extrairNomeUsuario(ordemCompleta)
    console.log("Nome do usuário extraído:", nomeUsuario)
    console.log("Último evento do histórico:", ordemCompleta.historico?.[ordemCompleta.historico.length - 1])
    
    // Mostrar toast com notificação - usar uma propriedade customizada para passar o userName
    toast({
      title: "Nova ordem de serviço",
      description: `OS ${ordemCompleta.numero} criada para o veículo ${ordemCompleta.veiculoInfo}`,
      duration: 5000,
      // Adicionar propriedade customizada que será capturada pelo toaster
      userName: nomeUsuario,
    } as any)
    
    if (somAtivado) {
      console.log('Som ativado, reproduzindo notificação para nova OS')
      
      // Tocar o som apenas uma vez
      tocarSomNotificacao()
    }
    
    // Resetar flags de notificação após 5 segundos
    setTimeout(() => {
      setNovaOrdemDetectada(false)
    }, 5000)
  }
  
  // Função para tratar uma ordem atualizada (chamada pelo listener em tempo real)
  const handleOrdemAtualizada = async (ordem: OrdemServico) => {
    console.log("OS atualizada globalmente:", ordem.numero)
    setOrdemModificadaDetectada(true)
    setUltimaOrdemModificada(ordem)
    
    // Buscar a ordem atualizada do banco para garantir que temos o histórico completo
    // Adicionar um pequeno delay para garantir que o histórico foi salvo no banco
    let ordemCompleta = ordem
    try {
      // Aguardar um pouco para garantir que o histórico foi persistido
      await new Promise(resolve => setTimeout(resolve, 100))
      const ordemAtualizada = await getOrdemServicoByIdSupabase(ordem.id)
      if (ordemAtualizada) {
        ordemCompleta = ordemAtualizada
        console.log("Ordem atualizada buscada do banco com histórico completo:", JSON.stringify(ordemAtualizada.historico, null, 2))
      }
    } catch (error) {
      console.error("Erro ao buscar ordem atualizada:", error)
    }
    
    // Extrair o nome do usuário que atualizou a ordem do histórico completo
    const nomeUsuario = extrairNomeUsuario(ordemCompleta)
    console.log("Nome do usuário extraído:", nomeUsuario)
    console.log("Último evento do histórico:", ordemCompleta.historico?.[ordemCompleta.historico.length - 1])
    
    // Mostrar toast com notificação
    toast({
      title: "Ordem de serviço atualizada",
      description: `OS ${ordemCompleta.numero} - ${ordemCompleta.status}`,
      duration: 5000,
      // Adicionar propriedade customizada que será capturada pelo toaster
      userName: nomeUsuario,
    } as any)
    
    if (somAtivado) {
      console.log('Som ativado, reproduzindo notificação para OS atualizada')
      
      // Tocar o som apenas uma vez
      tocarSomNotificacao()
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
    
    // Listener para mudanças no toggle de som (disparado pelo SoundToggle)
    const handleSoundToggleChanged = (event: Event) => {
      const customEvent = event as CustomEvent
      setSomAtivado(customEvent.detail.enabled)
    }
    
    window.addEventListener('sound-toggle-changed', handleSoundToggleChanged)
    
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
    
    // Adicionar um listener global para eventos de teclado (para tocar sons em novas ordens)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Usar F8 como tecla para testar o som
      if (e.key === 'F8') {
        console.log('Tecla F8 pressionada, testando som')
        tocarSomNotificacao()
      }
    }
    
    // Adicionar listener para eventos de status da conexão realtime (apenas para debug no console)
    const handleRealtimeReconnecting = (event: CustomEvent) => {
      if (event.detail) {
        const { tentativa, maximo, tempoEspera } = event.detail
        console.log(`Tentando reconectar realtime: ${tentativa}/${maximo} em ${tempoEspera}s`)
        // Toast removido - apenas log no console
      }
    }
    
    const handleRealtimeConnectionFailed = () => {
      console.log('Falha permanente na conexão realtime')
      // Toast removido - apenas log no console
    }
    
    const handleRealtimeConnectionRestored = () => {
      console.log('Conexão realtime restaurada')
      // Toast removido - apenas log no console
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('realtime-reconnecting', handleRealtimeReconnecting as EventListener)
    window.addEventListener('realtime-connection-failed', handleRealtimeConnectionFailed)
    window.addEventListener('realtime-connection-restored', handleRealtimeConnectionRestored)
    
    // Limpar listener quando o componente for desmontado
    return () => {
      console.log('Limpando listeners e subscription')
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
      }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('realtime-reconnecting', handleRealtimeReconnecting as EventListener)
      window.removeEventListener('realtime-connection-failed', handleRealtimeConnectionFailed)
      window.removeEventListener('realtime-connection-restored', handleRealtimeConnectionRestored)
      window.removeEventListener('sound-toggle-changed', handleSoundToggleChanged)
    }
  }, [componenteMontado, somAtivado])

  return (
    <div className="hidden">
      {/* Elementos de áudio escondidos na página - com tratamento de erro silencioso */}
      <audio 
        id="notificationSound1" 
        src="/level-up-191997.mp3" 
        preload="auto" 
        style={{display: 'none'}}
        onError={(e) => {
          console.warn('Erro ao carregar áudio de notificação 1:', e)
        }}
      />
      <audio 
        id="notificationSound2" 
        src="/level-up-191997.mp3" 
        preload="auto" 
        style={{display: 'none'}}
        onError={(e) => {
          console.warn('Erro ao carregar áudio de notificação 2:', e)
        }}
      />
    </div>
  )
} 