import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ── 6 romantic pairs ── */
const SYMBOLS = [
  { icon: "💕", label: "love" },
  { icon: "🌹", label: "rose" },
  { icon: "💌", label: "letter" },
  { icon: "🦋", label: "butterfly" },
  { icon: "✨", label: "sparkle" },
  { icon: "🔮", label: "destiny" },
];

const MATCH_MESSAGES = [
  "Perfect match!",
  "You found one!",
  "Made for each other!",
  "Like us!",
  "Soulmates!",
  "Written in the stars!",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SceneMemoryMatch({ onNext, triggerBurst, setStarPreset, triggerWarp, setSceneObjects }) {
  /* build the deck: 6 pairs = 12 cards, shuffled */
  const deck = useMemo(() => {
    const cards = SYMBOLS.flatMap((s, si) => [
      { id: si * 2, pairId: si, ...s },
      { id: si * 2 + 1, pairId: si, ...s },
    ]);
    return shuffle(cards);
  }, []);

  const [flipped, setFlipped] = useState([]);        // indices currently face-up
  const [matched, setMatched] = useState(new Set());  // pairIds that are matched
  const [locked, setLocked] = useState(false);        // lock during mismatch reveal
  const [matchMsg, setMatchMsg] = useState("");
  const [done, setDone] = useState(false);
  const matchCountRef = useRef(0);
  const msgTimerRef = useRef(null);

  useEffect(() => {
    setStarPreset({ speed: 0.3, opacity: 0.5, tint: "#d8b4fe" });
    setSceneObjects({ orb: { visible: false }, planet: { visible: false }, bloomIntensity: 0 });
    return () => { if (msgTimerRef.current) clearTimeout(msgTimerRef.current); };
  }, [setStarPreset, setSceneObjects]);

  const handleFlip = useCallback((index) => {
    if (locked || done) return;
    if (flipped.includes(index)) return;
    if (matched.has(deck[index].pairId)) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      const [a, b] = next;
      if (deck[a].pairId === deck[b].pairId) {
        /* ── match! ── */
        const newMatched = new Set(matched);
        newMatched.add(deck[a].pairId);
        setMatched(newMatched);
        setFlipped([]);
        matchCountRef.current += 1;

        /* burst at card positions */
        const cardA = document.querySelector(`[data-card="${a}"]`);
        const cardB = document.querySelector(`[data-card="${b}"]`);
        if (cardA) {
          const r = cardA.getBoundingClientRect();
          triggerBurst((r.left + r.width / 2) / window.innerWidth * 100, (r.top + r.height / 2) / window.innerHeight * 100, 0.8);
        }
        if (cardB) {
          const r = cardB.getBoundingClientRect();
          triggerBurst((r.left + r.width / 2) / window.innerWidth * 100, (r.top + r.height / 2) / window.innerHeight * 100, 0.8);
        }

        /* show match message */
        setMatchMsg(MATCH_MESSAGES[matchCountRef.current - 1] || "Amazing!");
        if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
        msgTimerRef.current = setTimeout(() => setMatchMsg(""), 1200);

        /* all matched? */
        if (newMatched.size === SYMBOLS.length) {
          setTimeout(() => {
            triggerWarp(18, 1.2, 0.6, 1.5);
            triggerBurst(50, 50, 1.5);
            setDone(true);
          }, 600);
        }
      } else {
        /* ── mismatch — show briefly then flip back ── */
        setLocked(true);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 700);
      }
    }
  }, [flipped, matched, locked, done, deck, triggerBurst, triggerWarp]);

  return (
    <section
      className="scene-shell relative flex flex-col items-center justify-center overflow-hidden"
      style={{ padding: "2rem 1rem" }}
    >
      {/* title */}
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-display relative z-20 mb-4 text-center text-[clamp(24px,6vw,44px)] text-[#fff8f0]"
        style={{ filter: "drop-shadow(0 0 16px rgba(255,255,255,0.1))" }}
      >
        Match the Hearts
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3 }}
        className="relative z-20 mb-6 text-center text-[clamp(13px,3vw,17px)] text-[#ffb3c6]"
      >
        find all the pairs
      </motion.p>

      {/* match message toast */}
      <AnimatePresence>
        {matchMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="font-display absolute top-[12%] z-30 text-[clamp(20px,5vw,32px)] text-[#ffb3c6]"
            style={{ filter: "drop-shadow(0 0 20px rgba(255,179,198,0.5))" }}
          >
            {matchMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* card grid */}
      <div className="relative z-20 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4" style={{ perspective: "800px" }}>
        {deck.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);

          return (
            <motion.button
              key={card.id}
              data-card={i}
              type="button"
              onClick={() => handleFlip(i)}
              initial={{ opacity: 0, scale: 0.7, rotateY: 0 }}
              animate={{
                opacity: 1,
                scale: isMatched ? [1, 1.15, 1] : 1,
                rotateY: isFlipped ? 180 : 0,
              }}
              transition={{
                opacity: { delay: i * 0.06, duration: 0.4 },
                scale: { delay: i * 0.06, duration: 0.4 },
                rotateY: { duration: 0.4, ease: "easeOut" },
              }}
              className="relative flex items-center justify-center rounded-xl"
              style={{
                width: "clamp(70px, 18vw, 110px)",
                height: "clamp(90px, 24vw, 130px)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* card back */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/15"
                style={{
                  backfaceVisibility: "hidden",
                  background: "linear-gradient(135deg, rgba(255,107,138,0.15), rgba(216,180,254,0.12))",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="text-[clamp(28px,7vw,42px)] opacity-60">{"💗"}</span>
              </div>

              {/* card front */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl border"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: isMatched
                    ? "linear-gradient(135deg, rgba(255,179,198,0.25), rgba(232,184,109,0.15))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,179,198,0.08))",
                  borderColor: isMatched ? "rgba(255,179,198,0.4)" : "rgba(255,255,255,0.2)",
                  boxShadow: isMatched ? "0 0 20px rgba(255,107,138,0.3)" : "none",
                }}
              >
                <span className="text-[clamp(32px,8vw,50px)]">{card.icon}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* progress indicator */}
      <div className="relative z-20 mt-6 flex gap-2">
        {SYMBOLS.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: matched.has(i) ? [1, 1.4, 1] : 1,
              backgroundColor: matched.has(i) ? "#ff6b8a" : "rgba(255,255,255,0.15)",
            }}
            className="h-2.5 w-2.5 rounded-full"
          />
        ))}
      </div>

      {/* completion */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { triggerBurst(50, 50, 1.2); onNext(); }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-[clamp(60px,16vw,110px)]"
              style={{ filter: "drop-shadow(0 0 30px rgba(255,107,138,0.6))" }}
            >
              {"💕"}
            </motion.div>
            <p className="font-display text-[clamp(26px,6.5vw,50px)] text-[#fff8f0]"
              style={{ filter: "drop-shadow(0 0 16px rgba(255,255,255,0.12))" }}>
              Every piece fits perfectly
            </p>
            <p className="font-display text-[clamp(20px,5vw,36px)] text-[#ffb3c6]">
              Just like us.
            </p>
            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 text-[clamp(13px,3vw,17px)] text-[#fff8f0]/50"
            >
              tap to continue
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
