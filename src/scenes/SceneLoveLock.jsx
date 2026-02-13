import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

const CHASE_DURATION = 60;  // seconds of active chasing
const IDLE_RESET = 5;       // seconds idle before timer resets
const LOCK_SIZE = 100;
const PADDING = 16;

export default function SceneLoveLock({ onNext, setStarPreset, setSceneObjects, triggerBurst }) {
  const [locked, setLocked] = useState(false);
  const [keyGone, setKeyGone] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [toast, setToast] = useState("");
  const [chaseMsg, setChaseMsg] = useState("");
  const [catchable, setCatchable] = useState(false);
  const [chaseStarted, setChaseStarted] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 45 });

  const elapsedRef = useRef(0);          // accumulated chase seconds
  const lastTapRef = useRef(0);          // timestamp of last tap
  const tickRef = useRef(null);          // movement timeout
  const toastRef = useRef(null);
  const chaseMsgRef = useRef(null);
  const shownMsgsRef = useRef(new Set());
  const lockedRef = useRef(false);
  const catchableRef = useRef(false);
  const chaseStartedRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { catchableRef.current = catchable; }, [catchable]);
  useEffect(() => { chaseStartedRef.current = chaseStarted; }, [chaseStarted]);

  const getBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { minX: 10, maxX: 90, minY: 12, maxY: 85 };
    const w = el.clientWidth;
    const h = el.clientHeight;
    const px = ((LOCK_SIZE / 2 + PADDING) / w) * 100;
    const py = ((LOCK_SIZE / 2 + PADDING) / h) * 100;
    return { minX: px, maxX: 100 - px, minY: py + 8, maxY: 100 - py - 6 };
  }, []);

  const pickNewPos = useCallback(() => {
    const b = getBounds();
    return { x: rand(b.minX, b.maxX), y: rand(b.minY, b.maxY) };
  }, [getBounds]);

  /* ── setup + movement loop ── */
  useEffect(() => {
    setStarPreset({ speed: 0.08, opacity: 0.25, tint: "#e8b86d" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });

    const tick = () => {
      if (lockedRef.current) return;

      /* idle detection — if chase started and no tap for 5s, reset */
      if (chaseStartedRef.current && lastTapRef.current > 0) {
        const idle = (Date.now() - lastTapRef.current) / 1000;
        if (idle >= IDLE_RESET && elapsedRef.current > 0) {
          elapsedRef.current = 0;
          shownMsgsRef.current.clear();
          setCatchable(false);
          catchableRef.current = false;
        }
      }

      /* accumulate time only if actively tapping (last tap within 5s) */
      if (chaseStartedRef.current && lastTapRef.current > 0) {
        const idle = (Date.now() - lastTapRef.current) / 1000;
        if (idle < IDLE_RESET) {
          /* count ~0.5s per tick (tick runs every ~500ms on average relative to movement) */
        }
      }

      /* check chase milestones */
      for (const msg of CHASE_MESSAGES) {
        if (elapsedRef.current >= msg.at && !shownMsgsRef.current.has(msg.at)) {
          shownMsgsRef.current.add(msg.at);
          setChaseMsg(msg.text);
          if (chaseMsgRef.current) clearTimeout(chaseMsgRef.current);
          chaseMsgRef.current = setTimeout(() => setChaseMsg(""), 2200);
          break;
        }
      }

      /* check if catchable */
      if (elapsedRef.current >= CHASE_DURATION && !catchableRef.current) {
        setCatchable(true);
        catchableRef.current = true;
      }

      /* move lock */
      setPos(pickNewPos());

      /* schedule next move */
      const interval = catchableRef.current
        ? rand(2200, 3500)
        : elapsedRef.current < 30
          ? rand(700, 1200)
          : rand(1200, 2000);
      tickRef.current = setTimeout(tick, interval);
    };

    tickRef.current = setTimeout(tick, 800);

    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
      if (toastRef.current) clearTimeout(toastRef.current);
      if (chaseMsgRef.current) clearTimeout(chaseMsgRef.current);
    };
  }, [setStarPreset, setSceneObjects, pickNewPos]);

  const showToastMsg = (text) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 900);
  };

  /* ── tap handler ── */
  const handleTap = () => {
    if (locked) return;

    /* start the chase on first tap */
    if (!chaseStarted) {
      setChaseStarted(true);
      chaseStartedRef.current = true;
    }

    const now = Date.now();

    /* idle reset check — if last tap was >5s ago, reset elapsed */
    if (lastTapRef.current > 0 && (now - lastTapRef.current) / 1000 >= IDLE_RESET) {
      elapsedRef.current = 0;
      shownMsgsRef.current.clear();
      setCatchable(false);
      catchableRef.current = false;
    }

    /* accumulate time since last tap (capped at reasonable amount) */
    if (lastTapRef.current > 0) {
      const delta = Math.min((now - lastTapRef.current) / 1000, 3);
      elapsedRef.current += delta;
    }
    lastTapRef.current = now;

    if (!catchableRef.current) {
      /* dodge to opposite side */
      const b = getBounds();
      const newX = pos.x < 50 ? rand(58, b.maxX) : rand(b.minX, 42);
      const newY = pos.y < 50 ? rand(58, b.maxY) : rand(b.minY, 42);
      setPos({ x: newX, y: newY });
      showToastMsg(pick(DODGE_TAUNTS));

      /* show milestone message if earned */
      for (const msg of CHASE_MESSAGES) {
        if (elapsedRef.current >= msg.at && !shownMsgsRef.current.has(msg.at)) {
          shownMsgsRef.current.add(msg.at);
          setChaseMsg(msg.text);
          if (chaseMsgRef.current) clearTimeout(chaseMsgRef.current);
          chaseMsgRef.current = setTimeout(() => setChaseMsg(""), 2200);
          break;
        }
      }

      /* check catchable */
      if (elapsedRef.current >= CHASE_DURATION) {
        setCatchable(true);
        catchableRef.current = true;
      }
      return;
    }

    /* finally caught! */
    setLocked(true);
    lockedRef.current = true;
    if (tickRef.current) clearTimeout(tickRef.current);
    if (triggerBurst) triggerBurst(pos.x, pos.y, 1.8);

    setSparkles(
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: rand(-130, 130),
        y: rand(-130, 130),
        size: rand(12, 24),
        delay: rand(0, 0.35),
      })),
    );

    setTimeout(() => setKeyGone(true), 1000);
    setTimeout(() => setShowMessage(true), 2400);
  };

  const moveDuration = catchable ? 1.8 : 0.45;

  return (
    <section
      ref={containerRef}
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center"
      style={{ padding: 0 }}
    >
      {/* title */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display absolute top-[5%] z-30 text-[clamp(28px,7vw,58px)] text-[#fff8f0]"
      >
        Lock our love
      </motion.h2>

      {/* chase milestone message */}
      {chaseMsg && !locked && (
        <motion.p
          key={chaseMsg}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display absolute top-[13%] z-30 text-[clamp(16px,4vw,26px)] text-[#ffd6e0]"
          style={{ filter: "drop-shadow(0 0 14px rgba(255,214,224,0.4))" }}
        >
          {chaseMsg}
        </motion.p>
      )}

      {/* ── THE LOCK ── */}
      {!showMessage && (
        <motion.button
          type="button"
          onClick={handleTap}
          whileTap={!locked ? { scale: 0.85 } : {}}
          animate={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            scale: locked ? [1, 1.3, 1.05] : catchable ? [1, 1.06, 1] : 1,
            rotate: locked ? [0, -10, 10, 0] : 0,
          }}
          transition={{
            left: { duration: locked ? 0 : moveDuration, ease: catchable ? "easeInOut" : "easeOut" },
            top: { duration: locked ? 0 : moveDuration, ease: catchable ? "easeInOut" : "easeOut" },
            scale: locked
              ? { duration: 0.6 }
              : catchable
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 },
            rotate: { duration: 0.6 },
          }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 select-none leading-none"
          style={{
            fontSize: "clamp(80px, 18vw, 130px)",
            filter: locked
              ? "drop-shadow(0 0 50px rgba(232,184,109,0.7))"
              : catchable
                ? "drop-shadow(0 0 25px rgba(232,184,109,0.5))"
                : "drop-shadow(0 0 12px rgba(255,179,198,0.3))",
            transition: "filter 0.8s ease",
          }}
        >
          {locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}

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
        </motion.button>
      )}

      {/* instruction */}
      {!locked && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="absolute bottom-[12%] z-30 text-[clamp(14px,3.5vw,20px)] text-[#ffb3c6]"
        >
          {catchable ? "she's tired — catch her now!" : "tap the lock!"}
        </motion.p>
      )}

      {/* dodge taunt */}
      {toast && !locked && (
        <motion.p
          key={toast + Date.now()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-[18%] z-30 text-[clamp(18px,4.5vw,30px)] font-bold italic text-[#e8b86d]"
          style={{ filter: "drop-shadow(0 0 12px rgba(232,184,109,0.4))" }}
        >
          {toast}
        </motion.p>
      )}

      {/* key flying away */}
      {locked && !keyGone && (
        <motion.div
          initial={{ opacity: 1, left: `${pos.x}%`, top: `${pos.y}%`, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, top: "-10%", left: `${pos.x + 20}%`, rotate: 280, scale: 0.2 }}
          transition={{ duration: 1.6, ease: "easeIn" }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 text-[clamp(40px,10vw,70px)]"
        >
          🔑
        </motion.div>
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
