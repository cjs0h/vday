import gsap from "gsap";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export default function SceneLetter({ onNext, setStarPreset, setSceneObjects }) {
  const [merged, setMerged] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const heart1Ref = useRef(null);
  const heart2Ref = useRef(null);
  const angleRef = useRef(0);
  const speedRef = useRef(1);
  const rafRef = useRef(null);
  const tapCountRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setStarPreset({ speed: 0.14, opacity: 0.35, tint: "#ff8fa3" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  // Orbit animation loop
  useEffect(() => {
    if (merged) return;
    const radius = 80;
    const animate = () => {
      angleRef.current += 0.03 * speedRef.current;
      const a = angleRef.current;
      if (heart1Ref.current) {
        heart1Ref.current.style.transform = `translate(${Math.cos(a) * radius}px, ${Math.sin(a) * radius}px)`;
      }
      if (heart2Ref.current) {
        heart2Ref.current.style.transform = `translate(${Math.cos(a + Math.PI) * radius}px, ${Math.sin(a + Math.PI) * radius}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [merged]);

  const handleTap = useCallback(() => {
    if (merged) return;
    tapCountRef.current++;
    speedRef.current = Math.min(speedRef.current + 0.6, 9);
    forceUpdate((n) => n + 1);

    if (tapCountRef.current >= 12) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setMerged(true);
      if (heart1Ref.current && heart2Ref.current) {
        gsap.to([heart1Ref.current, heart2Ref.current], {
          x: 0, y: 0, duration: 0.5, ease: "power2.in",
        });
      }
      setTimeout(() => setShowMessage(true), 1000);
    }
  }, [merged]);

  return (
    <section
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center"
      onClick={handleTap}
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-10 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Two hearts, one orbit
      </motion.h2>

      {/* Orbit container */}
      <div className="relative flex h-[200px] w-[200px] items-center justify-center">
        {/* Ambient glow */}
        <motion.div
          animate={
            merged
              ? { scale: [1, 3], opacity: [0.5, 0] }
              : { scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }
          }
          transition={
            merged
              ? { duration: 1 }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
          className="pointer-events-none absolute h-[200px] w-[200px] rounded-full bg-[#ff6b8a]"
          style={{ filter: "blur(40px)" }}
        />

        {/* Heart 1 */}
        {!merged && (
          <div
            ref={heart1Ref}
            className="pointer-events-none absolute text-[clamp(36px,9vw,56px)] leading-none"
            style={{
              color: "#ff6b8a",
              filter: "drop-shadow(0 0 14px rgba(255,107,138,0.7))",
            }}
          >
            ❤
          </div>
        )}

        {/* Heart 2 */}
        {!merged && (
          <div
            ref={heart2Ref}
            className="pointer-events-none absolute text-[clamp(36px,9vw,56px)] leading-none"
            style={{
              color: "#ffb3c6",
              filter: "drop-shadow(0 0 14px rgba(255,179,198,0.7))",
            }}
          >
            ❤
          </div>
        )}

        {/* Merged heart */}
        {merged && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 1.5], opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute text-[clamp(60px,16vw,110px)] leading-none"
            style={{
              color: "#ff6b8a",
              filter: "drop-shadow(0 0 35px rgba(255,107,138,0.8))",
            }}
          >
            ❤
          </motion.div>
        )}
      </div>

      {/* Instruction */}
      {!merged && (
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="pointer-events-none relative z-20 mt-6 text-[clamp(16px,3.5vw,24px)] text-[#ffb3c6]"
        >
          tap to bring them closer
        </motion.p>
      )}

      {/* Speed indicator */}
      {!merged && tapCountRef.current > 0 && (
        <div className="pointer-events-none relative z-20 mt-3 flex gap-1">
          {Array.from({ length: Math.min(tapCountRef.current, 12) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-1.5 w-4 rounded-full bg-[#ff6b8a]"
              style={{ opacity: 0.3 + i * 0.06 }}
            />
          ))}
        </div>
      )}

      {/* Final message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="pointer-events-auto relative z-20 mt-8 flex flex-col items-center gap-5"
        >
          <p className="font-display text-[clamp(26px,6vw,50px)] text-[#ffd6e0]">
            Better together
          </p>
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass-button rounded-full px-8 py-3 text-[clamp(13px,3vw,16px)]"
          >
            ALWAYS &rarr;
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
