"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check, Copy, Mail, Send, X } from "lucide-react";
import {
  copyMailAddress,
  DISCORD_URL,
  EV_CONTACT,
  gmailCompose,
  openGmail,
  X_TEAM_URL,
  type ContactDetail,
} from "@/lib/contact";

/* Contact channels are real links, but the address / handle / user ID is
   never printed anywhere in the UI. The modal is the only form, and it only
   appears when someone asks for it. */

const LABEL =
  "block text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-white font-[family-name:var(--font-display)]";
const VALUE =
  "block mt-1.5 font-[family-name:var(--font-display)] font-semibold text-[14px] sm:text-[16px] text-white truncate";
const FIELD =
  "mt-2 w-full rounded-2xl bg-white/[0.05] border border-[#ffab691e] px-4 py-3 text-[14px] text-white placeholder:text-white/45 outline-none focus:border-[#ff8b3d66] transition-colors";

interface Draft {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const EMPTY_DRAFT: Draft = { name: "", email: "", topic: "", message: "" };
const DRAFT_KEY = "ma-contact-draft";

function XIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function DiscordIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.182 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

function GitHubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.9 5.33.9 11.6c0 4.87 3.16 9 7.54 10.46.55.1.75-.24.75-.53v-1.86c-3.07.67-3.71-1.48-3.71-1.48-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.45-.28-5.03-1.23-5.03-5.47 0-1.21.43-2.2 1.14-2.97-.11-.28-.5-1.41.11-2.94 0 0 .93-.3 3.05 1.13a10.5 10.5 0 0 1 5.56 0c2.12-1.43 3.04-1.13 3.04-1.13.62 1.53.23 2.66.11 2.94.71.77 1.14 1.76 1.14 2.97 0 4.25-2.59 5.19-5.05 5.46.4.34.75 1.02.75 2.06v3.05c0 .29.2.64.76.53 4.37-1.46 7.53-5.59 7.53-10.46C23.1 5.33 18.27.5 12 .5Z" />
    </svg>
  );
}

function GmailIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11.4 3.6 5.1A2.1 2.1 0 0 1 6.8 4L12 7.9 17.2 4a2.1 2.1 0 0 1 3.2 1.1L12 11.4Z" />
      <path fill="#FBBC04" d="M3 6.1v11.8A2.1 2.1 0 0 0 5.1 20H6V8.2L3 6.1Z" />
      <path fill="#34A853" d="M21 6.1v11.8A2.1 2.1 0 0 1 18.9 20H18V8.2l3-2.1Z" />
      <path fill="#4285F4" d="M6 8.2V20h12V8.2l-6 4.4-6-4.4Z" />
      <path fill="#fff" d="m6.9 9.6 5.1 3.7 5.1-3.7V19H6.9V9.6Z" opacity=".95" />
    </svg>
  );
}

const CHANNELS = [
  {
    key: "gmail",
    label: "Gmail",
    value: "Fastest reply",
    note: "Usually within a day",
    icon: <GmailIcon />,
    tint: "#EA4335",
    href: gmailCompose("Hello Meskat", "Hi Meskat,\n\nI found your portfolio and wanted to reach out.\n\n— "),
  },
  {
    key: "x",
    label: "X",
    value: "Team channel",
    note: "Projects & quick DMs",
    icon: <XIcon />,
    tint: "#e8eef8",
    href: X_TEAM_URL,
  },
  {
    key: "discord",
    label: "Discord",
    value: "Direct line",
    note: "Best for fast questions",
    icon: <DiscordIcon />,
    tint: "#5865F2",
    href: DISCORD_URL,
  },
] as const;

