import { formatCLP } from "../constants/formatters";
import { checkAvailability, getDateAvailability } from "../lib/booking/availability";
import { MiniCalendar } from "./MiniCalendar";

function CartItem({ item, cart, lang, t, onRemove, onDateChange, onSlotChange }) {
  const availability = item.date
    ? getDateAvailability({
        exp: item.exp,
        date: item.date,
        cart,
        ignoreCartId: item.cartId,
      })
    : {
        AM: item.exp.type === "half",
        PM: item.exp.type === "half",
        FULL: item.exp.type === "full",
      };

  const validation = checkAvailability({
    exp: item.exp,
    date: item.date,
    slot: item.slot,
    pax: item.pax || 1,
    cart,
    ignoreCartId: item.cartId,
  });

  const conflictLabel = (() => {
    if (!item.date) return t.needs_date;
    if (item.exp.type === "half" && !item.slot) return t.needs_slot;
    if (validation.ok) return null;
    switch (validation.reason) {
      case "full-day-collision":
        return t.conflict_full;
      case "am-collision":
        return t.conflict_am;
      case "pm-collision":
        return t.conflict_pm;
      case "pax-out-of-range":
        return lang === "es"
          ? "Número de personas fuera de rango"
          : "Participant count out of range";
      default:
        return null;
    }
  })();

  const isConflict =
    !validation.ok &&
    item.date &&
    (item.exp.type === "full" || item.slot);

  const pax = item.pax || 1;

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: 12,
        padding: "12px 14px",
        border: isConflict
          ? "1px solid #f5c2c2"
          : "0.5px solid transparent",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>{item.exp.emoji}</span>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              {item.exp.name[lang]}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
              }}
            >
              {formatCLP(item.exp.price)} {t.per_person}
              {" · "}
              {item.exp.type === "full" ? t.slot_full : t.half_day}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(item.cartId)}
          aria-label={t.remove}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-tertiary)",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Calendar label */}
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-tertiary)",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          {lang === "es" ? "Fecha" : "Date"}
        </p>

        {/* Mini calendar */}
        <MiniCalendar
          value={item.date}
          onChange={(d) => onDateChange(item.cartId, d)}
          lang={lang}
        />

        {/* AM / PM slot buttons (half-day only) */}
        {item.exp.type === "half" && (
          <>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--color-text-tertiary)",
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {lang === "es" ? "Horario" : "Time slot"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                {
                  slot: "AM",
                  label: lang === "es" ? "🌅 Mañana" : "🌅 Morning",
                  avail: availability.AM,
                },
                {
                  slot: "PM",
                  label: lang === "es" ? "🌇 Tarde" : "🌇 Afternoon",
                  avail: availability.PM,
                },
              ].map(({ slot, label, avail }) => {
                const selected = item.slot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() =>
                      avail && onSlotChange(item.cartId, selected ? null : slot)
                    }
                    disabled={!avail}
                    style={{
                      flex: 1,
                      padding: "9px 4px",
                      borderRadius: 10,
                      border: selected
                        ? "1.5px solid #2d6a4f"
                        : "0.5px solid var(--color-border-secondary)",
                      background: selected
                        ? "#eef7f2"
                        : !avail
                          ? "var(--color-background-tertiary)"
                          : "var(--color-background-primary)",
                      color: selected
                        ? "#2d6a4f"
                        : !avail
                          ? "var(--color-text-tertiary)"
                          : "var(--color-text-primary)",
                      fontSize: 13,
                      fontWeight: selected ? 600 : 400,
                      cursor: avail ? "pointer" : "not-allowed",
                      transition: "all .15s",
                      textAlign: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                    {!avail && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-tertiary)",
                          marginTop: 2,
                        }}
                      >
                        {lang === "es" ? "No disponible" : "Unavailable"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Pax stepper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <span
            style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
          >
            {t.field_pax}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() =>
                onSlotChange(
                  item.cartId,
                  undefined,
                  Math.max(item.exp.minPax, pax - 1),
                )
              }
              disabled={pax <= item.exp.minPax}
              style={{
                padding: "5px 10px",
                background: "var(--color-background-primary)",
                border: "none",
                cursor: pax > item.exp.minPax ? "pointer" : "default",
                fontSize: 15,
                color:
                  pax > item.exp.minPax
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                lineHeight: 1,
              }}
            >
              −
            </button>
            <span
              style={{
                padding: "5px 12px",
                fontSize: 13,
                fontWeight: 500,
                borderLeft: "0.5px solid var(--color-border-tertiary)",
                borderRight: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                minWidth: 28,
                textAlign: "center",
              }}
            >
              {pax}
            </span>
            <button
              onClick={() =>
                onSlotChange(
                  item.cartId,
                  undefined,
                  Math.min(item.exp.maxPax, pax + 1),
                )
              }
              disabled={pax >= item.exp.maxPax}
              style={{
                padding: "5px 10px",
                background: "var(--color-background-primary)",
                border: "none",
                cursor: pax < item.exp.maxPax ? "pointer" : "default",
                fontSize: 15,
                color:
                  pax < item.exp.maxPax
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Hint / conflict message */}
        {conflictLabel && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: isConflict ? "#c0392b" : "var(--color-text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isConflict ? "⚠️" : "ℹ️"} {conflictLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export default CartItem;
