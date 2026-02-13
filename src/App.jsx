import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ParticleBurst from "./components/ParticleBurst";
import Starfield from "./components/Starfield";
import Vignette from "./components/Vignette";
import SceneVoid from "./scenes/SceneVoid";
import SceneMemoryMatch from "./scenes/SceneMemoryMatch";
import SceneHeartPop from "./scenes/SceneHeartPop";
import SceneFireworks from "./scenes/SceneFireworks";
import SceneBubblePop from "./scenes/SceneBubblePop";
import SceneHeartbeat from "./scenes/SceneHeartbeat";
import SceneWhackHeart from "./scenes/SceneWhackHeart";
import SceneLoveLock from "./scenes/SceneLoveLock";
import SceneOrbit from "./scenes/SceneOrbit";
import SceneWish from "./scenes/SceneWish";
import SceneFinale from "./scenes/SceneFinale";


const scenes = [
  SceneVoid,        // 0: Intro — orb + sparkles + "tap to begin"
  SceneMemoryMatch, // 1: Memory match card game
  SceneHeartPop,    // 2: Pop falling hearts
  SceneFireworks,   // 3: Tap to launch fireworks
  SceneBubblePop,   // 4: Pop bubbles at the right size
  SceneHeartbeat,   // 5: ECG heartbeat visual
  SceneWhackHeart,  // 6: Whack-a-heart 3x3 grid
  SceneLoveLock,    // 7: Catch the love lock
  SceneOrbit,       // 8: Hold to merge orbiting hearts
  SceneWish,        // 9: Blow the dandelion
  SceneFinale,      // 10: Grand finale
];

/* ── unlock date: Feb 14 00:00 Basra time (Asia/Baghdad = UTC+3) ── */
const UNLOCK_UTC = Date.UTC(2026, 1, 13, 21, 0, 0); // Feb 13 21:00 UTC = Feb 14 00:00 UTC+3

function getTimeLeft() {
  const diff = UNLOCK_UTC - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, total: diff };
}

const initialStarState = {
  targetSpeed: 0.25,
  currentSpeed: 0.25,
  targetOpacity: 0.4,
  currentOpacity: 0.4,
  targetTint: "#ffb3c6",
  warpTarget: 0,
  warp: 0,
};

const makeObjectsState = () => ({
  orb: { visible: false, color: "#ff8fa3", scale: 1, pulseSpeed: 1.35, emissiveIntensity: 1.5, x: 0, y: 0, z: -5 },
  planet: { visible: false, color: "#ffcdb2", scale: 1.3, pulseSpeed: 1.1, emissiveIntensity: 1.4, x: 0, y: 1, z: -6 },
  bloomIntensity: 0,
});

