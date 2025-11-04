import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MensagemChat {
  id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
  user_email?: string;
}

export function ChatWidget({ user }: { user: User }) {
  const supabase = createClientComponentClient();
  const [open, setOpen] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar mensagens dos últimos 7 dias
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchMensagens = async () => {
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("*, user: user_id ( email )")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });
      if (!error && data) {
        setMensagens(
          data.map((msg: any) => ({ ...msg, user_email: msg.user?.email || "" }))
        );
      }
      setLoading(false);
    };
    fetchMensagens();
    // Realtime subscription
    const channel = supabase
      .channel("mensagens_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens_chat" },
        (payload) => {
          setMensagens((msgs) => [
            ...msgs,
            { ...payload.new, user_email: "" },
          ]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  // Scroll para a última mensagem
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, open]);

  // Enviar mensagem
  const enviarMensagem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!novaMensagem.trim()) return;
    if (!user || !user.id) {
      alert("Usuário não autenticado ou id inválido. Não é possível enviar mensagem.");
      console.error("[ChatWidget] Usuário inválido ao tentar enviar mensagem:", user);
      return;
    }
    // Verificação extra: user.id deve ser um UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      alert("ID do usuário não é um UUID válido. Não é possível enviar mensagem.");
      console.error("[ChatWidget] user.id não é UUID:", user.id);
      return;
    }
    // Log para depuração
    console.log("[ChatWidget] Enviando mensagem:", { user_id: user.id, conteudo: novaMensagem.trim() });
    const response = await supabase.from("mensagens_chat").insert({
      user_id: user.id,
      conteudo: novaMensagem.trim(),
    });
    if (response.error) {
      alert("Erro ao enviar mensagem: " + response.error.message);
      console.error("[ChatWidget] Erro ao inserir mensagem:", response);
    } else {
      setNovaMensagem("");
    }
  };

  return (
    <>
      {/* Ícone flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <Button
            className="rounded-full shadow-lg p-3 bg-primary text-white hover:bg-primary/90"
            onClick={() => setOpen(true)}
            aria-label="Abrir chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>
      {/* Janela de chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[95vw] bg-background border rounded-lg shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-primary text-white rounded-t-lg">
            <span className="font-semibold">Bate-papo</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar chat">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted" style={{ maxHeight: 350 }}>
            {loading ? (
              <div className="text-center text-muted-foreground">Carregando...</div>
            ) : mensagens.length === 0 ? (
              <div className="text-center text-muted-foreground">Nenhuma mensagem.</div>
            ) : (
              mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.user_id === user.id ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] text-sm shadow-sm ${
                      msg.user_id === user.id
                        ? "bg-primary text-white"
                        : "bg-white text-foreground border"
                    }`}
                  >
                    {msg.conteudo}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {msg.user_email || msg.user_id} • {new Date(msg.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={enviarMensagem} className="flex items-center gap-2 p-3 border-t bg-background rounded-b-lg">
            <Input
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              maxLength={500}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!novaMensagem.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
} 