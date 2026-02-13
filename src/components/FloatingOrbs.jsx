import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = [
  "rgba(255, 179, 198, 0.35)",
  "rgba(232, 184, 109, 0.28)",
  "rgba(255, 205, 178, 0.3)",
  "rgba(255, 143, 163, 0.25)",
  "rgba(255, 255, 255, 0.18)",
];

export default function FloatingOrbs({ count = 5 }) {
  const orbs = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: 170 + Math.random() * 180,
        top: 10 + Math.random() * 75,
        left: 5 + Math.random() * 90,
        duration: 14 + Math.random() * 16,
        color: COLORS[i % COLORS.length],
        xOff: Math.random() * 45 - 22,
        yOff: Math.random() * 30 - 15,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o) => (
        <motion.div
          key={o.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: o.size,
            height: o.size,
            top: `${o.top}%`,
            left: `${o.left}%`,
            background: `radial-gradient(circle at 30% 30%, ${o.color}, rgba(255,255,255,0))`,
          }}
          animate={{ x: [0, o.xOff, 0], y: [0, o.yOff, 0] }}
          transition={{ duration: o.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
