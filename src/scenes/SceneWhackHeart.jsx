import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const GOAL = 12;
const GRID = 9; // 3x3
const TAUNTS = ["too slow!", "nope!", "faster!", "wake up!", "cmon!", "zzz..."];
const DECOY_TAUNTS = ["not that one!", "ouch!", "wrong heart!", "tricked ya!"];

export default function SceneWhackHeart({ onNext, setStarPreset, setSceneObjects }) {
  const [score, setScore] = useState(0);
  const [actives, setActives] = useState([]); // [{ id, cell, isDecoy }, ...]
  const [toast, setToast] = useState("");
  const [done, setDone] = useState(false);
  const [flashes, setFlashes] = useState([]);

  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const nextId = useRef(0);
  const loopTimer = useRef(null);
  const hideTimers = useRef({});
  const toastTimer = useRef(null);
  const activesRef = useRef([]);
  const doneRef = useRef(false);
  const nudgeRef = useRef(null);

  useEffect(() => {
    setStarPreset({ speed: 0.2, opacity: 0.45, tint: "#ffd6e0" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 800);
  };

  /* ---- difficulty curve (gets faster + dual hearts near the end) ---- */
  const getDiff = () => {
    const p = scoreRef.current / GOAL; // 0 -> 1
    const r = roundRef.current;
    return {
      showMs:  Math.max(500, 1400 - r * 35 - p * 400),
      gapMin:  Math.max(150, 350 - p * 200),
      gapMax:  Math.max(300, 650 - p * 350),
      decoy:   0.2 + Math.min(0.25, r * 0.012),
      dual:    p >= 0.45 ? Math.min(0.65, (p - 0.45) * 1.8) : 0,
    };
  };

  /* sync actives to both state and ref */
  const updateActives = (fn) => {
    setActives((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      activesRef.current = next;
      return next;
    });
  };

  /* ---- main game loop (never breaks) ---- */
  useEffect(() => {
    if (done) return;

    const addHearts = (count, d) => {
      const taken = new Set(activesRef.current.map((a) => a.cell));
      const batch = [];

      for (let i = 0; i < count; i++) {
        let cell, t = 0;
        do { cell = Math.floor(Math.random() * GRID); t++; } while (taken.has(cell) && t < 20);
        if (taken.has(cell)) continue;
        taken.add(cell);

        const id = ++nextId.current;
        const isDecoy = Math.random() < d.decoy;
        batch.push({ id, cell, isDecoy });

        // auto-hide after showMs
        hideTimers.current[id] = setTimeout(() => {
          updateActives((prev) => prev.filter((a) => a.id !== id));
          delete hideTimers.current[id];
          if (!isDecoy) showToast(pick(TAUNTS));
          scheduleTick(); // keep the loop alive
        }, d.showMs);
      }

      if (batch.length) updateActives((prev) => [...prev, ...batch]);
    };

    const tick = () => {
      if (doneRef.current) return;
      const d = getDiff();
      const onScreen = activesRef.current.length;
      const wantTwo = Math.random() < d.dual;
      const canAdd = Math.min(wantTwo ? 2 : 1, 2 - onScreen);

      if (canAdd > 0) {
        roundRef.current++;
        addHearts(canAdd, getDiff());
      }
      scheduleTick();
    };

    const scheduleTick = (ms) => {
      if (doneRef.current) return;
      if (loopTimer.current) clearTimeout(loopTimer.current);
      const d = getDiff();
      loopTimer.current = setTimeout(tick, ms ?? rand(d.gapMin, d.gapMax));
    };

    nudgeRef.current = scheduleTick;
    scheduleTick(800);

    return () => {
      if (loopTimer.current) clearTimeout(loopTimer.current);
      Object.values(hideTimers.current).forEach((t) => clearTimeout(t));
      hideTimers.current = {};
    };
  }, [done]);

  /* ---- tap handler ---- */
  const tapCell = (cell) => {
    if (doneRef.current) return;
    const hit = activesRef.current.find((a) => a.cell === cell);
    if (!hit) return;

    // remove tapped heart
    updateActives((prev) => prev.filter((a) => a.id !== hit.id));
    if (hideTimers.current[hit.id]) {
      clearTimeout(hideTimers.current[hit.id]);
      delete hideTimers.current[hit.id];
    }

    const fid = Date.now() + Math.random();

    if (hit.isDecoy) {
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      showToast(pick(DECOY_TAUNTS));
      setFlashes((prev) => [...prev, { id: fid, cell, bad: true }]);
      setTimeout(() => setFlashes((prev) => prev.filter((f) => f.id !== fid)), 500);
    } else {
      scoreRef.current++;
      setScore(scoreRef.current);
      setFlashes((prev) => [...prev, { id: fid, cell, bad: false }]);
      setTimeout(() => setFlashes((prev) => prev.filter((f) => f.id !== fid)), 500);
      if (scoreRef.current >= GOAL) {
        doneRef.current = true;
        setDone(true);
        if (loopTimer.current) clearTimeout(loopTimer.current);
        Object.values(hideTimers.current).forEach((t) => clearTimeout(t));
        hideTimers.current = {};
        updateActives([]);
        return;
      }
    }

    // nudge the loop to spawn sooner
    if (nudgeRef.current) nudgeRef.current();
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
            const activeHere = actives.find((a) => a.cell === i);
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
                  {activeHere && (
                    <motion.span
                      key={activeHere.id}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 20 }}
                      transition={{ type: "spring", damping: 12, stiffness: 300 }}
                      className="text-[clamp(36px,9vw,56px)] leading-none"
                      style={{
                        filter: activeHere.isDecoy
                          ? "drop-shadow(0 0 8px rgba(100,100,100,0.5))"
                          : "drop-shadow(0 0 12px rgba(255,107,138,0.6))",
                      }}
                    >
                      {activeHere.isDecoy ? "\uD83D\uDC94" : "\u2764"}
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
