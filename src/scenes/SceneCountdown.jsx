import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const GOAL = 5;
const MIN_SIZE = 40;
const INITIAL_GOOD_MIN = 75;
const INITIAL_GOOD_MAX = 135;
const POP_SIZE = 160;
const GROW_RATE = 120; // px per second
const COLORS = ["#ff6b8a", "#ffb3c6", "#ff8fa3", "#e8457c", "#ffd6e0"];
const ZONE_SHRINK = 10; // green zone shrinks by this many px each success

export default function SceneCountdown({ onNext, setStarPreset, setSceneObjects }) {
  const [size, setSize] = useState(MIN_SIZE);
  const [holding, setHolding] = useState(false);
  const [released, setReleased] = useState([]); // { id, size, x, color }
  const [popped, setPopped] = useState([]);      // { id, x }
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef(MIN_SIZE);
  const idRef = useRef(0);
  const successRef = useRef(0);
  const toastRef = useRef(null);

  // Green zone shrinks with each success
  const goodMin = INITIAL_GOOD_MIN + successRef.current * (ZONE_SHRINK / 2);
  const goodMax = INITIAL_GOOD_MAX - successRef.current * (ZONE_SHRINK / 2);

  useEffect(() => {
    setStarPreset({ speed: 0.25, opacity: 0.4, tint: "#ffb3c6" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const showToast = (text) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 900);
  };

  // Inflate loop — wobble increases with each success
  useEffect(() => {
    if (!holding) return;
    lastTimeRef.current = performance.now();
    const grow = (now) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      sizeRef.current = Math.min(sizeRef.current + GROW_RATE * dt, POP_SIZE + 1);
      setSize(sizeRef.current);
      if (sizeRef.current > POP_SIZE) {
        // Popped!
        setHolding(false);
        const id = ++idRef.current;
        setPopped((prev) => [...prev, { id, x: 50 }]);
        sizeRef.current = MIN_SIZE;
        setSize(MIN_SIZE);
        showToast("💥 popped!");
        setTimeout(() => setPopped((prev) => prev.filter((p) => p.id !== id)), 600);
        return;
      }
      rafRef.current = requestAnimationFrame(grow);
    };
    rafRef.current = requestAnimationFrame(grow);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [holding]);

  const startHold = useCallback(() => {
    if (done) return;
    sizeRef.current = MIN_SIZE;
    setSize(MIN_SIZE);
    setHolding(true);
  }, [done]);

  const releaseBalloon = useCallback(() => {
    if (!holding) return;
    setHolding(false);
    const s = sizeRef.current;
    const gMin = INITIAL_GOOD_MIN + successRef.current * (ZONE_SHRINK / 2);
    const gMax = INITIAL_GOOD_MAX - successRef.current * (ZONE_SHRINK / 2);
    if (s >= gMin && s <= gMax) {
      // Success!
      const id = ++idRef.current;
      const x = 30 + Math.random() * 40;
      const color = COLORS[id % COLORS.length];
      successRef.current++;
      setReleased((prev) => {
        const next = [...prev, { id, size: s, x, color }];
        if (next.length >= GOAL) setTimeout(() => setDone(true), 1200);
        return next;
      });
      if (successRef.current < GOAL) {
        showToast(successRef.current >= 3 ? "getting tricky!" : "nice!");
      }
    } else if (s < gMin) {
      showToast("too small!");
    } else {
      showToast("too big!");
    }
    sizeRef.current = MIN_SIZE;
    setSize(MIN_SIZE);
  }, [holding, done]);

  const successCount = released.length;
  const isGoodZone = size >= goodMin && size <= goodMax;
  const isDanger = size > goodMax;

  // Wobble intensity increases with each success
  const wobbleIntensity = successRef.current * 1.5 + 2;

  return (
    <section
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center select-none"
      onPointerDown={startHold}
      onPointerUp={releaseBalloon}
      onPointerLeave={releaseBalloon}
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-4 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Inflate our love
      </motion.h2>

      {!done && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="pointer-events-none relative z-20 mb-6 text-[clamp(16px,3.5vw,24px)] text-[#ffb3c6]"
        >
          hold to inflate &middot; release when it glows
        </motion.p>
      )}

      {/* Size meter — green zone visibly shrinks */}
      {!done && (
        <div className="pointer-events-none relative z-20 mb-6 flex h-3 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[#ffb3c6]/30" style={{ width: `${(goodMin / POP_SIZE) * 100}%` }} />
          <div className="h-full bg-[#4ade80]/40" style={{ width: `${((goodMax - goodMin) / POP_SIZE) * 100}%` }} />
          <div className="h-full bg-[#ff4444]/30" style={{ width: `${((POP_SIZE - goodMax) / POP_SIZE) * 100}%` }} />
          <motion.div
            className="absolute top-0 h-3 w-1 rounded-full bg-white"
            style={{ left: `${Math.min(100, (size / POP_SIZE) * 100)}%` }}
          />
        </div>
      )}

      {/* Active balloon — wobbles more each success */}
      {!done && (
        <motion.div
          className="pointer-events-none relative z-10 flex items-center justify-center leading-none"
          animate={{ scale: holding ? 1.02 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <motion.span
            style={{
              fontSize: size,
              color: isDanger ? "#ff4444" : isGoodZone ? "#4ade80" : "#ff6b8a",
              filter: isGoodZone
                ? "drop-shadow(0 0 30px rgba(74,222,128,0.6))"
                : isDanger
                  ? "drop-shadow(0 0 20px rgba(255,68,68,0.6))"
                  : "drop-shadow(0 0 10px rgba(255,107,138,0.4))",
              transition: "color 0.2s, filter 0.2s",
            }}
            animate={
              holding
                ? { rotate: [-wobbleIntensity, wobbleIntensity, -wobbleIntensity] }
                : { rotate: 0 }
            }
            transition={
              holding
                ? { duration: Math.max(0.12, 0.3 - successRef.current * 0.03), repeat: Infinity }
                : { duration: 0.2 }
            }
          >
            ❤
          </motion.span>
        </motion.div>
      )}

      {/* Pop animation */}
      <AnimatePresence>
        {popped.map((p) => (
          <motion.div
            key={`pop-${p.id}`}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute z-10 text-6xl text-[#ff4444]"
            style={{ filter: "drop-shadow(0 0 20px #ff4444)" }}
          >
            💥
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Released balloons floating up */}
      <AnimatePresence>
        {released.map((b) => (
          <motion.div
            key={`balloon-${b.id}`}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: "-110vh", opacity: [1, 1, 0.6] }}
            transition={{ duration: 4, ease: "easeIn" }}
            className="pointer-events-none absolute z-10 leading-none"
            style={{
              left: `${b.x}%`,
              bottom: "30%",
              fontSize: b.size * 0.8,
              color: b.color,
              filter: `drop-shadow(0 0 14px ${b.color}88)`,
            }}
          >
            ❤
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && !done && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none absolute bottom-36 z-20 text-[clamp(16px,3.5vw,24px)] font-bold italic text-[#ffb3c6]"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Progress */}
      {!done && successCount > 0 && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {Array.from({ length: GOAL }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: i < successCount ? 1 : 0.5, opacity: i < successCount ? 1 : 0.2 }}
              className="h-2.5 w-2.5 rounded-full bg-[#4ade80]"
              style={i < successCount ? { boxShadow: "0 0 8px #4ade80" } : {}}
            />
          ))}
        </div>
      )}

      {/* Completion */}
      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="pointer-events-auto relative z-20 flex flex-col items-center gap-5"
        >
          <p className="font-display text-[clamp(28px,6.5vw,54px)] text-[#ffd6e0]">
            Our love is sky high
          </p>
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            HIGHER &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
