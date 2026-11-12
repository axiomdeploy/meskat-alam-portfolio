"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COUNT = ["T-03", "T-02", "T-01"];
/** total sequence: 3×620ms countdown + 150ms gap + 750ms liftoff hold,
    but the preloader ALSO pre-warms the real data the site needs:
    the rocket canvas (Three.js + postprocessing + every texture),
    the MindSystem bundle, and the fonts — all toned to be ready
    before the curtain lifts. The countdown is the visible part;
    the warmth is a prefetch behind it. */
const T_LIFTOFF = 620 * 3 + 150;
const T_DONE = T_LIFTOFF + 750;

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0); // 0..2 countdown, 3 liftoff, 4 gone
  const [progress, setProgress] = useState(0);
  // Timeline anchor persists in a ref — React StrictMode runs every effect
  // twice on mount (run → cleanup → run), but component refs survive that
  // cycle, so the countdown continues seamlessly instead of replaying.
  // This is what made the loader visibly play twice before.
  const anchorRef = useRef(0);

  useEffect(() => {
    if (!anchorRef.current) anchorRef.current = performance.now();
    const anchor = anchorRef.current;

    const iv = setInterval(() => {
      const el = performance.now() - anchor;
      setProgress(Math.min(100, (el / T_LIFTOFF) * 100));
      if (el < T_LIFTOFF) {
        setStep(Math.min(2, Math.floor(el / 620)));
      } else if (el < T_DONE) {
        setStep(3);
      } else {
        setStep(4);
      }
    }, 60);

    // ── pre-warm the heavy data behind the countdown ─────────────
    // Do it in parallel, guarded, so a failure never blocks the curtain.
    const warm = async () => {
      try {
        // fonts (fonts often block first paint)
        await document.fonts.ready;
      } catch {}
      try {
        // the chunks the page actually needs on mount
        await Promise.all([
          import("three"),
          import("three/addons/postprocessing/EffectComposer.js"),
          import("three/addons/postprocessing/RenderPass.js"),
          import("three/addons/postprocessing/UnrealBloomPass.js"),
          import("three/addons/postprocessing/OutputPass.js"),
          import("@/lib/journey"),
          import("@/components/MindSystem"),
          import("@/components/MissionControl"),
        ]);
      } catch {}
      try {
        // the photo the About section needs — warm the cache
        const img = new Image();
        img.decoding = "async";
        img.src = "/meskat.png";
      } catch {}
      try {
        // tell the browser NOT to show a spinner mid-flight later —
        // connection warmup for the AI path (same origin, so this is cheap)
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = window.location.origin;
        document.head.appendChild(link);
      } catch {}
    };
    // fire and forget — never block the countdown
    void warm();

    return () => clearInterval(iv);
  }, []);

  // fire onDone exactly once when the sequence completes
  const firedRef = useRef(false);
  useEffect(() => {
    if (step === 4 && !firedRef.current) {
      firedRef.current = true;
      onDone();
    }
  }, [step, onDone]);

  return (
    <AnimatePresence>
      {step < 4 && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "radial-gradient(ellipse at 50% 60%, #100804 0%, #030202 70%)" }}
          exit={{ y: "-100%", transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              key={step === 3 ? "liftoff" : step}
              initial={{ opacity: 0, scale: 0.82, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="font-[family-name:var(--font-display)] font-bold tracking-[0.12em] flame-text text-[clamp(64px,14vw,120px)] leading-none select-none"
            >
              {step === 3 ? "LIFTOFF" : COUNT[step]}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 text-[11px] tracking-[0.5em] uppercase text-white font-[family-name:var(--font-display)]"
            >
              {step === 3 ? "mission has started" : "initializing launch sequence"}
            </motion.p>
          </div>

          <div className="mt-12 w-56 h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-150 ease-out"
              style={{
                width: `${step === 3 ? 100 : progress}%`,
                background: "linear-gradient(90deg, #ffb37a, #ff5e2b)",
                boxShadow: "0 0 14px rgba(255,120,50,0.8)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
