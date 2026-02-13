import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

const DODGE_TAUNTS = [
  "too slow!", "nope!", "haha!", "not yet!",
  "almost!", "try again!", "so close!", "nice try!",
  "keep trying!", "you wish!", "faster!", "catch me!",
];

const CHASE_MESSAGES = [
  { at: 5, text: "She's quick..." },
  { at: 15, text: "Don't give up!" },
  { at: 25, text: "Getting closer..." },
  { at: 35, text: "She's slowing down..." },
  { at: 45, text: "Almost tired..." },
  { at: 55, text: "Just a little more..." },
];

const CHASE_DURATION = 60;  // seconds holding key
const DODGE_DIST = 18;      // % — how close key must be for lock to dodge
const CATCH_DIST = 10;      // % — overlap to lock

export default function SceneLoveLock({ onNext, setStarPreset, setSceneObjects, triggerBurst }) {
  const [locked, setLocked] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [toast, setToast] = useState("");
  const [chaseMsg, setChaseMsg] = useState("");
  const [catchable, setCatchable] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* positions in % of container */
  const [lockPos, setLockPos] = useState({ x: 70, y: 35 });
  const [keyPos, setKeyPos] = useState({ x: 30, y: 65 });

  const containerRef = useRef(null);
  const holdStartRef = useRef(null);   // timestamp when finger went down
  const elapsedRef = useRef(0);        // accumulated hold seconds
  const rafRef = useRef(null);
  const tickRef = useRef(null);
  const toastRef = useRef(null);
  const chaseMsgRef = useRef(null);
  const shownMsgsRef = useRef(new Set());
  const lockedRef = useRef(false);
  const catchableRef = useRef(false);
  const draggingRef = useRef(false);
  const lockPosRef = useRef({ x: 70, y: 35 });
  const keyPosRef = useRef({ x: 30, y: 65 });

  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { catchableRef.current = catchable; }, [catchable]);

  /* ── convert pointer px → container % ── */
  const pxToPercent = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(5, Math.min(95, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(8, Math.min(92, ((clientY - r.top) / r.height) * 100)),
    };
  }, []);

  /* ── pick a position away from the key ── */
  const dodgeLock = useCallback((kx, ky) => {
    /* go to opposite quadrant */
    const nx = kx < 50 ? rand(60, 90) : rand(10, 40);
    const ny = ky < 50 ? rand(55, 85) : rand(12, 45);
    lockPosRef.current = { x: nx, y: ny };
    setLockPos({ x: nx, y: ny });
  }, []);

  /* ── show toast ── */
  const showToastMsg = useCallback((text) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 800);
  }, []);

  /* ── check chase milestones ── */
  const checkMilestones = useCallback(() => {
    for (const msg of CHASE_MESSAGES) {
      if (elapsedRef.current >= msg.at && !shownMsgsRef.current.has(msg.at)) {
        shownMsgsRef.current.add(msg.at);
        setChaseMsg(msg.text);
        if (chaseMsgRef.current) clearTimeout(chaseMsgRef.current);
        chaseMsgRef.current = setTimeout(() => setChaseMsg(""), 2200);
        break;
      }
    }
  }, []);

  /* ── setup starfield + lock movement ── */
  useEffect(() => {
    setStarPreset({ speed: 0.08, opacity: 0.25, tint: "#e8b86d" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });

    /* lock wanders on its own */
    const moveLock = () => {
      if (lockedRef.current) return;
      const lp = lockPosRef.current;
      /* small random drift */
      const nx = Math.max(8, Math.min(92, lp.x + rand(-15, 15)));
      const ny = Math.max(12, Math.min(88, lp.y + rand(-12, 12)));
      lockPosRef.current = { x: nx, y: ny };
      setLockPos({ x: nx, y: ny });

      const interval = catchableRef.current ? rand(2500, 4000) : rand(900, 1800);
      tickRef.current = setTimeout(moveLock, interval);
    };
    tickRef.current = setTimeout(moveLock, 1200);

    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
      if (toastRef.current) clearTimeout(toastRef.current);
      if (chaseMsgRef.current) clearTimeout(chaseMsgRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setStarPreset, setSceneObjects]);

  /* ── hold timer RAF loop — runs while finger is down ── */
  useEffect(() => {
    if (!dragging || locked) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }

    const loop = () => {
      if (!draggingRef.current || lockedRef.current) return;
      const now = performance.now();
      const dt = (now - (holdStartRef.current || now)) / 1000;
      holdStartRef.current = now;
      elapsedRef.current += dt;

      checkMilestones();

      if (elapsedRef.current >= CHASE_DURATION && !catchableRef.current) {
        setCatchable(true);
        catchableRef.current = true;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    holdStartRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [dragging, locked, checkMilestones]);

  /* ── pointer handlers for the key ── */
  const onKeyDown = useCallback((e) => {
    if (lockedRef.current) return;
    e.preventDefault();
    (e.target).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    holdStartRef.current = performance.now();
  }, []);

  const onKeyMove = useCallback((e) => {
    if (!draggingRef.current || lockedRef.current) return;
    e.preventDefault();

    const kp = pxToPercent(e.clientX, e.clientY);
    keyPosRef.current = kp;
    setKeyPos(kp);

    const lp = lockPosRef.current;
    const d = dist(kp.x, kp.y, lp.x, lp.y);

    if (catchableRef.current && d < CATCH_DIST) {
      /* caught! */
      lockedRef.current = true;
      setLocked(true);
      draggingRef.current = false;
      setDragging(false);
      if (tickRef.current) clearTimeout(tickRef.current);
      if (triggerBurst) triggerBurst(lp.x, lp.y, 1.8);

      setSparkles(
        Array.from({ length: 24 }).map((_, i) => ({
          id: i,
          x: rand(-120, 120),
          y: rand(-120, 120),
          size: rand(12, 24),
          delay: rand(0, 0.35),
        })),
      );
      setTimeout(() => setShowMessage(true), 1800);
      return;
    }

    if (!catchableRef.current && d < DODGE_DIST) {
      /* lock dodges away */
      dodgeLock(kp.x, kp.y);
      showToastMsg(pick(DODGE_TAUNTS));
    }
  }, [pxToPercent, dodgeLock, showToastMsg, triggerBurst]);

  const onKeyUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);

    /* reset timer on finger lift */
    elapsedRef.current = 0;
    shownMsgsRef.current.clear();
    if (catchableRef.current) {
      setCatchable(false);
      catchableRef.current = false;
    }
  }, []);

  const lockMoveDur = catchable ? 2 : 0.5;

  return (
    <section
      ref={containerRef}
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center"
      style={{ padding: 0, touchAction: "none" }}
    >
      {/* title */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display absolute top-[4%] z-30 text-[clamp(26px,6.5vw,52px)] text-[#fff8f0]"
      >
        Lock our love
      </motion.h2>

      {/* chase milestone message */}
      {chaseMsg && !locked && (
        <motion.p
          key={chaseMsg}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display absolute top-[12%] z-30 text-[clamp(15px,3.8vw,24px)] text-[#ffd6e0]"
          style={{ filter: "drop-shadow(0 0 14px rgba(255,214,224,0.4))" }}
        >
          {chaseMsg}
        </motion.p>
      )}

      {/* ── THE LOCK ── */}
      {!showMessage && (
        <motion.div
          animate={{
            left: `${lockPos.x}%`,
            top: `${lockPos.y}%`,
            scale: locked ? [1, 1.3, 1.05] : catchable ? [1, 1.06, 1] : 1,
            rotate: locked ? [0, -10, 10, 0] : 0,
          }}
          transition={{
            left: { duration: locked ? 0 : lockMoveDur, ease: catchable ? "easeInOut" : "easeOut" },
            top: { duration: locked ? 0 : lockMoveDur, ease: catchable ? "easeInOut" : "easeOut" },
            scale: locked ? { duration: 0.6 } : catchable ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 },
            rotate: { duration: 0.6 },
          }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 select-none leading-none"
          style={{
            fontSize: "clamp(70px, 16vw, 120px)",
            filter: locked
              ? "drop-shadow(0 0 50px rgba(232,184,109,0.7))"
              : catchable
                ? "drop-shadow(0 0 25px rgba(232,184,109,0.5))"
                : "drop-shadow(0 0 12px rgba(255,179,198,0.3))",
            transition: "filter 0.8s ease",
          }}
        >
          {locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}

          {/* sparkle burst */}
          {sparkles.map((s) => (
            <motion.div
              key={s.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: s.x, y: s.y, scale: 0, opacity: 0 }}
              transition={{ duration: 1.1, delay: s.delay, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 text-[#e8b86d]"
              style={{ fontSize: s.size }}
            >
              ✦
            </motion.div>
          ))}

          {locked && (
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [0, 4, 7], opacity: [0.6, 0.15, 0] }}
              transition={{ duration: 2 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-[#e8b86d]"
              style={{ filter: "blur(35px)" }}
            />
          )}
        </motion.div>
      )}

      {/* ── THE KEY — draggable ── */}
      {!locked && !showMessage && (
        <motion.div
          onPointerDown={onKeyDown}
          onPointerMove={onKeyMove}
          onPointerUp={onKeyUp}
          onPointerCancel={onKeyUp}
          animate={{
            left: `${keyPos.x}%`,
            top: `${keyPos.y}%`,
            scale: dragging ? 1.15 : 1,
          }}
          transition={{
            left: { duration: 0.08, ease: "linear" },
            top: { duration: 0.08, ease: "linear" },
            scale: { duration: 0.2 },
          }}
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-grab select-none leading-none active:cursor-grabbing"
          style={{
            fontSize: "clamp(50px, 12vw, 80px)",
            filter: dragging
              ? "drop-shadow(0 0 20px rgba(232,184,109,0.6))"
              : "drop-shadow(0 0 8px rgba(232,184,109,0.3))",
            touchAction: "none",
          }}
        >
          🔑
        </motion.div>
      )}

      {/* instruction */}
      {!locked && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute bottom-[10%] z-30 px-4 text-[clamp(13px,3.2vw,18px)] text-[#ffb3c6]"
        >
          {catchable
            ? "she's tired — drag the key to the lock!"
            : dragging
              ? "keep holding... don't let go!"
              : "hold the key and drag it to the lock"}
        </motion.p>
      )}

      {/* dodge taunt */}
      {toast && !locked && (
        <motion.p
          key={toast + Date.now()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-[16%] z-30 text-[clamp(17px,4.2vw,28px)] font-bold italic text-[#e8b86d]"
          style={{ filter: "drop-shadow(0 0 12px rgba(232,184,109,0.4))" }}
        >
          {toast}
        </motion.p>
      )}

      {/* final message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="relative z-30 flex flex-col items-center gap-5"
        >
          <div className="text-[clamp(70px,18vw,120px)]"
            style={{ filter: "drop-shadow(0 0 40px rgba(232,184,109,0.6))" }}>
            🔒
          </div>
          <p className="font-display text-[clamp(28px,6.5vw,50px)] text-[#ffd6e0]">
            Forever locked in
          </p>
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            AND EVER &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
