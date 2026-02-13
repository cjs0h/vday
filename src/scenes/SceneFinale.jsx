import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import PetalRain from "../components/PetalRain";
import { CONFIG } from "../config";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export default function SceneFinale({ onRestart, triggerBurst, triggerWarp, setStarPreset, setSceneObjects, onSaveMoment }) {
  const [activated, setActivated] = useState(false);
  const [showFinalCopy, setShowFinalCopy] = useState(false);
  const titleRef = useRef(null);
  const timersRef = useRef([]);

  const wordPositions = useMemo(
    () =>
      CONFIG.finaleWords.map((word, i) => ({
        id: `${word}-${i}`,
        word,
        left: rand(10, 88),
        top: rand(14, 82),
        duration: rand(2.2, 4.1),
        delay: rand(0, 1.5),
      })),
    [],
  );

  useEffect(() => {
    setStarPreset({ speed: 0.6, opacity: 0.86, tint: "#ffd3f2" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
    return () => { timersRef.current.forEach((t) => window.clearTimeout(t)); };
  }, [setStarPreset, setSceneObjects]);

  const activateFinale = () => {
    if (activated) return;
    setActivated(true);
    triggerWarp(20, 1.2, 0.5, 1.8);

    const t0 = window.setTimeout(() => triggerBurst(50, 50, 1.7), 0);
    const t1 = window.setTimeout(() => triggerBurst(44, 40, 1.5), 400);
    const t2 = window.setTimeout(() => triggerBurst(56, 45, 1.6), 800);
    const t3 = window.setTimeout(() => {
      setShowFinalCopy(true);
      // Start shimmer on title
      if (titleRef.current) {
        gsap.to(titleRef.current, { backgroundPosition: "200% center", duration: 6, ease: "none", repeat: -1 });
      }
    }, 1200);
    timersRef.current.push(t0, t1, t2, t3);
  };

  return (
    <section
      className={`scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center transition-colors duration-[2000ms] ${
        activated ? "bg-gradient-to-b from-[#1a0818] to-[#1a1015]" : ""
      }`}
    >
      {activated && <PetalRain variant="finale-rain" className="z-10" />}

      <div className="relative z-20">
        <motion.button
          type="button"
          onClick={activateFinale}
          whileTap={{ scale: 0.92 }}
          animate={activated ? { scale: [1, 1.5, 0.95, 1.2] } : { y: [0, -15, 0] }}
          transition={
            activated
              ? { duration: 1.2, ease: "easeInOut" }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
          }
          className="font-display text-[clamp(120px,25vw,210px)] leading-none text-[#ff6b8a] [filter:drop-shadow(0_0_40px_rgba(255,107,138,0.5))]"
        >
          ❤
        </motion.button>

        <p className="font-display mt-2 text-[clamp(30px,7vw,62px)] text-[#fff8f0]">You are my everything.</p>
        <p className="mt-1 text-[clamp(18px,4vw,27px)] text-[#ffb3c6]/88">tap the heart</p>
      </div>

      {/* Floating love words */}
      <AnimatePresence>
        {activated && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {wordPositions.map((item) => (
              <motion.div
                key={item.id}
                className="absolute text-[clamp(16px,3.6vw,26px)] italic text-[#ffd6e0]/90"
                style={{ left: `${item.left}%`, top: `${item.top}%` }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -10, 0],
                  rotate: [-2, 2, -2],
                }}
                transition={{
                  delay: item.delay,
                  duration: item.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {item.word}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Final text + buttons */}
      {showFinalCopy && (
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-20 mt-10 flex max-w-4xl flex-col items-center gap-3"
        >
          <h2
            ref={titleRef}
            className="font-handwriting bg-[linear-gradient(100deg,#fff8f0,#ffb3c6,#e8b86d,#fff8f0)] bg-[length:200%_100%] bg-clip-text text-[clamp(36px,8vw,80px)] leading-[1.2] text-transparent"
          >
            Happy Valentine&apos;s Day,{" "}
            <span className="block">
              My &ldquo;<span className="font-arabic text-[1.1em]">{"\u0641\u0633\u062A\u0642\u0629"}</span>&rdquo;
            </span>
          </h2>
          <p className="max-w-3xl text-[clamp(21px,4.8vw,34px)] italic text-[#fff8f0]/86">
            I love you more than words on a screen could ever say.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              onClick={onRestart}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glass-button rounded-full px-7 py-3 text-[clamp(13px,3vw,16px)]"
            >
              ↺ FROM THE START
            </motion.button>
            <motion.button
              type="button"
              onClick={onSaveMoment}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glass-button rounded-full px-7 py-3 text-[clamp(13px,3vw,16px)]"
            >
              ♥ SAVE THIS MOMENT
            </motion.button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
