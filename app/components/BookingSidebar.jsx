import { formatCLP } from "../constants/formatters";
import { cartTotal, isCartBookable } from "../lib/booking/availability";

const DAY_NAMES = {
  es: ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"],
  en: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
};
const MONTH_NAMES = {
  es: ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"],
  en: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
};

function fmtDate(dateStr, lang) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAY_NAMES[lang][date.getDay()];
  const monthName = MONTH_NAMES[lang][m - 1];
  return lang === "es" ? `${dayName} ${d} DE ${monthName}` : `${dayName}, ${monthName} ${d}`;
}

function ExperienceTile({ item, lang, t, onRemove }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#e5e5e5",
        borderRadius: 9,
        padding: "12px 14px",
        minHeight: 90,
      }}
    >
      <button
        onClick={() => onRemove(item.cartId)}
        aria-label="Quitar"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(0,0,0,0.3)",
          fontSize: 16,
          lineHeight: 1,
          padding: "0 2px",
        }}
      >
        ×
      </button>
      <p
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 14,
          fontWeight: 400,
          color: "#000",
          textTransform: "uppercase",
          lineHeight: 1.3,
          paddingRight: 16,
        }}
      >
        {item.exp.name[lang]}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 16,
            fontWeight: 700,
            color: "#010101",
          }}
        >
          {formatCLP(item.exp.price)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            fontWeight: 300,
            color: "#010101",
          }}
        >
          /PP
        </span>
      </div>
      <p
        style={{
          margin: "4px 0 0",
          fontFamily: "var(--font-inter)",
          fontSize: 13,
          fontWeight: 300,
          color: "#000",
        }}
      >
        {t[`diff_${item.exp.difficulty}`] || item.exp.difficulty}
      </p>
    </div>
  );
}

function EmptyTile({ lang }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.18)",
        borderRadius: 9,
        minHeight: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          fontStyle: "italic",
          color: "rgba(0,0,0,0.48)",
          textAlign: "center",
        }}
      >
        {lang === "es" ? "Nada agendado" : "Nothing scheduled"}
      </p>
    </div>
  );
}

function DayGroup({ dayNum, date, items, lang, t, onRemove }) {
  const fullItems = items.filter((i) => i.exp.type === "full");
  const halfItems = items.filter((i) => i.exp.type === "half");
  const amItems = halfItems.filter((i) => i.slot === "AM");
  const pmItems = halfItems.filter((i) => i.slot === "PM");
  const noSlotItems = halfItems.filter((i) => !i.slot);
  const hasHalfDay = halfItems.length > 0;
  const dayLabel = lang === "es" ? "DÍA" : "DAY";

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 24,
            fontWeight: 300,
            color: "#000",
          }}
        >
          {dayLabel} {dayNum}
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            fontWeight: 300,
            color: "#000",
          }}
        >
          {fmtDate(date, lang)}
        </span>
      </div>

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", marginBottom: 10 }} />

      {fullItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fullItems.map((item) => (
            <ExperienceTile key={item.cartId} item={item} lang={lang} t={t} onRemove={onRemove} />
          ))}
        </div>
      )}

      {hasHalfDay && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: fullItems.length > 0 ? 8 : 0,
          }}
        >
          {amItems.length > 0
            ? amItems.map((item) => (
                <ExperienceTile key={item.cartId} item={item} lang={lang} t={t} onRemove={onRemove} />
              ))
            : <EmptyTile lang={lang} />}
          {pmItems.length > 0
            ? pmItems.map((item) => (
                <ExperienceTile key={item.cartId} item={item} lang={lang} t={t} onRemove={onRemove} />
              ))
            : <EmptyTile lang={lang} />}

          {noSlotItems.map((item) => (
            <div key={item.cartId} style={{ gridColumn: "1 / -1" }}>
              <ExperienceTile item={item} lang={lang} t={t} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingSidebar({
  lang,
  t,
  cartItems,
  onRemove,
  onCheckout,
  bottomSheet = false,
  isOpen = false,
  onClose = () => {},
}) {
  const total = cartTotal(cartItems);
  const isEmpty = cartItems.length === 0;
  const canCheckout = isCartBookable(cartItems);

  const dateMap = new Map();
  const undated = [];
  for (const item of cartItems) {
    if (!item.date) {
      undated.push(item);
    } else {
      if (!dateMap.has(item.date)) dateMap.set(item.date, []);
      dateMap.get(item.date).push(item);
    }
  }
  const sortedDates = [...dateMap.keys()].sort();

  const innerContent = (
    <>
      {/* <h2
        style={{
          margin: "0 0 20px",
          fontSize: 20,
          fontWeight: 500,
          fontFamily: "var(--font-jetbrains-mono)",
          color: "#1e1e1e",
          flexShrink: 0,
        }}
      >
        {lang === "es" ? "MI ITINERARIO" : "MY ITINERARY"}
      </h2> */}

      {isEmpty ? (
        <div style={{ textAlign: "center", padding: "32px 0", flex: 1 }}>
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: 500,
              fontSize: 14,
              fontFamily: "var(--font-jetbrains-mono)",
              color: "var(--color-text-primary)",
            }}
          >
            {t.sidebar_empty}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontStyle: "italic",
              color: "rgba(0,0,0,0.48)",
            }}
          >
            {t.sidebar_empty_sub}
          </p>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
            {undated.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    fontFamily: "var(--font-jetbrains-mono)",
                    color: "var(--color-text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {lang === "es" ? "Sin fecha" : "No date"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {undated.map((item) => (
                    <ExperienceTile key={item.cartId} item={item} lang={lang} t={t} onRemove={onRemove} />
                  ))}
                </div>
              </div>
            )}

            {sortedDates.map((date, idx) => (
              <DayGroup
                key={date}
                dayNum={idx + 1}
                date={date}
                items={dateMap.get(date)}
                lang={lang}
                t={t}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div style={{ flexShrink: 0, paddingTop: 16, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 14,
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 400,
                color: "#1c1c1a",
                textTransform: "uppercase",
              }}
            >
              {t.total}
            </p>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 40,
                fontWeight: 400,
                fontFamily: "var(--font-inter)",
                color: "#1c1c1a",
                lineHeight: 1.1,
              }}
            >
              {formatCLP(total)}
            </p>
            <button
              onClick={onCheckout}
              disabled={!canCheckout}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 50,
                border: "none",
                background: canCheckout ? "#1e1e1e" : "var(--color-background-secondary)",
                color: canCheckout ? "#fff" : "var(--color-text-tertiary)",
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 700,
                fontSize: 20,
                textTransform: "uppercase",
                cursor: canCheckout ? "pointer" : "not-allowed",
                letterSpacing: 0.5,
              }}
            >
              {lang === "es" ? "PAGAR" : "PAY"}
            </button>
          </div>
        </>
      )}
    </>
  );

  if (bottomSheet) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 200,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        />
        {/* Sheet */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            zIndex: 201,
            transform: isOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "14px 0 6px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(0,0,0,0.18)",
              }}
            />
          </div>
          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "8px 24px 32px",
            }}
          >
            {innerContent}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {innerContent}
    </div>
  );
}
