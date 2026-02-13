import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const GOAL = 12;
const GRID = 9; // 3x3
const TAUNTS = ["too slow!", "nope!", "faster!", "wake up!", "cmon!", "zzz..."];
const DECOY_TAUNTS = ["not that one!", "ouch!", "wrong heart!", "tricked ya!"];

export default function SceneMemories({ onNext, setStarPreset, setSceneObjects }) {
  const [score, setScore] = useState(0);
  const [active, setActive] = useState(null); // { cell, isDecoy }
  const [toast, setToast] = useState("");
  const [done, setDone] = useState(false);
  const [flashes, setFlashes] = useState([]);
  const scoreRef = useRef(0);
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const roundRef = useRef(0);

  useEffect(() => {
    setStarPreset({ speed: 0.2, opacity: 0.45, tint: "#ffd6e0" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const showToast = (text) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 800);
  };

  // Spawn hearts in random cells
  useEffect(() => {
    if (done) return;
    const spawn = () => {
      roundRef.current++;
      const cell = Math.floor(Math.random() * GRID);
      // Decoy chance increases over time (20% base, up to 40%)
      const decoyChance = 0.2 + Math.min(0.2, roundRef.current * 0.015);
      const isDecoy = Math.random() < decoyChance;
      setActive({ cell, isDecoy });
      // Disappear time gets shorter as you progress (1.4s down to 0.7s)
      const showTime = Math.max(700, 1400 - roundRef.current * 40);
      timerRef.current = setTimeout(() => {
        setActive(null);
        if (!isDecoy) showToast(pick(TAUNTS));
        // Next one after a gap
        timerRef.current = setTimeout(spawn, rand(300, 600));
      }, showTime);
    };
    timerRef.current = setTimeout(spawn, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [done]);

  const tapCell = (cell) => {
    if (done || !active || active.cell !== cell) return;
    const wasDecoy = active.isDecoy;
    setActive(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (wasDecoy) {
      // Hit a decoy — lose a point
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      showToast(pick(DECOY_TAUNTS));
      const id = Date.now();
      setFlashes((prev) => [...prev, { id, cell, bad: true }]);
      setTimeout(() => setFlashes((prev) => prev.filter((f) => f.id !== id)), 500);
    } else {
      // Good hit
      scoreRef.current++;
      setScore(scoreRef.current);
      const id = Date.now();
      setFlashes((prev) => [...prev, { id, cell, bad: false }]);
      setTimeout(() => setFlashes((prev) => prev.filter((f) => f.id !== id)), 500);
      if (scoreRef.current >= GOAL) {
        setDone(true);
        return;
      }
    }
    // Next heart after a short gap
    timerRef.current = setTimeout(() => {
      if (scoreRef.current < GOAL) {
        roundRef.current++;
        const nextCell = Math.floor(Math.random() * GRID);
        const decoyChance = 0.2 + Math.min(0.2, roundRef.current * 0.015);
        const isNextDecoy = Math.random() < decoyChance;
        setActive({ cell: nextCell, isDecoy: isNextDecoy });
        const showTime = Math.max(700, 1400 - roundRef.current * 40);
        timerRef.current = setTimeout(() => {
          setActive(null);
          if (!isNextDecoy) showToast(pick(TAUNTS));
          timerRef.current = setTimeout(() => tapCell(-1), rand(300, 600)); // trigger next spawn
        }, showTime);
      }
    }, rand(350, 600));
  };

  return (
    <section className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-2 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Whack my heart
      </motion.h2>

      {!done && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="pointer-events-none relative z-20 mb-3 text-[clamp(14px,3vw,20px)] text-[#ffb3c6]"
        >
          tap ❤ &middot; avoid 💔
        </motion.p>
      )}

      {/* Progress */}
      {!done && (
        <div className="pointer-events-none relative z-20 mb-5 h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#ffd6e0]"
            animate={{ width: `${Math.min(100, (score / GOAL) * 100)}%` }}
            transition={{ type: "spring", damping: 15 }}
          />
        </div>
      )}

      {/* 3x3 Grid */}
      {!done && (
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {Array.from({ length: GRID }).map((_, i) => {
            const isActive = active?.cell === i;
            const isDecoy = active?.isDecoy;
            const flash = flashes.find((f) => f.cell === i);
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => tapCell(i)}
                whileTap={{ scale: 0.9 }}
                className="relative flex h-[clamp(80px,22vw,110px)] w-[clamp(80px,22vw,110px)] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 20 }}
                      transition={{ type: "spring", damping: 12, stiffness: 300 }}
                      className="text-[clamp(36px,9vw,56px)] leading-none"
                      style={{
                        filter: isDecoy
                          ? "drop-shadow(0 0 8px rgba(100,100,100,0.5))"
                          : "drop-shadow(0 0 12px rgba(255,107,138,0.6))",
                      }}
                    >
                      {isDecoy ? "💔" : "❤"}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Flash feedback */}
                {flash && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.7 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      background: flash.bad
                        ? "radial-gradient(circle, rgba(255,68,68,0.4) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(255,107,138,0.4) 0%, transparent 70%)",
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Toast messages */}
      <AnimatePresence>
        {toast && !done && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none relative z-20 mt-4 text-[clamp(18px,4vw,28px)] font-bold italic text-[#ffb3c6]"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Completion */}
      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="relative z-20 flex flex-col items-center gap-5"
        >
          <p className="font-display text-[clamp(28px,6.5vw,54px)] text-[#ffd6e0]">
            You got fast hands
          </p>
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            SHOW ME MORE &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
