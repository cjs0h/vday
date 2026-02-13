import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function rand(min, max) { return Math.random() * (max - min) + min; }

const COLORS = ["#ff6b8a", "#ffb3c6", "#e8b86d", "#ffd6e0", "#ff8fa3", "#ffcdb2"];
const REQUIRED = 6;

function makeParticles() {
  const count = 22;
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = rand(50, 150);
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      color: COLORS[Math.floor(rand(0, COLORS.length))],
      size: rand(10, 20),
      isHeart: Math.random() > 0.35,
      duration: rand(0.7, 1.3),
    };
  });
}

export default function SceneConstellation({ onNext, setStarPreset, setSceneObjects }) {
  const [fireworks, setFireworks] = useState([]);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    setStarPreset({ speed: 0.15, opacity: 0.55, tint: "#e8b86d" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  const handleTap = (e) => {
    if (done) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++idRef.current;
    const particles = makeParticles();
    setFireworks((prev) => [...prev.slice(-4), { id, x, y, particles }]);
    const next = count + 1;
    setCount(next);
    if (next >= REQUIRED) setTimeout(() => setDone(true), 900);
    // Auto-remove after animation completes
    setTimeout(() => setFireworks((prev) => prev.filter((f) => f.id !== id)), 2200);
  };

  return (
    <section
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center"
      onClick={handleTap}
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-2 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Light up our sky
      </motion.h2>

      {!done && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="pointer-events-none relative z-20 text-[clamp(16px,3.5vw,24px)] text-[#ffb3c6]"
        >
          tap anywhere
        </motion.p>
      )}

      {/* Firework explosions */}
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="pointer-events-none absolute z-10"
          style={{ left: fw.x, top: fw.y }}
        >
          {fw.particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
              transition={{ duration: p.duration, ease: "easeOut" }}
              className="absolute"
              style={{
                color: p.color,
                fontSize: p.size,
                filter: `drop-shadow(0 0 6px ${p.color})`,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
              }}
            >
              {p.isHeart ? "❤" : "✦"}
            </motion.div>
          ))}
          {/* Central flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: [0, 2, 3], opacity: [0.7, 0.3, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ width: 40, height: 40, filter: "blur(12px)" }}
          />
        </div>
      ))}

      {/* Progress dots */}
      {!done && count > 0 && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {Array.from({ length: REQUIRED }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i < count ? 1 : 0.5,
                opacity: i < count ? 1 : 0.2,
              }}
              className="h-2.5 w-2.5 rounded-full bg-[#ff6b8a]"
              style={i < count ? { boxShadow: "0 0 8px #ff6b8a" } : {}}
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
          className="pointer-events-auto relative z-20 mt-6 flex flex-col items-center gap-5"
        >
          <p className="font-display text-[clamp(28px,6.5vw,54px)] text-[#ffd6e0]">
            You light up my world
          </p>
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            KEEP GLOWING &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
