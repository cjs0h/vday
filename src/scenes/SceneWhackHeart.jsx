import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const GOAL = 12;
const GRID = 9;
const TAUNTS = ["too slow!", "nope!", "faster!", "wake up!", "cmon!", "zzz..."];
const DECOY_TAUNTS = ["not that one!", "ouch!", "wrong heart!", "tricked ya!"];

export default function SceneWhackHeart({ onNext, setStarPreset, setSceneObjects }) {
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const doneRef = useRef(false);
  const nextIdRef = useRef(0);
  const toastTimerRef = useRef(null);
  const cellsRef = useRef(new Map()); // id -> { cell, isDecoy, timerId }
  const flashesRef = useRef([]);
  const toastRef = useRef("");
  const loopRef = useRef(null);

  useEffect(() => {
    setStarPreset({ speed: 0.2, opacity: 0.45, tint: "#ffd6e0" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  /* ── difficulty curve ── */
  const getDiff = () => {
    const p = scoreRef.current / GOAL;
    const r = roundRef.current;
    return {
      showMs: Math.max(600, 1500 - r * 30 - p * 400),
      gapMs: Math.max(400, 800 - p * 400),
      decoy: 0.2 + Math.min(0.25, r * 0.012),
      dual: p >= 0.45 ? Math.min(0.6, (p - 0.45) * 1.6) : 0,
    };
  };

  /* ── spawn hearts ── */
  const spawnHearts = () => {
    if (doneRef.current) return;
    const d = getDiff();
    const onScreen = cellsRef.current.size;
    const wantTwo = Math.random() < d.dual;
    const count = Math.min(wantTwo ? 2 : 1, 2 - onScreen);
    if (count <= 0) return;

    const usedCells = new Set([...cellsRef.current.values()].map((h) => h.cell));

    for (let i = 0; i < count; i++) {
      let cell, tries = 0;
      do { cell = Math.floor(Math.random() * GRID); tries++; } while (usedCells.has(cell) && tries < 30);
      if (usedCells.has(cell)) continue;
      usedCells.add(cell);

      const id = ++nextIdRef.current;
      const isDecoy = Math.random() < d.decoy;

      /* auto-hide timer */
      const timerId = setTimeout(() => {
        if (!cellsRef.current.has(id)) return;
        cellsRef.current.delete(id);
        if (!isDecoy) {
          toastRef.current = pick(TAUNTS);
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => { toastRef.current = ""; rerender(); }, 800);
        }
        rerender();
      }, d.showMs);

      cellsRef.current.set(id, { cell, isDecoy, timerId });
    }
    roundRef.current++;
    rerender();
  };

  /* ── game loop ── */
  useEffect(() => {
    if (doneRef.current) return;

    const tick = () => {
      if (doneRef.current) return;
      spawnHearts();
      const d = getDiff();
      loopRef.current = setTimeout(tick, d.gapMs);
    };

    loopRef.current = setTimeout(tick, 800);

    return () => {
      if (loopRef.current) clearTimeout(loopRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      cellsRef.current.forEach((h) => clearTimeout(h.timerId));
      cellsRef.current.clear();
      if (loopRef.current) clearTimeout(loopRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  /* ── tap handler — using onPointerDown for instant response ── */
  const tapCell = (cell, e) => {
    e.preventDefault();
    if (doneRef.current) return;

    /* find the heart at this cell */
    let hitId = null;
    let hitEntry = null;
    for (const [id, entry] of cellsRef.current) {
      if (entry.cell === cell) { hitId = id; hitEntry = entry; break; }
    }
    if (!hitId || !hitEntry) return;

    /* remove it */
    clearTimeout(hitEntry.timerId);
    cellsRef.current.delete(hitId);

    /* flash */
    const fid = Date.now() + Math.random();
    flashesRef.current = [...flashesRef.current, { id: fid, cell, bad: hitEntry.isDecoy }];
    setTimeout(() => {
      flashesRef.current = flashesRef.current.filter((f) => f.id !== fid);
      rerender();
    }, 500);

    if (hitEntry.isDecoy) {
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      toastRef.current = pick(DECOY_TAUNTS);
    } else {
      scoreRef.current++;
      if (scoreRef.current >= GOAL) {
        doneRef.current = true;
        if (loopRef.current) clearTimeout(loopRef.current);
        cellsRef.current.forEach((h) => clearTimeout(h.timerId));
        cellsRef.current.clear();
        rerender();
        return;
      }
    }

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => { toastRef.current = ""; rerender(); }, 800);

    rerender();
  };

  /* ── build render data from refs ── */
  const score = scoreRef.current;
  const done = doneRef.current;
  const toast = toastRef.current;
  const flashes = flashesRef.current;

  /* build cell map for rendering */
  const cellMap = {};
  for (const [, entry] of cellsRef.current) {
    cellMap[entry.cell] = entry;
  }

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

      {!done && (
        <div className="pointer-events-none relative z-20 mb-5 h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff6b8a] to-[#ffd6e0] transition-[width] duration-300"
            style={{ width: `${Math.min(100, (score / GOAL) * 100)}%` }}
          />
        </div>
      )}

      {!done && (
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {Array.from({ length: GRID }).map((_, i) => {
            const heart = cellMap[i];
            const flash = flashes.find((f) => f.cell === i);
            return (
              <div
                key={i}
                onPointerDown={(e) => tapCell(i, e)}
                role="button"
                tabIndex={0}
                className="relative flex h-[clamp(80px,22vw,110px)] w-[clamp(80px,22vw,110px)] cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] select-none active:scale-90 transition-transform duration-100"
                style={{ touchAction: "manipulation" }}
              >
                {heart && (
                  <span
                    className="text-[clamp(36px,9vw,56px)] leading-none animate-[pop-in_0.2s_ease-out]"
                    style={{
                      filter: heart.isDecoy
                        ? "drop-shadow(0 0 8px rgba(100,100,100,0.5))"
                        : "drop-shadow(0 0 12px rgba(255,107,138,0.6))",
                    }}
                  >
                    {heart.isDecoy ? "\uD83D\uDC94" : "\u2764"}
                  </span>
                )}
                {flash && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl animate-[flash-ring_0.4s_ease-out]"
                    style={{
                      background: flash.bad
                        ? "radial-gradient(circle, rgba(255,68,68,0.4) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(255,107,138,0.4) 0%, transparent 70%)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && !done && (
        <p className="pointer-events-none relative z-20 mt-4 text-[clamp(18px,4vw,28px)] font-bold italic text-[#ffb3c6]">
          {toast}
        </p>
      )}

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