/* ── Lock Screen ── */
function LockScreen({ timeLeft }) {
  return (
    <section className="relative z-30 flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-[clamp(80px,20vw,140px)] leading-none"
        style={{ filter: "drop-shadow(0 0 40px rgba(255,107,138,0.5))" }}
      >
        {"💝"}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="font-handwriting text-[clamp(32px,8vw,72px)] leading-[1.3] text-[#fff8f0]"
      >
        Something special is coming...
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.8 }}
        className="font-display text-[clamp(16px,3.5vw,22px)] text-[#ffb3c6]"
      >
        just for you
      </motion.p>

      {/* countdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-4 flex gap-4 sm:gap-6"
      >
        {[
          { val: timeLeft.d, label: "days" },
          { val: timeLeft.h, label: "hours" },
          { val: timeLeft.m, label: "min" },
          { val: timeLeft.s, label: "sec" },
        ].map(({ val, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span
              className="font-display text-[clamp(28px,7vw,56px)] tabular-nums text-[#fff8f0]"
              style={{ filter: "drop-shadow(0 0 12px rgba(255,179,198,0.3))" }}
            >
              {String(val).padStart(2, "0")}
            </span>
            <span className="text-[clamp(10px,2.5vw,14px)] uppercase tracking-widest text-[#ffb3c6]/60">
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ delay: 2, duration: 3, repeat: Infinity }}
        className="mt-6 text-[clamp(13px,3vw,17px)] text-[#fff8f0]/40"
      >
        patience, my love...
      </motion.p>
    </section>
  );
}

export default function App() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [bursts, setBursts] = useState([]);
  const [toast, setToast] = useState("");
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const starControlRef = useRef({ ...initialStarState });
  const sceneObjectsRef = useRef(makeObjectsState());
  const burstIdRef = useRef(0);
  const firstSceneRef = useRef(true);
  const toastTimerRef = useRef(null);
  const warpTimelineRef = useRef(null);

  /* countdown tick */
  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      const tl = getTimeLeft();
      if (!tl) { setTimeLeft(null); clearInterval(id); return; }
      setTimeLeft(tl);
    }, 1000);
    return () => clearInterval(id);
  }, [!!timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStarPreset = useCallback((preset) => {
    Object.assign(starControlRef.current, {
      targetSpeed: preset.speed ?? starControlRef.current.targetSpeed,
      targetOpacity: preset.opacity ?? starControlRef.current.targetOpacity,
      targetTint: preset.tint ?? starControlRef.current.targetTint,
    });
  }, []);

  const setSceneObjects = useCallback((updates) => {
    const ref = sceneObjectsRef.current;
    if (updates.orb) Object.assign(ref.orb, updates.orb);
    if (updates.planet) Object.assign(ref.planet, updates.planet);
    if (updates.bloomIntensity !== undefined) ref.bloomIntensity = updates.bloomIntensity;
  }, []);

  const triggerWarp = useCallback((peak = 15, inDuration = 2, hold = 1, outDuration = 1.2) => {
    warpTimelineRef.current?.kill();
    const tl = gsap.timeline();
    tl.to(starControlRef.current, { warpTarget: peak, duration: inDuration, ease: "power2.inOut" });
    tl.to({}, { duration: hold });
    tl.to(starControlRef.current, { warpTarget: 0, duration: outDuration, ease: "power3.out" });
    warpTimelineRef.current = tl;
  }, []);

  const triggerBurst = useCallback((x = 50, y = 50, intensity = 1) => {
    const id = ++burstIdRef.current;
    setBursts((prev) => [...prev, { id, x, y, intensity }]);
  }, []);

  const removeBurst = useCallback((id) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const showToast = useCallback((text) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2400);
  }, []);

  const goNext = useCallback(() => {
    setSceneIndex((i) => Math.min(i + 1, scenes.length - 1));
  }, []);

  const restart = useCallback(() => {
    setSceneIndex(0);
    starControlRef.current = { ...initialStarState };
    sceneObjectsRef.current = makeObjectsState();
    triggerBurst(50, 50, 1.5);
  }, [triggerBurst]);

  useEffect(() => {
    if (firstSceneRef.current) { firstSceneRef.current = false; return; }
    triggerBurst(50, 50, 1);
  }, [sceneIndex, triggerBurst]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    warpTimelineRef.current?.kill();
  }, []);

  const isLocked = timeLeft !== null;
  const ActiveScene = scenes[sceneIndex];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0a0010] text-[#fff8f0]">
      <Starfield controlRef={starControlRef} objectsRef={sceneObjectsRef} />
      <ParticleBurst bursts={bursts} onDone={removeBurst} />
      <Vignette />

      {isLocked ? (
        <LockScreen timeLeft={timeLeft} />
      ) : (
        <>
          <div className="relative z-30 min-h-dvh">
            <AnimatePresence mode="wait">
              <motion.div
                key={`scene-${sceneIndex}`}
                initial={{ opacity: 0, y: 24, scale: 1.02 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="min-h-dvh"
              >
                <ActiveScene
                  onNext={goNext}
                  onRestart={restart}
                  setStarPreset={setStarPreset}
                  setSceneObjects={setSceneObjects}
                  sceneObjectsRef={sceneObjectsRef}
                  triggerWarp={triggerWarp}
                  triggerBurst={triggerBurst}
                  onSaveMoment={() => showToast("Take a screenshot and keep it forever \ud83d\udcf8")}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-black/55 px-5 py-2 text-sm text-[#fff8f0]"
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}
