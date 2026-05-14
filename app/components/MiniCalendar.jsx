import { useState } from "react";
import { MIN_DATE, MAX_DATE } from "../constants/dates";

const pad = (n) => String(n).padStart(2, "0");
export const toDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const MONTH_NAMES = {
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};
const DAY_LABELS = {
  es: ["D","L","M","X","J","V","S"],
  en: ["S","M","T","W","T","F","S"],
};

export function MiniCalendar({ value, onChange, lang }) {
  const [viewYear, setViewYear] = useState(() =>
    parseInt((value || MIN_DATE).slice(0, 4), 10),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    parseInt((value || MIN_DATE).slice(5, 7), 10) - 1,
  );

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const curMonthStr = `${viewYear}-${pad(viewMonth + 1)}`;
  const canPrev = curMonthStr > MIN_DATE.slice(0, 7);
  const canNext = curMonthStr < MAX_DATE.slice(0, 7);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else { setViewMonth((m) => m - 1); }
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else { setViewMonth((m) => m + 1); }
  };

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "10px 10px 8px", userSelect: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          onClick={prevMonth}
          disabled={!canPrev}
          style={{ background: "none", border: "none", cursor: canPrev ? "pointer" : "default", color: canPrev ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {MONTH_NAMES[lang][viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={!canNext}
          style={{ background: "none", border: "none", cursor: canNext ? "pointer" : "default", color: canNext ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}
        >›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {DAY_LABELS[lang].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "var(--color-text-tertiary)", padding: "2px 0", fontWeight: 500 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = toDateStr(viewYear, viewMonth, d);
          const isDisabled = dateStr < MIN_DATE || dateStr > MAX_DATE;
          const isSelected = dateStr === value;
          return (
            <button
              key={i}
              onClick={() => !isDisabled && onChange(dateStr)}
              disabled={isDisabled}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 28, borderRadius: 6, fontSize: 12, background: isSelected ? "#2d6a4f" : "transparent", color: isDisabled ? "var(--color-text-tertiary)" : isSelected ? "#fff" : "var(--color-text-primary)", border: "none", cursor: isDisabled ? "default" : "pointer", fontWeight: isSelected ? 600 : 400, opacity: isDisabled ? 0.35 : 1 }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
