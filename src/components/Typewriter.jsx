import gsap from "gsap";
import { useLayoutEffect, useMemo, useState } from "react";

function normalizeLine(line) {
  if (typeof line === "string") return { text: line, pause: 0 };
  return { text: line?.text ?? "", pause: line?.pause ?? 0, style: line?.style };
}

export default function Typewriter({
  lines,
  className = "",
  lineClassName = "",
  charDuration = 0.03,
  startDelay = 0,
  onComplete,
  renderLine,
}) {
  const normalized = useMemo(() => lines.map(normalizeLine), [lines]);
  const [typedLines, setTypedLines] = useState(() => normalized.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);

  useLayoutEffect(() => {
    let mounted = true;
    const draft = normalized.map(() => "");
    setTypedLines(draft);
    setActiveLine(0);

    const tl = gsap.timeline({
      delay: startDelay,
      onComplete: () => { if (mounted) onComplete?.(); },
    });

    normalized.forEach((line, i) => {
      tl.call(() => { if (mounted) setActiveLine(i); });
      if (!line.text.length) {
        tl.call(() => {
          if (!mounted) return;
          draft[i] = "";
          setTypedLines([...draft]);
        });
      } else {
        const counter = { value: 0 };
        tl.to(counter, {
          value: line.text.length,
          duration: Math.max(0.2, line.text.length * charDuration),
          ease: "none",
          onUpdate: () => {
            if (!mounted) return;
            draft[i] = line.text.slice(0, Math.floor(counter.value));
            setTypedLines([...draft]);
          },
        });
      }
      if (line.pause > 0) tl.to({}, { duration: line.pause / 1000 });
    });

    return () => { mounted = false; tl.kill(); };
  }, [charDuration, normalized, onComplete, startDelay]);

  return (
    <div className={className}>
      {normalized.map((line, i) => {
        const typed = typedLines[i] ?? "";
        const isActive = i === activeLine;
        if (renderLine) return <div key={`type-line-${i}`}>{renderLine(line, i, typed, isActive)}</div>;
        return (
          <p key={`type-line-${i}`} className={lineClassName}>
            {typed}
            {isActive ? <span className="type-cursor">|</span> : null}
          </p>
        );
      })}
    </div>
  );
}
