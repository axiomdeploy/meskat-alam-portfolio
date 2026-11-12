"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { X, SendHorizontal, Zap, BookOpen } from "lucide-react";

/**
 * LEVITRON — the AI inside the rocket. Opens from the nav insignia.
 * Replies are markdown-rich (bold / italic / links / code), and every live
 * answer keeps its sources behind a small icon you can open.
 * Chat history persists, and doubles as the chat log on the ROCKET·TV.
 */

export const EV_ORION = "ma:orion";

interface Source {
  title: string;
  url: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

/* the storage key keeps its old name on purpose — the ROCKET·TV reads the
   same key for CH-02, so renaming it would blank the transcript */
export const HISTORY_KEY = "ma-rusty-history";
export const EV_HISTORY = "ma:rusty-history";

const GREETING: Msg = {
  role: "assistant",
  content: "Levitron. Yeah — the name changed, the attitude didn't. Ask me something worth the cycles. 😏",
};

const CHIPS = ["Who is Meskat?", "What has he built?", "Can I see the projects?", "Any hidden socials?"];

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [GREETING];
    const arr = JSON.parse(raw) as Msg[];
    if (!Array.isArray(arr) || arr.length === 0) return [GREETING];
    return arr.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
  } catch {
    return [GREETING];
  }
}

function saveHistory(msgs: Msg[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-40)));
  } catch {}
  window.dispatchEvent(new CustomEvent(EV_HISTORY, { detail: msgs }));
}

