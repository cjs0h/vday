import { motion } from "framer-motion";

export default function ProgressDots({ total, active }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={`dot-${i}`} className="relative flex h-3 w-3 items-center justify-center">
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              i === active ? "bg-[#ff6b8a]" : "bg-white/25"
            }`}
          />
          {i === active && (
            <motion.div
              layoutId="active-dot"
              className="absolute inset-0 rounded-full border border-[#ff6b8a]/60 shadow-[0_0_10px_rgba(255,107,138,0.5)]"
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
