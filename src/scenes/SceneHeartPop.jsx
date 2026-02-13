import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const GOAL = 14;
const COLORS = ["#ff6b8a", "#ffb3c6", "#ff8fa3", "#ffd6e0", "#e8457c"];
const DECOY_TAUNTS = ["nope!", "wrong one!", "ouch!", "💔 hurts!", "tricked ya!"];

export default function SceneHeartPop({ onNext, setStarPreset, setSceneObjects }) {
  const [hearts, setHearts] = useState([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const spawnRef = useRef(null);
  const toastRef = useRef(null);
  const idRef = useRef(0);
  const scoreRef = useRef(0);
  const poppedCountRef = useRef(0); // total popped for speed ramp

  useEffect(() => {
    setStarPreset({ speed: 0.3, opacity: 0.5, tint: "#ffb3c6" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const showToast = (text) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 700);
  };

  // Spawn hearts continuously — gets faster over time, decoys appear
  useEffect(() => {
    const spawn = () => {
      if (done) return;
      const id = ++idRef.current;
      const total = poppedCountRef.current;
      // Decoy chance: starts at 15%, ramps to 35%
      const isDecoy = Math.random() < 0.15 + Math.min(0.2, total * 0.012);
      // Speed ramp: hearts get faster as you progress
      const baseDuration = 5;
      const speedMult = Math.max(0.45, 1 - total * 0.028);
      setHearts((prev) => [
        ...prev.slice(-30),
        {
          id,
          x: rand(6, 94),
          size: rand(28, 58),
          color: isDecoy ? "#aaa" : COLORS[Math.floor(rand(0, COLORS.length))],
          duration: rand(baseDuration * speedMult, (baseDuration + 2) * speedMult),
          isDecoy,
        },
      ]);
      // Spawn interval also gets shorter
      const spawnDelay = Math.max(150, rand(250, 500) * speedMult);
      spawnRef.current = window.setTimeout(spawn, spawnDelay);
    };
    spawn();
    return () => { if (spawnRef.current) window.clearTimeout(spawnRef.current); };
  }, [done]);

  const popHeart = (id, isDecoy) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
    poppedCountRef.current++;

    if (isDecoy) {
      // Hit a decoy — lose a point
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      showToast(pick(DECOY_TAUNTS));
    } else {
      scoreRef.current++;
      setScore(scoreRef.current);
      if (scoreRef.current >= GOAL) setDone(true);
    }
  };

  return (
    <section className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-4 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Catch my love
      </motion.h2>

      {!done && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="pointer-events-none relative z-20 mb-4 text-[clamp(14px,3vw,20px)] text-[#ffb3c6]"
        >
          tap ❤ &middot; avoid 💔
        </motion.p>
      )}

      {/* Progress bar */}
      {!done && (
        <div className="pointer-events-none relative z-20 mb-2 h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#ffb3c6]"
            animate={{ width: `${Math.min(100, (score / GOAL) * 100)}%` }}
            transition={{ type: "spring", damping: 15 }}
          />
        </div>
      )}

      {/* Floating hearts */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.button
            key={heart.id}
            type="button"
            onClick={() => popHeart(heart.id, heart.isDecoy)}
            initial={{ bottom: "-10%", opacity: 0.85, scale: 1, rotate: rand(-20, 20) }}
            animate={{ bottom: "110%", rotate: rand(-30, 30) }}
            exit={{ scale: [1.8, 0], opacity: 0 }}
            transition={{
              bottom: { duration: heart.duration, ease: "linear" },
              exit: { duration: 0.3 },
            }}
            className="absolute z-10 cursor-pointer select-none leading-none"
            style={{
              left: `${heart.x}%`,
              fontSize: heart.size,
              color: heart.color,
              filter: heart.isDecoy
                ? "drop-shadow(0 0 8px rgba(100,100,100,0.4))"
                : `drop-shadow(0 0 10px ${heart.color}88)`,
            }}
          >
            {heart.isDecoy ? "💔" : "❤"}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Toast */}
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
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="relative z-20 flex flex-col items-center gap-5"
          >
            <p className="font-display text-[clamp(28px,6.5vw,54px)] text-[#ffd6e0]">
              You make my heart burst
            </p>
            <motion.button
              type="button"
              onClick={onNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
            >
              MORE LOVE &rarr;
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