export default function MindSystem() {
  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // which message currently has its source drawer open (null = none)
  const [openSrc, setOpenSrc] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // a quiet easter egg for the ones who open the console
  useEffect(() => {
    try {
      console.log(
        "%c🔎 off the record… %c Meskat's personal X is %c@DotSeekX%c — the fun account where he just scrolls and comments. You didn't hear it from me. https://x.com/DotSeekX",
        "color:#ffb37a;font-weight:bold",
        "color:#ffffff",
        "color:#ff8b3d;font-weight:bold",
        "color:#ffffff"
      );
    } catch {}
  }, []);

  // the nav insignia summons LEVITRON (tap or press-and-hold on the rocket)
  useEffect(() => {
    const wake = () => {
      if (openRef.current) return;
      setBooting(true);
    };
    window.addEventListener(EV_ORION, wake);
    // hidden: summon by URL — open the site with /#levitron (old #rusty/#orion too)
    let t: ReturnType<typeof setTimeout> | undefined;
    if (
      typeof window !== "undefined" &&
      (window.location.hash === "#levitron" ||
        window.location.hash === "#rusty" ||
        window.location.hash === "#orion")
    ) {
      t = setTimeout(wake, 1400);
    }
    return () => {
      window.removeEventListener(EV_ORION, wake);
      if (t) clearTimeout(t);
    };
  }, []);

  // hidden feature: type "levitron" anywhere and the AI wakes (rusty/orion still count)
  useEffect(() => {
    let buf = "";
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-8);
      if (buf.endsWith("levitron") || buf.slice(-5) === "rusty" || buf.slice(-5) === "orion") {
        buf = "";
        if (!openRef.current) window.dispatchEvent(new CustomEvent(EV_ORION));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // the boot sequence resolves on its own
  useEffect(() => {
    if (!booting) return;
    const t = setTimeout(() => {
      setBooting(false);
      setOpen(true);
    }, 950);
    return () => clearTimeout(t);
  }, [booting]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy, open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    saveHistory(next);
    setBusy(true);
    try {
      const res = await fetch("/api/mind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m !== GREETING).slice(-10),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; sources?: Source[] };
      if (!res.ok || !data.reply) throw new Error(data.error || "Transmission failed.");
      const withReply: Msg[] = [
        ...next,
        {
          role: "assistant",
          content: data.reply!,
          sources: Array.isArray(data.sources) && data.sources.length ? data.sources : undefined,
        },
      ];
      setMsgs(withReply);
      saveHistory(withReply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signal lost.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* boot overlay */}
      <AnimatePresence>
        {booting && (
          <motion.div
            key="levitron-boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[72] grid place-items-center pointer-events-none"
            style={{ background: "rgba(3,2,2,0.5)", backdropFilter: "blur(6px)" }}
          >
            <div className="text-center">
              <motion.p
                initial={{ letterSpacing: "0.9em", opacity: 0 }}
                animate={{ letterSpacing: "0.34em", opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-[family-name:var(--font-display)] font-bold text-[clamp(20px,5.4vw,38px)] flame-text"
              >
                LEVITRON
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 1] }}
                transition={{ duration: 0.8 }}
                className="mt-2 text-[10px] tracking-[0.4em] uppercase font-[family-name:var(--font-display)] text-white"
              >
                spinning up neurons
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="levitron-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Levitron AI chat"
            className="fixed z-[71] rounded-[28px] overflow-hidden flex flex-col"
            style={{
              right: "max(16px, env(safe-area-inset-right))",
              left: "max(16px, env(safe-area-inset-left))",
              bottom: "calc(env(safe-area-inset-bottom) + 84px)",
              maxWidth: 384,
              marginLeft: "auto",
              height: "min(540px, 72dvh)",
              background: "linear-gradient(165deg, rgba(18,13,8,0.97), rgba(10,7,4,0.97))",
              border: "1px solid rgba(255,171,105,0.16)",
              boxShadow: "0 30px 90px -20px rgba(0,0,0,0.85), 0 20px 60px -20px rgba(255,120,50,0.25)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* header */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-[#ffab6916]">
              <span
                className="w-9 h-9 rounded-full grid place-items-center text-[#180c03] shrink-0"
                style={{ background: "linear-gradient(135deg, #ffd9a8, #ff8b3d 60%, #ff5e2b)" }}
                aria-hidden
              >
                <Zap size={17} strokeWidth={2.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-display)] font-semibold text-[13px] text-white leading-tight tracking-[0.08em]">
                  LEVITRON
                </p>
                <p className="text-[10px] tracking-[0.1em] font-[family-name:var(--font-display)] text-white/65 truncate">
                  Most human AI · made by Meskat
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-8 h-8 rounded-full grid place-items-center border border-white/10 text-white hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[86%] flex flex-col items-start gap-1.5">
                    <div
                      className={`rounded-3xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                        m.role === "user" ? "text-[#180c03] rounded-br-lg self-end" : "text-white rounded-bl-lg border border-[#ffab691c]"
                      }`}
                      style={
                        m.role === "user"
                          ? { background: "linear-gradient(120deg, #ffb37a, #ff8b3d)" }
                          : { background: "rgba(255,255,255,0.045)" }
                      }
                    >
                      {m.role === "assistant" ? (
                        <div className="[&>p]:m-0 [&_strong]:text-[#ffb37a] [&_em]:text-white [&_a]:text-[#ffb37a] [&_a]:underline [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#ff8b3d66] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:opacity-90 [&_s]:opacity-60">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* sources live behind this little icon — click to reveal all */}
                    {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                      <div className="w-full">
                        <button
                          type="button"
                          onClick={() => setOpenSrc(openSrc === i ? null : i)}
                          aria-expanded={openSrc === i}
                          aria-label={`Show the ${m.sources.length} sources for this answer`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ffab6926] bg-white/[0.03] px-2.5 py-1 text-[10px] tracking-[0.16em] uppercase font-[family-name:var(--font-display)] text-white/70 hover:text-white hover:border-[#ff8b3d66] transition-colors cursor-pointer"
                        >
                          <BookOpen size={11} aria-hidden />
                          {m.sources.length} source{m.sources.length > 1 ? "s" : ""}
                        </button>
                        <AnimatePresence>
                          {openSrc === i && (
                            <motion.ul
                              key="src-list"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              className="mt-1.5 w-full max-w-[280px] rounded-2xl border border-[#ffab691e] bg-[#0b0811ee] backdrop-blur-md p-1.5 space-y-0.5"
                            >
                              {m.sources.map((s) => (
                                <li key={s.url}>
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 text-[11.5px] leading-snug text-[#c9bcae] hover:text-white hover:bg-white/5 transition-colors"
                                  >
                                    <span className="min-w-0 break-words">{s.title || s.url}</span>
                                    <span aria-hidden className="shrink-0 text-[#ffb37a]">↗</span>
                                  </a>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div
                    className="rounded-3xl rounded-bl-lg border border-[#ffab691c] px-3 py-2.5 flex items-center gap-2.5"
                    style={{ background: "rgba(255,255,255,0.045)" }}
                    aria-label="Levitron is thinking"
                  >
                    <Image
                      src="/brain.gif"
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="w-[44px] h-[44px] rounded-xl object-cover shrink-0"
                    />
                    <span className="dot-text text-[11px] tracking-[0.16em] uppercase text-[#ffb37a]">
                      thinking…
                    </span>
                  </div>
                </div>
              )}

              {error && <p className="text-center text-[11.5px] text-[#ffb37a] px-4">{error}</p>}
            </div>

            {/* chips + input */}
            <div className="shrink-0 px-4 pb-4 pt-1 border-t border-[#ffab6916]">
              <div className="flex gap-2 overflow-x-auto pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    disabled={busy}
                    className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-[#ffab6926] bg-white/[0.03] text-white hover:border-[#ff8b3d66] hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Levitron…"
                  maxLength={400}
                  aria-label="Message Levitron AI"
                  className="flex-1 min-w-0 rounded-full bg-white/[0.05] border border-[#ffab691e] px-4 py-3 text-[13.5px] text-white placeholder:text-white/60 outline-none focus:border-[#ff8b3d66] transition-colors"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                  className="shrink-0 w-11 h-11 rounded-full grid place-items-center text-[#180c03] disabled:opacity-35 transition-opacity cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #ffb37a, #ff5e2b)" }}
                >
                  <SendHorizontal size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
