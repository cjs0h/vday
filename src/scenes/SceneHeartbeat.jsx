import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const ECG_PATH = "M40 140 L160 140 L180 100 L202 172 L232 76 L250 140 L330 140 L355 112 L378 140 L500 140 L526 90 L548 188 L578 120 L604 140 L820 140";
const HEART_PATH = "M330 160 C330 120 372 102 398 128 C424 102 468 120 468 160 C468 200 424 223 398 252 C372 223 330 200 330 160 Z";
const FLAT_PATH = "M40 140 L820 140";
const WORDS = ["This", "is", "what", "you", "do", "to", "me."];
const BEAT = 0.833;

export default function SceneHeartbeat({ onNext, setStarPreset, setSceneObjects }) {
  const rootRef = useRef(null);
  const ecgRef = useRef(null);
  const heartRef = useRef(null);
  const flatRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [showFinalWords, setShowFinalWords] = useState(false);
  const [flatlining, setFlatlining] = useState(false);
  const [beatSpeed, setBeatSpeed] = useState(BEAT);

  useEffect(() => {
    setStarPreset({ speed: 0, opacity: 0.02, tint: "#120012" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  useLayoutEffect(() => {
    const ecgLength = ecgRef.current.getTotalLength();
    const heartLength = heartRef.current.getTotalLength();
    const flatLength = flatRef.current.getTotalLength();

    gsap.set(ecgRef.current, { strokeDasharray: ecgLength, strokeDashoffset: ecgLength });
    gsap.set(heartRef.current, { strokeDasharray: heartLength, strokeDashoffset: heartLength });
    gsap.set(flatRef.current, { strokeDasharray: flatLength, strokeDashoffset: flatLength, opacity: 0 });

    const tl = gsap.timeline();

    // Draw ECG (2 full cycles)
    tl.to(ecgRef.current, { strokeDashoffset: 0, duration: 4.2, ease: "none" });

    // Words appear synced to heartbeat
    WORDS.forEach((_, i) => {
      tl.to({}, { duration: i === 0 ? 0 : BEAT * 0.5, onComplete: () => setWordCount(i + 1) });
    });

    // ECG speeds up — rapid phase
    tl.call(() => setBeatSpeed(0.4));
    tl.set(ecgRef.current, { strokeDashoffset: ecgLength });
    tl.to(ecgRef.current, { strokeDashoffset: 0, duration: 1.4, ease: "none" });
    tl.set(ecgRef.current, { strokeDashoffset: ecgLength });
    tl.to(ecgRef.current, { strokeDashoffset: 0, duration: 1.0, ease: "none" });

    // Settle — draw heart shape
    tl.call(() => setBeatSpeed(BEAT));
    tl.to(ecgRef.current, { opacity: 0.38, duration: 0.5 });
    tl.to(heartRef.current, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out" }, "-=0.2");

    // Show final line
    tl.to({}, { duration: 0.4, onComplete: () => setShowFinalWords(true) });

    return () => tl.kill();
  }, []);

  const handleContinue = () => {
    if (flatlining) return;
    setFlatlining(true);
    const tl = gsap.timeline();
    tl.to([ecgRef.current, heartRef.current], { opacity: 0.12, duration: 0.3 });
    tl.to(flatRef.current, { opacity: 1, strokeDashoffset: 0, duration: 0.7, ease: "none" });
    tl.to(rootRef.current, { autoAlpha: 0, duration: 0.8, delay: 0.45 });
    tl.call(onNext);
  };

  return (
    <motion.section
      ref={rootRef}
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden bg-black text-center"
      animate={{ scale: [1, 1.006, 1] }}
      transition={{ duration: beatSpeed, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Pulsing glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,138,0.34) 0%, rgba(255,107,138,0.08) 40%, rgba(255,107,138,0) 70%)",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: beatSpeed, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ECG SVG */}
      <div className="relative z-20 w-full max-w-[860px]">
        <svg viewBox="0 0 860 280" className="mx-auto w-full">
          <path
            ref={ecgRef}
            d={ECG_PATH}
            fill="none"
            stroke="#ff6b8a"
            strokeWidth="3.4"
            style={{ filter: "drop-shadow(0 0 10px #ff6b8a)" }}
          />
          <path
            ref={heartRef}
            d={HEART_PATH}
            fill="none"
            stroke="#ff8fa3"
            strokeWidth="3.2"
            style={{ filter: "drop-shadow(0 0 10px #ff8fa3)" }}
          />
          <path
            ref={flatRef}
            d={FLAT_PATH}
            fill="none"
            stroke="#ffd6e0"
            strokeWidth="2.4"
            style={{ filter: "drop-shadow(0 0 6px #ffd6e0)" }}
          />
        </svg>
      </div>

      {/* "This is what you do to me." word-by-word */}
      <div className="font-display relative z-20 mt-4 flex min-h-[80px] flex-wrap items-center justify-center gap-2 text-[clamp(28px,7vw,66px)] text-[#fff8f0]">
        {WORDS.slice(0, wordCount).map((word, i) => (
          <motion.span key={`${word}-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {word}
          </motion.span>
        ))}
      </div>

      {/* "Every. Single. Time." — beat-synced */}
      <AnimatePresence>
        {showFinalWords && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-20 mt-6"
          >
            <div className="flex items-center justify-center gap-3">
              {["Every.", "Single.", "Time."].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [1, 1.15, 1] }}
                  transition={{
                    delay: i * BEAT,
                    duration: BEAT,
                    scale: { delay: i * BEAT, duration: BEAT, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="text-[clamp(26px,7vw,52px)] italic text-[#fff8f0]"
                >
                  {word}
                </motion.span>
              ))}
            </div>
            <motion.button
              type="button"
              onClick={handleContinue}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 * BEAT }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="glass-button mt-6 rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
            >
              FEEL IT &rarr;
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
