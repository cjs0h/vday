import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const TOTAL_SEEDS = 24;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default function SceneWish({ onNext, setStarPreset, setSceneObjects }) {
  const seeds = useMemo(
    () => Array.from({ length: TOTAL_SEEDS }).map((_, i) => ({ id: i, angle: (i / TOTAL_SEEDS) * Math.PI * 2 })),
    [],
  );

  const [attachedSeeds, setAttachedSeeds] = useState(seeds);
  const [detachedSeeds, setDetachedSeeds] = useState([]);
  const [wishShown, setWishShown] = useState(false);
  const intervalRef = useRef(null);
  const revealTimerRef = useRef(null);

  useEffect(() => {
    setStarPreset({ speed: 0.62, opacity: 0.7, tint: "#ffc8e3" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
  }, []);

  const releaseOne = () => {
    setAttachedSeeds((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const seed = next.pop();
      setDetachedSeeds((cur) => [
        ...cur,
        { ...seed, x: rand(-220, 220), y: rand(-320, -110), rotate: rand(0, 360), delay: rand(0, 0.22) },
      ]);
      return next;
    });
  };

  const startBlow = () => {
    if (intervalRef.current || !attachedSeeds.length) return;
    releaseOne();
    intervalRef.current = window.setInterval(releaseOne, 130);
  };

  const stopBlow = () => {
    if (!intervalRef.current) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    if (attachedSeeds.length !== 0 || wishShown) return;
    revealTimerRef.current = window.setTimeout(() => setWishShown(true), 1000);
  }, [attachedSeeds.length, wishShown]);

  return (
    <section className="scene-shell relative flex flex-col items-center justify-center text-center">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display mb-3 text-[clamp(32px,8vw,72px)] text-[#fff8f0]"
      >
        Make a wish for us
      </motion.h2>

      <motion.p
        animate={{ opacity: [0.4, 0.95, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="mb-8 text-[clamp(18px,4vw,28px)] text-[#ffb3c6]"
      >
        tap and hold to blow
      </motion.p>

      <motion.button
        type="button"
        onTapStart={startBlow}
        onTapCancel={stopBlow}
        onTap={stopBlow}
        onPointerUp={stopBlow}
        onPointerLeave={stopBlow}
        className="relative h-[320px] w-[280px] rounded-full border border-white/10 bg-white/[0.02]"
      >
        <svg viewBox="0 0 280 320" className="h-full w-full">
          <line x1="140" y1="158" x2="140" y2="298" stroke="#98b26e" strokeWidth="2.2" />
          {attachedSeeds.map((seed) => {
            const x1 = 140 + Math.cos(seed.angle) * 22;
            const y1 = 128 + Math.sin(seed.angle) * 22;
            const x2 = 140 + Math.cos(seed.angle) * 66;
            const y2 = 128 + Math.sin(seed.angle) * 66;
            return (
              <g key={`seed-${seed.id}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f4f4f0" strokeWidth="1.25" />
                <circle cx={x2} cy={y2} r="3.1" fill="#ffffff" />
              </g>
            );
          })}
        </svg>

        {detachedSeeds.map((seed) => (
          <motion.div
            key={`detached-${seed.id}`}
            className="pointer-events-none absolute left-1/2 top-[40%] text-xl text-[#ffb3c6]"
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: seed.x, y: seed.y, opacity: 0, rotate: seed.rotate }}
            transition={{ duration: 3, delay: seed.delay, ease: "easeOut" }}
          >
            ♥
          </motion.div>
        ))}
      </motion.button>

      {wishShown && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="mt-8">
          <p className="font-display text-[clamp(30px,7vw,56px)] text-[#ffd6e0]">I already know mine came true.</p>
          <p className="mt-2 text-[clamp(22px,5vw,38px)] italic text-[#fff8f0]">Because I have you.</p>
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button mt-6 rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            ONE LAST THING &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
