import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const DODGE_TAUNTS = ["not that easy!", "too slow!", "gotta be quicker!", "haha nice try!"];
const DODGES_NEEDED = 2; // lock dodges this many taps before letting you lock

export default function ScenePromise({ onNext, setStarPreset, setSceneObjects }) {
  const [locked, setLocked] = useState(false);
  const [keyGone, setKeyGone] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [lockPos, setLockPos] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState("");
  const tapCountRef = useRef(0);
  const toastRef = useRef(null);
  const dodgingRef = useRef(false);

  useEffect(() => {
    setStarPreset({ speed: 0.08, opacity: 0.25, tint: "#e8b86d" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const showToast = (text) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 1000);
  };

  const lockIt = () => {
    if (locked || dodgingRef.current) return;
    tapCountRef.current++;

    if (tapCountRef.current <= DODGES_NEEDED) {
      // Lock dodges!
      dodgingRef.current = true;
      const newX = rand(-80, 80);
      const newY = rand(-60, 60);
      setLockPos({ x: newX, y: newY });
      showToast(pick(DODGE_TAUNTS));
      setTimeout(() => { dodgingRef.current = false; }, 400);
      return;
    }

    // Third tap — actually lock
    setLocked(true);

    // Burst of sparkles
    setSparkles(
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        x: rand(-120, 120),
        y: rand(-120, 120),
        size: rand(10, 22),
        delay: rand(0, 0.3),
      })),
    );

    setTimeout(() => setKeyGone(true), 900);
    setTimeout(() => setShowMessage(true), 2200);
  };

  return (
    <section className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display mb-8 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Lock our love
      </motion.h2>

      {/* Lock + sparkles container */}
      <div className="relative mb-6 flex items-center justify-center">
        <motion.button
          type="button"
          onClick={lockIt}
          whileTap={!locked ? { scale: 0.92 } : {}}
          animate={{ x: lockPos.x, y: lockPos.y }}
          transition={{ type: "spring", damping: 12, stiffness: 300 }}
          className="relative select-none text-[clamp(100px,24vw,200px)] leading-none"
          style={{
            filter: locked
              ? "drop-shadow(0 0 40px rgba(232,184,109,0.6))"
              : "drop-shadow(0 0 12px rgba(255,179,198,0.3))",
            transition: "filter 0.8s ease",
          }}
        >
          <motion.span
            animate={
              locked
                ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }
                : { y: [0, -8, 0] }
            }
            transition={
              locked
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            }
            className="inline-block"
          >
            {locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}
          </motion.span>
        </motion.button>

        {/* Sparkle burst */}
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            initial={{ x: lockPos.x, y: lockPos.y, scale: 1, opacity: 1 }}
            animate={{ x: lockPos.x + s.x, y: lockPos.y + s.y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.9, delay: s.delay, ease: "easeOut" }}
            className="pointer-events-none absolute text-[#e8b86d]"
            style={{ fontSize: s.size }}
          >
            ✦
          </motion.div>
        ))}

        {/* Glow ring */}
        {locked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5, x: lockPos.x, y: lockPos.y }}
            animate={{ scale: [0, 3.5, 5], opacity: [0.5, 0.15, 0] }}
            transition={{ duration: 1.8 }}
            className="pointer-events-none absolute h-24 w-24 rounded-full bg-[#e8b86d]"
            style={{ filter: "blur(30px)" }}
          />
        )}
      </div>

      {/* Instruction */}
      {!locked && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="text-[clamp(16px,3.5vw,24px)] text-[#ffb3c6]"
        >
          tap to lock it forever
        </motion.p>
      )}

      {/* Toast for dodge taunts */}
      {toast && !locked && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-[clamp(18px,4vw,28px)] font-bold italic text-[#e8b86d]"
        >
          {toast}
        </motion.p>
      )}

      {/* Key flying away */}
      {locked && !keyGone && (
        <motion.div
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, y: -280, x: 180, rotate: 220, scale: 0.3 }}
          transition={{ duration: 1.3, ease: "easeIn" }}
          className="pointer-events-none absolute text-[clamp(36px,9vw,70px)]"
        >
          🔑
        </motion.div>
      )}

      {/* Final message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <p className="font-display text-[clamp(26px,6vw,50px)] text-[#ffd6e0]">
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