export default function Contact() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // footer credits easter egg
  const [credits, setCredits] = useState(false);
  const tapRef = useRef<number[]>([]);

  // load the local draft after mount (never during SSR/hydration)
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setDraft({ ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) });
      } catch {}
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
    const show = window.setTimeout(() => setSaved(true), 0);
    const hide = window.setTimeout(() => setSaved(false), 1200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [draft, loaded]);

  // any CTA can summon the form through the shared event
  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<ContactDetail>).detail;
      if (!detail || detail.channel === undefined || detail.channel === "form") {
        if (detail?.topic || detail?.message) {
          setDraft((prev) => ({
            ...prev,
            topic: detail.topic ?? prev.topic,
            message: detail.message ?? prev.message,
          }));
        }
        setSent(false);
        setOpen(true);
      }
    };
    window.addEventListener(EV_CONTACT, onOpen);
    return () => window.removeEventListener(EV_CONTACT, onOpen);
  }, []);

  // lock scroll + esc while the form is open
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => nameRef.current?.focus(), 320);
    return () => {
      document.body.classList.remove("locked");
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  // hidden route: /#contact opens the form on demand (never on scroll)
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#contact") return;
    const t = window.setTimeout(() => setOpen(true), 1600);
    return () => window.clearTimeout(t);
  }, []);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const canSend = draft.name.trim().length > 1 && draft.message.trim().length > 3;

  const sendMail = () => {
    if (!canSend) return;
    const subject = draft.topic.trim() || "Hello Meskat";
    const body = [
      draft.message.trim(),
      "",
      `— ${draft.name.trim()}${draft.email.trim() ? ` (${draft.email.trim()})` : ""}`,
    ].join("\n");
    openGmail(subject, body);
    setSent(true);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDraft(EMPTY_DRAFT);
  };

  const copyDraft = async () => {
    const subject = draft.topic.trim() || "Hello Meskat";
    const body = [
      draft.message.trim(),
      "",
      `— ${draft.name.trim()}${draft.email.trim() ? ` (${draft.email.trim()})` : ""}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const copyAddress = async () => {
    const ok = await copyMailAddress();
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const creditsTap = () => {
    const now = Date.now();
    tapRef.current = [...tapRef.current.filter((t) => now - t < 1600), now];
    if (tapRef.current.length >= 3) {
      tapRef.current = [];
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(25);
        } catch {}
      }
      setCredits(true);
      window.setTimeout(() => setCredits(false), 5200);
    }
  };

  return (
    <section id="contact" className="relative px-5 sm:px-8 pt-28 sm:pt-36 pb-10">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <span className="stage-chip">
            <span className="chip-dot" />
            Stage 04 · Deep space
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 font-[family-name:var(--font-display)] font-bold leading-[1.02] tracking-[-0.01em] text-[clamp(38px,7.5vw,84px)] text-center"
        >
          Let&apos;s build something
          <br />
          <span className="flame-text">real.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.12, duration: 0.8 }}
          className="mt-6 text-center text-[15px] leading-relaxed text-white max-w-lg mx-auto"
        >
          Have a project in mind, or just want to talk technology, ideas and future
          innovations? Pick a channel. No addresses shown, no spam, no dead links.
        </motion.p>

        {/* live contact channels — real links, hidden identities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="mt-12 grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto"
        >
          {CHANNELS.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contact via ${c.label}`}
              className="group relative rounded-[28px] glass px-5 py-6 flex flex-col text-left transition-all duration-500 hover:border-[#ff8b3d55] hover:-translate-y-1 overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute -top-16 -right-12 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${c.tint}22, transparent 70%)` }}
              />
              <span className="flex items-start justify-between gap-3">
                <span
                  className="w-12 h-12 shrink-0 rounded-full grid place-items-center border border-white/10 bg-white/[0.05] transition-transform duration-500 group-hover:scale-110"
                  style={{ color: c.tint }}
                >
                  {c.icon}
                </span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-white/45 group-hover:text-[#ffb37a] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-5">
                <span className={LABEL}>{c.label}</span>
                <span className={VALUE}>{c.value}</span>
              </span>
              <span className="mt-2 text-[11px] text-white/55 leading-relaxed">{c.note}</span>
              <span
                aria-hidden
                className="mt-5 h-px w-full"
                style={{ background: `linear-gradient(90deg, ${c.tint}66, transparent)` }}
              />
            </a>
          ))}
        </motion.div>

        {/* the only CTA that opens the form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.22, duration: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button type="button" onClick={() => setOpen(true)} className="btn-flame cursor-pointer">
            <Send size={16} aria-hidden />
            Send a mission brief
          </button>
          <button type="button" onClick={copyAddress} className="btn-ghost cursor-pointer">
            {copied ? <Check size={16} className="text-[#ffb37a]" aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? "Address copied" : "Copy address"}
          </button>
        </motion.div>
        <p className="mt-4 text-center text-[10.5px] text-white/55 leading-relaxed">
          The form opens only when you ask for it. Your draft stays on this device.
        </p>

        {/* footer */}
        <footer className="mt-28 sm:mt-36 border-t border-[#ffab6914]">
          <div className="py-6 overflow-hidden border-b border-[#ffab6914]" aria-hidden>
            <div className="marquee-track">
              {Array.from({ length: 2 }).map((_, half) => (
                <div key={half} className="flex items-center shrink-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-6 px-6 font-[family-name:var(--font-display)] text-[13px] tracking-[0.34em] uppercase text-white"
                    >
                      Available for opportunities
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff8b3d] inline-block" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] italic text-white">
              &ldquo;I was going to show you the stars, but you kinda outshine them.&rdquo; — Meskat
            </p>
            <p className="text-[12px] text-white tracking-wide flex items-center gap-2">
              made by{" "}
              <span
                onClick={creditsTap}
                className="cursor-default select-none transition-colors duration-300 hover:text-[#ffb37a]"
              >
                Meskat
              </span>{" "}
              · © 2026
              <a
                href="https://github.com/axiomdeploy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/15 bg-white/[0.04] text-white/60 hover:text-white hover:border-[#ffb37a66] hover:bg-white/[0.08] transition-colors"
              >
                <GitHubIcon size={14} />
              </a>
            </p>
          </div>
        </footer>

        <AnimatePresence>
          {credits && (
            <motion.div
              key="mission-credits"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[64] max-w-[92vw] rounded-2xl border border-[#ffb37a44] bg-[#0a0603f2] backdrop-blur-md px-5 py-3 text-center font-[family-name:var(--font-display)]"
              style={{ textShadow: "0 0 14px rgba(255,201,102,0.4)" }}
            >
              <p className="text-[10px] tracking-[0.34em] uppercase text-[#ffb37a]">mission credits</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white">
                hand-coded by Meskat Alam — no templates, no game engines,
                <br className="hidden sm:block" /> every frame on this flight is code.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* contact form — summoned only by a CTA, never by scrolling */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="contact-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[96] flex items-center justify-center"
            style={{ background: "rgba(3,2,4,0.72)", backdropFilter: "blur(16px)", padding: "clamp(14px, 5vw, 32px)" }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Contact Meskat"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[540px] rounded-[32px] glass overflow-hidden"
              style={{
                padding: "clamp(22px, 4.5vw, 34px)",
                maxHeight: "88dvh",
                overflowY: "auto",
                boxShadow: "0 40px 130px -30px rgba(255,139,61,0.4)",
              }}
            >
              <div
                aria-hidden
                className="absolute -top-24 -right-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,139,61,0.2), transparent 70%)" }}
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close contact form"
                className="absolute top-5 right-5 w-10 h-10 rounded-full grid place-items-center border border-white/15 text-[#c9bcae] hover:text-[#f5efe6] hover:border-[#ff8b3d66] transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>

              <div className="flex items-center gap-2.5">
                <span className="w-11 h-11 rounded-full grid place-items-center bg-gradient-to-br from-[#ffb37a] to-[#ff5e2b] text-[#180c03]">
                  <Mail size={17} strokeWidth={2.4} aria-hidden />
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase font-[family-name:var(--font-display)] text-[#ffb37a]">
                  Open a channel
                </span>
              </div>

              {sent ? (
                <div className="mt-8 pb-2">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-[clamp(24px,5vw,32px)] leading-tight text-[#f5efe6]">
                    Transmission ready.
                  </h3>
                  <p className="mt-4 text-[14px] leading-relaxed text-[#c9bcae]">
                    A Gmail draft just opened in a new tab. Hit send there — the destination is
                    already filled in.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setOpen(false)} className="btn-flame cursor-pointer">
                      <Check size={16} aria-hidden />
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setDraft(EMPTY_DRAFT);
                      }}
                      className="btn-ghost cursor-pointer"
                    >
                      Write another
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-6 font-[family-name:var(--font-display)] font-bold text-[clamp(24px,5vw,32px)] leading-tight text-[#f5efe6]">
                    Tell me what you&apos;re
                    <br />
                    <span className="flame-text">building.</span>
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#c9bcae]">
                    Fill this in and Gmail opens with the draft. No address is printed here —
                    your message goes straight to the right inbox.
                  </p>

                  <div className="mt-5 grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className={LABEL}>Your name</span>
                      <input
                        ref={nameRef}
                        value={draft.name}
                        onChange={set("name")}
                        placeholder="Who are you?"
                        maxLength={60}
                        className={FIELD}
                        aria-label="Your name"
                      />
                    </label>
                    <label className="block">
                      <span className={LABEL}>Your email (optional)</span>
                      <input
                        value={draft.email}
                        onChange={set("email")}
                        placeholder="So I can write back"
                        maxLength={80}
                        type="email"
                        className={FIELD}
                        aria-label="Your email"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={LABEL}>Subject</span>
                      <input
                        value={draft.topic}
                        onChange={set("topic")}
                        placeholder="Mission briefing…"
                        maxLength={90}
                        className={FIELD}
                        aria-label="Subject"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={LABEL}>Message</span>
                      <textarea
                        value={draft.message}
                        onChange={set("message")}
                        placeholder="Tell me everything. The more detail, the better the trajectory."
                        maxLength={1500}
                        rows={5}
                        className={`${FIELD} leading-relaxed resize-y`}
                        aria-label="Your message"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={sendMail}
                      disabled={!canSend}
                      className="btn-flame disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Open a Gmail draft with this message"
                    >
                      <Send size={16} aria-hidden />
                      Open in Gmail
                    </button>
                    <button
                      type="button"
                      onClick={copyDraft}
                      disabled={!canSend}
                      className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Copy the draft"
                    >
                      {copied ? <Check size={16} className="text-[#ffb37a]" aria-hidden /> : <Copy size={16} aria-hidden />}
                      {copied ? "Copied" : "Copy draft"}
                    </button>
                    <span className="ml-auto text-[10px] tracking-[0.2em] uppercase font-[family-name:var(--font-display)] text-white/55">
                      {saved ? "saved locally" : "local-first"}
                    </span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#ffab6918]">
                    <p className="text-[10px] tracking-[0.26em] uppercase font-[family-name:var(--font-display)] text-white/50">
                      Prefer another channel?
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a
                        href={X_TEAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[12px] text-[#c9bcae] hover:text-white transition-colors"
                      >
                        <XIcon size={13} /> X team channel
                      </a>
                      <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[12px] text-[#c9bcae] hover:text-white transition-colors"
                      >
                        <DiscordIcon size={15} /> Discord
                      </a>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
