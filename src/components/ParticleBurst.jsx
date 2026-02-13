import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useCallback, useEffect, useMemo } from "react";

const BURST_LIFETIME_MS = 3200;

const baseOptions = {
  fullScreen: { enable: false },
  background: { color: "transparent" },
  particles: {
    number: { value: 0 },
    color: { value: ["#ff6b8a", "#ffb3c6", "#ff8fa3", "#ffd6e0", "#e8b86d", "#ffffff"] },
    shape: { type: ["heart", "circle", "star"] },
    opacity: {
      value: 1,
      animation: { enable: true, speed: 0.9, startValue: "max", minimumValue: 0, destroy: "min" },
    },
    size: {
      value: { min: 4, max: 14 },
      animation: { enable: true, speed: 3, startValue: "max", minimumValue: 1, destroy: "min" },
    },
    move: {
      enable: true,
      speed: { min: 8, max: 25 },
      direction: "none",
      outModes: "destroy",
      gravity: { enable: true, acceleration: 5 },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 20 },
    },
    life: { duration: { value: 3 } },
  },
};

function SingleBurst({ burst, onDone }) {
  const init = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(
    () => ({
      ...baseOptions,
      emitters: {
        position: { x: burst.x, y: burst.y },
        rate: { quantity: Math.round(80 * burst.intensity), delay: 0 },
        life: { count: 1, duration: 0.1 },
      },
    }),
    [burst.x, burst.y, burst.intensity],
  );

  useEffect(() => {
    const t = window.setTimeout(() => onDone(burst.id), BURST_LIFETIME_MS);
    return () => window.clearTimeout(t);
  }, [burst.id, onDone]);

  return <Particles id={`burst-${burst.id}`} init={init} options={options} className="absolute inset-0 h-full w-full" />;
}

export default function ParticleBurst({ bursts, onDone }) {
  if (!bursts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {bursts.map((b) => (
        <SingleBurst key={b.id} burst={b} onDone={onDone} />
      ))}
    </div>
  );
}
