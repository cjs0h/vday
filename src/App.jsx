import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ParticleBurst from "./components/ParticleBurst";
import ProgressDots from "./components/ProgressDots";
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

export default function App() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [bursts, setBursts] = useState([]);
  const [toast, setToast] = useState("");
  const starControlRef = useRef({ ...initialStarState });
  const sceneObjectsRef = useRef(makeObjectsState());
  const burstIdRef = useRef(0);
  const firstSceneRef = useRef(true);
  const toastTimerRef = useRef(null);
  const warpTimelineRef = useRef(null);

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

  const ActiveScene = scenes[sceneIndex];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0a0010] text-[#fff8f0]">
      <Starfield controlRef={starControlRef} objectsRef={sceneObjectsRef} />
      <ParticleBurst bursts={bursts} onDone={removeBurst} />
      <Vignette />

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

      <ProgressDots total={scenes.length} active={sceneIndex} onJump={setSceneIndex} />

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
    </main>
  );
}
