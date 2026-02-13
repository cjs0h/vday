import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useCallback, useMemo } from "react";

const makeRainConfig = (useHearts = false) => ({
  fullScreen: { enable: false },
  background: { color: "transparent" },
  particles: {
    number: { value: 25 },
    color: { value: ["#ffb3c6", "#ffcdb2", "#ff8fa3", "#ffffff"] },
    shape: useHearts ? { type: "heart" } : { type: "circle" },
    opacity: { value: { min: 0.3, max: 0.7 } },
    size: { value: { min: 3, max: 8 } },
    move: {
      enable: true,
      speed: { min: 0.5, max: 2 },
      direction: "bottom",
      drift: { min: -1, max: 1 },
      outModes: { bottom: "out", top: "out", left: "out", right: "out" },
    },
    wobble: { enable: true, distance: 15, speed: 10 },
    rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 5 } },
  },
});

const firefliesConfig = {
  fullScreen: { enable: false },
  background: { color: "transparent" },
  particles: {
    number: { value: 15 },
    color: { value: "#e8b86d" },
    shape: { type: "circle" },
    opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: 0.5, minimumValue: 0.1 } },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 0.3, direction: "none", random: true, outModes: "bounce" },
  },
};

const embersConfig = {
  fullScreen: { enable: false },
  background: { color: "transparent" },
  particles: {
    number: { value: 30 },
    color: { value: ["#e8b86d", "#ffcdb2", "#ff9f4d"] },
    shape: { type: "circle" },
    opacity: { value: { min: 0.2, max: 0.8 }, animation: { enable: true, speed: 0.5, minimumValue: 0 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: { min: 0.2, max: 1.1 },
      direction: "top",
      random: true,
      outModes: { top: "out", left: "out", right: "out", bottom: "destroy" },
    },
  },
};

const finaleRainConfig = {
  fullScreen: { enable: false },
  background: { color: "transparent" },
  particles: {
    number: { value: 55 },
    color: { value: ["#ff8fa3", "#ffb3c6", "#e8b86d", "#ffffff"] },
    shape: { type: ["heart", "circle"] },
    opacity: { value: { min: 0.25, max: 0.8 } },
    size: { value: { min: 3, max: 10 } },
    move: {
      enable: true,
      speed: { min: 0.8, max: 3 },
      direction: "bottom",
      random: true,
      outModes: { bottom: "out", top: "out", left: "out", right: "out" },
    },
    wobble: { enable: true, distance: 20, speed: 12 },
  },
};

const variants = {
  "rain-circles": makeRainConfig(false),
  "rain-hearts": makeRainConfig(true),
  fireflies: firefliesConfig,
  embers: embersConfig,
  "finale-rain": finaleRainConfig,
};

export default function PetalRain({ variant = "rain-circles", className = "" }) {
  const init = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);
  const options = useMemo(() => variants[variant] ?? variants["rain-circles"], [variant]);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <Particles id={`ambient-${variant}`} init={init} options={options} className="h-full w-full" />
    </div>
  );
}
