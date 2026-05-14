import { useMemo } from "react";

function DifficultyBadge({ level, t }) {
  const map = useMemo(() => ({
    easy: { label: t.diff_easy, bg: "#E8F8EF", color: "#27500A" },
    medium: { label: t.diff_med, bg: "#FEF3E6", color: "#633806" },
    hard: { label: t.diff_hard, bg: "#FDECEC", color: "#791F1F" },
  }), [t]);

  const s = map[level] || map.easy;

  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default DifficultyBadge;