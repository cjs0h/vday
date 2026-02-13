import gsap from "gsap";
import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef } from "react";
import { CONFIG } from "../config";

function rand(min, max) { return Math.random() * (max - min) + min; }

export default function SceneVoid({ onNext, triggerBurst, setStarPreset, setSceneObjects, sceneObjectsRef }) {
  const rootRef = useRef(null);
  const dateRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const orbBtnRef = useRef(null);
  const exitingRef = useRef(false);

  // Floating sparkles around orb area
  const sparkles = useMemo(
    () => Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      size: rand(3, 7),
      orbitRadius: rand(100, 170),
      speed: rand(8, 16),
      delay: rand(0, 5),
      startAngle: rand(0, 360),
    })),
    [],
  );

  useLayoutEffect(() => {
    setStarPreset({ speed: 0.04, opacity: 0.12, tint: "#b78ccd" });
    setSceneObjects({
      orb: { visible: true, color: CONFIG.colors.rose, scale: 0.01, pulseSpeed: 1.35, emissiveIntensity: 1.5, x: 0, y: 0.8, z: -5 },
      planet: { visible: false },
      bloomIntensity: 0,
    });

    const ctx = gsap.context(() => {
      gsap.set([dateRef.current, titleRef.current, subtitleRef.current, orbBtnRef.current], { autoAlpha: 0, y: 20 });
      gsap.set(titleRef.current, { backgroundPosition: "0% center" });

      const tl = gsap.timeline();

      // Stars brighten
      tl.to({}, { duration: 0.5, onComplete: () => setStarPreset({ speed: 0.08, opacity: 0.35, tint: "#b78ccd" }) });

      // Bloom ramps up, orb fades in
      tl.to(sceneObjectsRef.current.orb, { scale: 0.6, duration: 1.5, ease: "power3.out" }, 0.8);
      tl.to(sceneObjectsRef.current, { bloomIntensity: 1.2, duration: 1.5, ease: "power2.out" }, 0.8);

      // Orb grows to full
      tl.to(sceneObjectsRef.current.orb, { scale: 1, duration: 1.2, ease: "power2.inOut" }, 2);

      // Date
      tl.to(dateRef.current, { autoAlpha: 0.62, y: 0, duration: 0.8, ease: "power2.out" }, 2.5);

      // Title with shimmer + orb grows more
      tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" }, 3.3);
      tl.to(sceneObjectsRef.current.orb, { scale: 1.2, duration: 1, ease: "power2.inOut" }, 3.3);

      // Subtitle
      tl.to(subtitleRef.current, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" }, 4.5);

      // Orb button visible
      tl.to(orbBtnRef.current, { autoAlpha: 1, y: 0, duration: 1, ease: "power2.out" }, 5.5);

      // Shimmer loop on title
      gsap.to(titleRef.current, { backgroundPosition: "200% center", duration: 4, ease: "none", repeat: -1, delay: 3.3 });
    }, rootRef);

    return () => {
      ctx.revert();
      setSceneObjects({ orb: { visible: false }, bloomIntensity: 0 });
    };
  }, [setStarPreset, setSceneObjects, sceneObjectsRef]);

  const handleBegin = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    triggerBurst(50, 45, 1.6);
    gsap.to(sceneObjectsRef.current.orb, { scale: 0, duration: 0.6, ease: "power2.in" });
    gsap.to(sceneObjectsRef.current, { bloomIntensity: 0, duration: 0.6 });
    gsap.timeline()
      .to(rootRef.current, { autoAlpha: 0, scale: 0.97, duration: 0.7, ease: "power2.inOut" })
      .call(onNext);
  };

  return (
    <section ref={rootRef} className="scene-shell relative flex flex-col items-center justify-center text-center">
      {/* Pulsing glow rings expanding from orb */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff8fa3]"
          style={{ width: 180, height: 180 }}
          animate={{ scale: [1, 2.5 + i * 0.5], opacity: [0.25, 0] }}
          transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Floating sparkles orbiting the orb */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-[#ffd6e0]"
            style={{
              width: s.size,
              height: s.size,
              boxShadow: `0 0 ${s.size * 2}px rgba(255,214,224,0.8)`,
            }}
            animate={{
              x: [
                Math.cos((s.startAngle * Math.PI) / 180) * s.orbitRadius,
                Math.cos(((s.startAngle + 180) * Math.PI) / 180) * s.orbitRadius,
                Math.cos((s.startAngle * Math.PI) / 180) * s.orbitRadius,
              ],
              y: [
                Math.sin((s.startAngle * Math.PI) / 180) * s.orbitRadius,
                Math.sin(((s.startAngle + 180) * Math.PI) / 180) * s.orbitRadius,
                Math.sin((s.startAngle * Math.PI) / 180) * s.orbitRadius,
              ],
              opacity: [0.3, 0.9, 0.3],
            }}
            transition={{ duration: s.speed, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Orb tap area */}
      <button
        ref={orbBtnRef}
        type="button"
        onClick={handleBegin}
        className="relative z-10 mb-4 h-[220px] w-[220px] cursor-pointer rounded-full"
        aria-label="Begin"
      />

      <p
        ref={dateRef}
        className="font-display mb-3 text-[clamp(12px,2.8vw,18px)] uppercase tracking-[0.62em] text-[#ffb3c6]/70"
      >
        February 14th
      </p>

      <h1
        ref={titleRef}
        className="font-display mb-4 max-w-3xl bg-[linear-gradient(110deg,#ffd6e0,#ff8fa3,#e8b86d,#fff8f0,#ffd6e0)] bg-[length:200%_100%] bg-clip-text px-3 text-[clamp(34px,8vw,86px)] leading-[0.98] text-transparent"
      >
        I Made Something For You
      </h1>

      <p
        ref={subtitleRef}
        className="mb-6 max-w-xl text-[clamp(20px,4.8vw,34px)] italic text-[#fff8f0]/84"
      >
        It comes from the heart.
      </p>

      <motion.p
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[clamp(14px,3vw,20px)] text-[#ffb3c6]/70"
      >
        tap the orb to begin
      </motion.p>
    </section>
  );
}
