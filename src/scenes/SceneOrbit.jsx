import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_DURATION = 30; // seconds

const HOLD_MESSAGES = [
  { at: 0.00, text: "hold and don\u2019t let go\u2026" },
  { at: 0.06, text: "feel that?" },
  { at: 0.12, text: "our hearts are syncing\u2026" },
  { at: 0.20, text: "closer\u2026" },
  { at: 0.28, text: "I can feel yours beating" },
  { at: 0.36, text: "don\u2019t let go" },
  { at: 0.44, text: "gravity is pulling us in" },
  { at: 0.52, text: "almost touching\u2026" },
  { at: 0.60, text: "hold me tighter" },
  { at: 0.70, text: "the universe is watching" },
  { at: 0.80, text: "I\u2019m not letting go either" },
  { at: 0.90, text: "here it comes\u2026" },
];

const RELEASE_MESSAGES = [
  "you let go\u2026",
  "come back\u2026",
  "don\u2019t be afraid",
  "try again, hold longer",
  "I\u2019m still here",
  "one more time\u2026",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function SceneOrbit({ onNext, setStarPreset, setSceneObjects }) {
  const [phase, setPhase] = useState("orbit"); // orbit | supernova | message
  const [holding, setHolding] = useState(false);
  const [intensity, setIntensity] = useState(0); // 0-1
  const [holdMsg, setHoldMsg] = useState("");
  const [releaseMsg, setReleaseMsg] = useState("");

  const heart1Ref = useRef(null);
  const heart2Ref = useRef(null);
  const sectionRef = useRef(null);
  const angleRef = useRef(0);
  const rafRef = useRef(null);
  const holdStartRef = useRef(null);
  const lastMsgIdx = useRef(-1);
  const doneRef = useRef(false);

  const [rings, setRings] = useState([]);
  const [debris, setDebris] = useState([]);

  useEffect(() => {
    setStarPreset({ speed: 0.14, opacity: 0.35, tint: "#ff8fa3" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
  }, [setStarPreset, setSceneObjects]);

  /* ---- orbit + hold progress loop ---- */
  useEffect(() => {
    if (phase !== "orbit") return;

    const animate = () => {
      // progress from hold
      let p = 0;
      if (holdStartRef.current) {
        const elapsed = (Date.now() - holdStartRef.current) / 1000;
        p = Math.min(1, elapsed / HOLD_DURATION);
        setIntensity(p);

        // pick hold message based on progress
        let idx = -1;
        for (let i = HOLD_MESSAGES.length - 1; i >= 0; i--) {
          if (p >= HOLD_MESSAGES[i].at) { idx = i; break; }
        }
        if (idx !== lastMsgIdx.current && idx >= 0) {
          lastMsgIdx.current = idx;
          setHoldMsg(HOLD_MESSAGES[idx].text);
        }

        // done!
        if (p >= 1 && !doneRef.current) {
          doneRef.current = true;
          triggerSupernova();
          return;
        }
      }

      // speed & radius driven by progress
      const speed = 1 + p * 11;
      const radius = 80 - p * 68; // 80 -> 12

      angleRef.current += 0.03 * speed;
      const a = angleRef.current;
      if (heart1Ref.current)
        heart1Ref.current.style.transform = `translate(${Math.cos(a) * radius}px, ${Math.sin(a) * radius}px)`;
      if (heart2Ref.current)
        heart2Ref.current.style.transform = `translate(${Math.cos(a + Math.PI) * radius}px, ${Math.sin(a + Math.PI) * radius}px)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  /* ---- supernova ---- */
  const triggerSupernova = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const state = { radius: 12, speed: 12 };
    gsap.to(state, {
      radius: 0,
      speed: 24,
      duration: 0.9,
      ease: "power3.in",
      onUpdate() {
        angleRef.current += 0.03 * state.speed;
        const a = angleRef.current;
        const r = state.radius;
        if (heart1Ref.current)
          heart1Ref.current.style.transform = `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`;
        if (heart2Ref.current)
          heart2Ref.current.style.transform = `translate(${Math.cos(a + Math.PI) * r}px, ${Math.sin(a + Math.PI) * r}px)`;
      },
      onComplete() {
        setPhase("supernova");
        setHoldMsg("");

        setRings(Array.from({ length: 5 }, (_, i) => ({ id: i, delay: i * 0.12 })));
        setDebris(
          Array.from({ length: 28 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 28 + Math.random() * 0.3;
            const dist = 120 + Math.random() * 250;
            return { id: i, x: Math.cos(a) * dist, y: Math.sin(a) * dist, size: 2 + Math.random() * 9, delay: Math.random() * 0.15 };
          })
        );

        if (sectionRef.current) {
          gsap.to(sectionRef.current, {
            x: () => Math.random() * 14 - 7,
            y: () => Math.random() * 14 - 7,
            duration: 0.05,
            repeat: 18,
            yoyo: true,
            ease: "none",
            onComplete() { gsap.set(sectionRef.current, { x: 0, y: 0 }); },
          });
        }

        setTimeout(() => setPhase("message"), 2200);
      },
    });
  }, []);

  /* ---- hold start / release ---- */
  const startHold = useCallback(() => {
    if (phase !== "orbit" || doneRef.current) return;
    holdStartRef.current = Date.now();
    lastMsgIdx.current = -1;
    setHolding(true);
    setReleaseMsg("");
    setHoldMsg(HOLD_MESSAGES[0].text);
  }, [phase]);

  const endHold = useCallback(() => {
    if (!holdStartRef.current || doneRef.current) return;
    holdStartRef.current = null;
    setHolding(false);
    setIntensity(0);
    setHoldMsg("");
    lastMsgIdx.current = -1;
    setReleaseMsg(pick(RELEASE_MESSAGES));
  }, []);

  return (
    <section
      ref={sectionRef}
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden text-center select-none"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onContextMenu={(e) => e.preventDefault()}
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display pointer-events-none relative z-20 mb-10 text-[clamp(30px,7.5vw,66px)] text-[#fff8f0]"
      >
        Two hearts, one orbit
      </motion.h2>

      {/* Orbit container */}
      <div className="relative flex h-[240px] w-[240px] items-center justify-center">

        {/* ---- PULSAR EFFECTS ---- */}
        {phase === "orbit" && (
          <>
            {/* Core glow */}
            <motion.div
              animate={{
                scale: [1, 1.3 + intensity * 0.8, 1],
                opacity: [0.1 + intensity * 0.15, 0.28 + intensity * 0.35, 0.1 + intensity * 0.15],
              }}
              transition={{
                duration: Math.max(0.25, 1.4 - intensity * 1.15),
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute h-[180px] w-[180px] rounded-full bg-[#ff6b8a]"
              style={{ filter: `blur(${30 + intensity * 25}px)` }}
            />

            {/* Spinning light-beam rays */}
            {intensity > 0.2 && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: Math.max(0.4, 3 - intensity * 2.6),
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="pointer-events-none absolute rounded-full"
                style={{
                  width: 200 + intensity * 120,
                  height: 200 + intensity * 120,
                  background: `conic-gradient(from 0deg,
                    transparent,
                    rgba(255,107,138,${intensity * 0.35}),
                    transparent,
                    rgba(255,179,198,${intensity * 0.25}),
                    transparent,
                    rgba(255,107,138,${intensity * 0.35}),
                    transparent,
                    rgba(255,179,198,${intensity * 0.25}),
                    transparent)`,
                  filter: "blur(6px)",
                }}
              />
            )}

            {/* Inner accretion ring */}
            {intensity > 0.45 && (
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: Math.max(0.6, 2 - intensity * 1.4), repeat: Infinity, ease: "linear" }, scale: { duration: 0.5, repeat: Infinity } }}
                className="pointer-events-none absolute rounded-full border border-[#ff6b8a]/30"
                style={{
                  width: 60 + (1 - intensity) * 40,
                  height: 60 + (1 - intensity) * 40,
                  boxShadow: `inset 0 0 20px rgba(255,107,138,${intensity * 0.3}), 0 0 15px rgba(255,107,138,${intensity * 0.2})`,
                }}
              />
            )}
          </>
        )}

        {/* ---- SUPERNOVA EXPLOSION ---- */}
        <AnimatePresence>
          {phase === "supernova" && (
            <>
              <motion.div
                key="flash"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 10, 15], opacity: [1, 0.85, 0] }}
                transition={{ duration: 1.3, ease: "easeOut" }}
                className="pointer-events-none absolute h-[50px] w-[50px] rounded-full bg-white"
                style={{ filter: "blur(12px)" }}
              />
              <motion.div
                key="core"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 6, 9], opacity: [1, 0.5, 0] }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="pointer-events-none absolute h-[50px] w-[50px] rounded-full"
                style={{
                  background: "radial-gradient(circle, #fff 0%, #ffccd5 25%, #ff6b8a 50%, transparent 70%)",
                  filter: "blur(4px)",
                }}
              />
              {rings.map((ring) => (
                <motion.div
                  key={`ring-${ring.id}`}
                  initial={{ scale: 0, opacity: 0.9 }}
                  animate={{ scale: [0, 7 + ring.id * 2.5], opacity: [0.9, 0] }}
                  transition={{ duration: 1.6, delay: ring.delay, ease: "easeOut" }}
                  className="pointer-events-none absolute h-[50px] w-[50px] rounded-full"
                  style={{
                    border: `${2.5 - ring.id * 0.35}px solid rgba(255,107,138,${0.85 - ring.id * 0.14})`,
                    boxShadow: `0 0 ${18 - ring.id * 3}px rgba(255,107,138,${0.5 - ring.id * 0.08}),
                                inset 0 0 ${10 - ring.id * 2}px rgba(255,107,138,${0.3 - ring.id * 0.05})`,
                  }}
                />
              ))}
              {debris.map((d) => (
                <motion.div
                  key={`d-${d.id}`}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{ x: d.x, y: d.y, scale: 0, opacity: 0 }}
                  transition={{ duration: 1.0 + Math.random() * 0.6, delay: d.delay, ease: "easeOut" }}
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    width: d.size,
                    height: d.size,
                    background: d.id % 4 === 0 ? "#fff" : d.id % 4 === 1 ? "#ff6b8a" : d.id % 4 === 2 ? "#ffb3c6" : "#ffd6e0",
                    boxShadow: `0 0 ${d.size * 2}px ${d.id % 2 === 0 ? "rgba(255,107,138,0.8)" : "rgba(255,179,198,0.8)"}`,
                  }}
                />
              ))}
              <motion.div
                key="nebula"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 4, 5], opacity: [0, 0.35, 0] }}
                transition={{ duration: 2.2, delay: 0.3, ease: "easeOut" }}
                className="pointer-events-none absolute h-[80px] w-[80px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255,107,138,0.4) 0%, rgba(255,179,198,0.2) 40%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Heart 1 */}
        {phase === "orbit" && (
          <div
            ref={heart1Ref}
            className="pointer-events-none absolute text-[clamp(36px,9vw,56px)] leading-none"
            style={{
              color: "#ff6b8a",
              filter: `drop-shadow(0 0 ${14 + intensity * 22}px rgba(255,107,138,${0.7 + intensity * 0.3}))`,
            }}
          >
            ❤
          </div>
        )}

        {/* Heart 2 */}
        {phase === "orbit" && (
          <div
            ref={heart2Ref}
            className="pointer-events-none absolute text-[clamp(36px,9vw,56px)] leading-none"
            style={{
              color: "#ffb3c6",
              filter: `drop-shadow(0 0 ${14 + intensity * 22}px rgba(255,179,198,${0.7 + intensity * 0.3}))`,
            }}
          >
            ❤
          </div>
        )}

        {/* Merged heart */}
        {phase === "message" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.2, 1.5], opacity: [0, 1, 1] }}
            transition={{ duration: 1, ease: "easeOut" }}
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

      {/* ---- Text area below orbit ---- */}
      <div className="pointer-events-none relative z-20 mt-6 flex h-20 flex-col items-center justify-start">

        {/* Idle instruction */}
        {phase === "orbit" && !holding && !releaseMsg && (
          <motion.p
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[clamp(16px,3.5vw,24px)] text-[#ffb3c6]"
          >
            hold to bring them closer
          </motion.p>
        )}

        {/* Release message */}
        <AnimatePresence mode="wait">
          {phase === "orbit" && !holding && releaseMsg && (
            <motion.p
              key={releaseMsg}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="font-display text-[clamp(18px,4vw,28px)] italic text-[#ffd6e0]"
            >
              {releaseMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hold messages */}
        <AnimatePresence mode="wait">
          {phase === "orbit" && holding && holdMsg && (
            <motion.p
              key={holdMsg}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="font-display text-[clamp(18px,4vw,28px)] text-[#ffd6e0]"
            >
              {holdMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Final message */}
      {phase === "message" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="pointer-events-auto relative z-20 mt-4 flex flex-col items-center gap-5"
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
