import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Sparkles, MessageSquarePlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageBubble from "@/components/agents/MessageBubble";
import moment from "moment";

export default function Nova() {
  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const list = await base44.agents.listConversations({ agent_name: "Nova" });
      setConversations(list);
      if (list.length > 0) {
        setCurrentId(list[0].id);
      } else {
        const conv = await base44.agents.createConversation({ agent_name: "Nova", metadata: { name: "New conversation" } });
        setConversations([conv]);
        setCurrentId(conv.id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentId) return;
    const conv = conversations.find(c => c.id === currentId);
    if (conv?.messages) setMessages(conv.messages);
    const unsubscribe = base44.agents.subscribeToConversation(currentId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [currentId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !currentId) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const conv = conversations.find(c => c.id === currentId);
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const handleNewConversation = async () => {
    const conv = await base44.agents.createConversation({ agent_name: "Nova", metadata: { name: "New conversation" } });
    setConversations([conv, ...conversations]);
    setCurrentId(conv.id);
    setShowList(false);
  };

  const currentConv = conversations.find(c => c.id === currentId);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold leading-none">Nova</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Your PD companion</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowList(!showList)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border text-sm font-medium hover:bg-secondary transition-colors">
            <span className="max-w-[140px] truncate">{currentConv?.metadata?.name || "Conversation"}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          {showList && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-card border rounded-xl shadow-lg z-20 overflow-hidden">
              <button onClick={handleNewConversation} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 border-b">
                <MessageSquarePlus size={16} /> New conversation
              </button>
              <div className="max-h-64 overflow-y-auto">
                {conversations.map(c => (
                  <button key={c.id} onClick={() => { setCurrentId(c.id); setShowList(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm border-b last:border-0 hover:bg-secondary/60 ${c.id === currentId ? "bg-secondary" : ""}`}>
                    <p className="font-medium truncate">{c.metadata?.name || "Conversation"}</p>
                    <p className="text-[10px] text-muted-foreground">{moment(c.created_date).format("MMM D, h:mm A")}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Sparkles size={26} className="text-white" />
            </div>
            <p className="font-heading text-lg font-semibold">Hi, I'm Nova</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">I can help you log exchanges, track vitals, review symptoms, manage meds, and plan trips. What would you like to do?</p>
          </div>
        ) : (
          messages.map((m, idx) => <MessageBubble key={idx} message={m} />)
        )}
      </div>

      <div className="border-t pt-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask Nova to log or review something…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-h-32"
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} className="rounded-xl h-10 w-10 p-0 shrink-0">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}