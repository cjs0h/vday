import gsap from "gsap";
import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CONFIG } from "../config";

const heartPoints = [
  { x: 40, y: 35 }, { x: 48, y: 30 }, { x: 56, y: 32 }, { x: 62, y: 40 },
  { x: 62, y: 48 }, { x: 56, y: 56 }, { x: 50, y: 62 }, { x: 44, y: 56 },
  { x: 38, y: 48 }, { x: 38, y: 40 },
];

export default function SceneUniverse({ onNext, triggerBurst, setStarPreset, triggerWarp, setSceneObjects, sceneObjectsRef }) {
  const rootRef = useRef(null);
  const pointsRef = useRef([]);
  const [showPlanet, setShowPlanet] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showConstellation, setShowConstellation] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStarPreset({ speed: 0.5, opacity: 0.62, tint: "#ffd7ef" });
    triggerWarp(15, 2, 1, 1.3);
  }, [setStarPreset, triggerWarp]);

  useLayoutEffect(() => {
    const tl = gsap.timeline();
    tl.to({}, {
      duration: 2.1,
      onComplete: () => {
        setShowPlanet(true);
        setSceneObjects({
          planet: { visible: true, color: CONFIG.colors.peach, scale: 1.3, pulseSpeed: 1.1, emissiveIntensity: 1.4, x: 0, y: 1, z: -6 },
          bloomIntensity: 1.0,
        });
      },
    });
    tl.to({}, { duration: 0.5, onComplete: () => setShowText(true) });
    tl.to({}, { duration: 0.7, onComplete: () => setShowConstellation(true) });
    return () => {
      tl.kill();
      setSceneObjects({ planet: { visible: false }, bloomIntensity: 0 });
    };
  }, [setSceneObjects]);

  useLayoutEffect(() => {
    if (!showConstellation) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setReady(true) });
      pointsRef.current.forEach((el, i) => {
        if (!el) return;
        const target = heartPoints[i];
        tl.to(el, { left: `${target.x}%`, top: `${target.y}%`, opacity: 1, duration: 2, ease: "power2.out" }, i * 0.12);
      });
    }, rootRef);
    return () => ctx.revert();
  }, [showConstellation]);

  const handlePlanetTap = () => {
    if (!showPlanet) return;
    triggerBurst(50, 50, 1.2);
    gsap.to(sceneObjectsRef.current.planet, { scale: 0, duration: 0.7, ease: "power2.inOut" });
    gsap.timeline().to(rootRef.current, { autoAlpha: 0, duration: 0.7 }).call(onNext);
  };

  return (
    <section ref={rootRef} className="scene-shell relative flex flex-col items-center justify-center text-center">
      <div className="relative mb-8 h-[300px] w-[300px] sm:h-[360px] sm:w-[360px]">
        {showPlanet && (
          <motion.button
            type="button"
            onClick={handlePlanetTap}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.03 }}
            className="absolute left-1/2 top-1/2 z-10 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
        )}

        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full">
          {heartPoints.map((pt, i) => {
            if (!showConstellation || i === 0) return null;
            const prev = heartPoints[i - 1];
            return (
              <motion.line
                key={`line-${i}`}
                x1={`${prev.x}%`} y1={`${prev.y}%`}
                x2={`${pt.x}%`} y2={`${pt.y}%`}
                stroke="#ffb3c6" strokeWidth="1.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.82 }}
                transition={{ duration: 0.7, delay: 0.8 + i * 0.1, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        {heartPoints.map((pt, i) => (
          <div
            key={`dot-${pt.x}-${pt.y}`}
            ref={(el) => { pointsRef.current[i] = el; }}
            className="absolute z-30 h-2.5 w-2.5 rounded-full bg-[#ffd6e0] shadow-[0_0_15px_rgba(255,179,198,0.95)]"
            style={{ left: "50%", top: "50%", opacity: 0 }}
          />
        ))}
      </div>

      {showText && (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.45 } } }}
          className="relative z-20 flex flex-col items-center gap-3"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 1 } } }}
            className="font-display text-[clamp(26px,7vw,62px)] text-[#fff8f0]"
          >
            In a universe of infinite possibilities...
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 1 } } }}
            className="font-display text-[clamp(30px,8vw,72px)] text-[#ffb3c6]"
          >
            I found you.
          </motion.p>
        </motion.div>
      )}

      {ready && (
        <p className="mt-6 text-[clamp(15px,3.8vw,22px)] text-[#fff8f0]/75">Tap the planet to keep going</p>
      )}
    </section>
  );
}
