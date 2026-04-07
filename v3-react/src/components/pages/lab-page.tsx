"use client";

import { motion } from "framer-motion";
import { GuestNote } from "@/types/portfolio";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type AgentReply = {
  answer: string;
  source: string;
};

export function LabPage() {
  const { m, lang } = useLanguage();
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
        setGuestbookError(
          lang === "zh"
            ? "留言加载失败，请稍后重试。"
            : "Failed to load messages. Please try again.",
        );
        return;
      }
      setGuestbookError("");
      setGuestNotes((await response.json()) as GuestNote[]);
    } catch {
      setGuestbookError(
        lang === "zh"
          ? "留言加载失败，请检查网络后重试。"
          : "Failed to load messages. Please check your network.",
      );
    }
  }, [lang]);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      void fetchGuestbook();
    }, 0);
    const timer = setInterval(fetchGuestbook, 9000);
    return () => {
      clearTimeout(bootTimer);
      clearInterval(timer);
    };
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
        setGuestbookError(
          body.error ??
            (lang === "zh"
              ? "留言提交失败，请稍后重试。"
              : "Failed to submit message. Please try again."),
        );
        return;
      }
      setMessage("");
      void fetchGuestbook();
    } catch {
      setGuestbookError(
        lang === "zh"
          ? "留言提交失败，请检查网络后重试。"
          : "Failed to submit message. Please check your network.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="layout-grid">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card"
      >
        <h2>{m.lab.chatTitle}</h2>
        <p className="hint">{m.lab.chatHint}</p>
        <div className="agent-box">
          <input
            value={agentQuestion}
            onChange={(event) => setAgentQuestion(event.target.value)}
            placeholder={m.lab.chatInput}
          />
          <button onClick={askAgent}>{m.lab.ask}</button>
        </div>
        {agentReply && (
          <div className="agent-reply">
            <p>{agentReply.answer}</p>
            <p className="hint">{agentReply.source}</p>
          </div>
        )}
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card wide"
      >
        <h2>{m.lab.wallTitle}</h2>
        <div className="agent-box">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder={m.lab.name}
          />
        </div>
        <div className="agent-box">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={m.lab.message}
          />
          <button onClick={submitNote} disabled={isSubmitting}>
            {isSubmitting ? (lang === "zh" ? "发送中..." : "Sending...") : m.lab.send}
          </button>
        </div>
        {guestbookError && (
          <p className="hint" style={{ color: "#dc2626" }}>
            {guestbookError}
          </p>
        )}
        <div className="notes">
          {guestNotes.map((note) => (
            <div key={note.id} className="note">
              <p>
                <strong>{note.author}</strong>: {note.message}
              </p>
              <p className="hint">{new Date(note.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
