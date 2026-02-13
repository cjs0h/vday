import { motion } from "framer-motion";

export default function ProgressDots({ total, active, onJump }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={`dot-${i}`}
          type="button"
          onClick={() => onJump?.(i)}
          className="relative flex h-5 w-5 cursor-pointer items-center justify-center bg-transparent p-0"
        >
          <div
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              i === active ? "bg-[#ff6b8a]" : "bg-white/25"
            }`}
          />
          {i === active && (
            <motion.div
              layoutId="active-dot"
              className="absolute inset-0.5 rounded-full border border-[#ff6b8a]/60 shadow-[0_0_10px_rgba(255,107,138,0.5)]"
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
