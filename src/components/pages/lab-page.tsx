"use client";

import { GuestNote } from "@/types/portfolio";
import { useCallback, useEffect, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

type AgentReply = { answer: string; source: string };

export function LabPage({ serverLang }: { serverLang: Language }) {
  const { m: ctxM, lang: ctxLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const m = mounted ? ctxM : messages[serverLang];
  const lang = mounted ? ctxLang : serverLang;

  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentReply, setAgentReply] = useState<AgentReply | null>(null);
  const [guestNotes, setGuestNotes] = useState<GuestNote[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [guestbookError, setGuestbookError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGuestbook = useCallback(async () => {
    try {
      const response = await fetch("/api/guestbook");
      if (!response.ok) {
        setGuestbookError(lang === "zh" ? "留言加载失败，请稍后重试。" : "Failed to load messages.");
        return;
      }
      setGuestbookError("");
      setGuestNotes((await response.json()) as GuestNote[]);
    } catch {
      setGuestbookError(lang === "zh" ? "留言加载失败，请检查网络后重试。" : "Failed to load messages.");
    }
  }, [lang]);

  useEffect(() => {
    const bootTimer = setTimeout(() => { void fetchGuestbook(); }, 0);
    const timer = setInterval(fetchGuestbook, 9000);
    return () => { clearTimeout(bootTimer); clearInterval(timer); };
  }, [fetchGuestbook]);

  const askAgent = async () => {
    const question = agentQuestion.trim();
    if (!question) return;
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang }),
    });
    if (!response.ok) return;
    setAgentReply((await response.json()) as AgentReply);
  };

  const submitNote = async () => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setGuestbookError("");
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, message }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setGuestbookError(body.error ?? (lang === "zh" ? "留言提交失败" : "Failed to submit"));
        return;
      }
      setMessage("");
      void fetchGuestbook();
    } catch {
      setGuestbookError(lang === "zh" ? "留言提交失败" : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="lab-page" id="connect">
      <div className="lab-header reveal" data-reveal>
        <h2>Let&apos;s <span className="it">talk</span></h2>
      </div>

      <div className="lab-grid reveal-stagger" data-reveal>
        <div className="lab-col">
          <h3>{m.lab.chatTitle}</h3>
          <p className="lab-hint">{m.lab.chatHint}</p>
          <div className="lab-input-group">
            <input className="lab-input" value={agentQuestion} onChange={(e) => setAgentQuestion(e.target.value)} placeholder={m.lab.chatInput} />
            <button className="lab-btn" onClick={askAgent}>{m.lab.ask}</button>
          </div>
          {agentReply && (
            <div style={{ marginTop: "1rem" }}>
              <p>{agentReply.answer}</p>
              <p className="lab-hint" style={{ marginTop: "0.3rem" }}>{agentReply.source}</p>
            </div>
          )}
        </div>

        <div className="lab-col">
          <h3>{m.lab.wallTitle}</h3>
          <p className="lab-hint">I read every message.</p>
          <div className="lab-input-group">
            <input className="lab-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={m.lab.name} />
          </div>
          <div className="lab-input-group">
            <input className="lab-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={m.lab.message} />
            <button className="lab-btn" onClick={submitNote} disabled={isSubmitting}>
              {isSubmitting ? (lang === "zh" ? "发送中..." : "Sending...") : m.lab.send}
            </button>
          </div>
          {guestbookError && <p className="lab-error">{guestbookError}</p>}
          <div style={{ marginTop: "1rem" }}>
            {guestNotes.map((note) => (
              <div key={note.id} className="guest-note">
                <div className="author">{note.author}</div>
                <div className="msg">{note.message}</div>
                <div className="time">{new Date(note.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
