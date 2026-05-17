import { useState } from "react";
import Image from "next/image";
import { MiniCalendar } from "./MiniCalendar";
import { formatCLP } from "../constants/formatters";
import { getDateAvailability } from "../lib/booking/availability";
import { MIN_DATE } from "../constants/dates";

function ExperienceCard({ exp, lang, t, onAdd, cartItems, isMobile = false }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(MIN_DATE);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pax, setPax] = useState(Math.max(1, exp.minPax));

  const cartCount = cartItems.filter(
    (c) => c.exp?.id === exp.id || c.id === exp.id,
  ).length;
  const inCart = cartCount > 0;
  const isUnavailable = exp.available === false;

  const badgeLabel = [
    exp.type === "full"
      ? (lang === "es" ? "DÍA COMPLETO" : "FULL DAY")
      : (lang === "es" ? "MEDIO DÍA" : "HALF DAY"),
    (t[`diff_${exp.difficulty}`] || exp.difficulty).toUpperCase(),
  ].join(" · ");

  const gradientOverlay = inCart
    ? "linear-gradient(to bottom, rgba(3,3,3,0) 0%, rgba(12,70,41,0.82) 100%)"
    : "linear-gradient(to bottom, rgba(3,3,3,0) 0%, rgba(0,0,0,0.88) 100%)";

  const slotAvail = selectedDate
    ? getDateAvailability({ exp, date: selectedDate, cart: cartItems })
    : { AM: true, PM: true, FULL: true };

  const openModal = () => {
    if (isUnavailable) return;
    setSelectedDate(MIN_DATE);
    setSelectedSlot(null);
    setPax(Math.max(1, exp.minPax));
    setShowModal(true);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedSlot) {
      const avail = getDateAvailability({ exp, date, cart: cartItems });
      if (!avail[selectedSlot]) setSelectedSlot(null);
    }
  };

  const handleAdd = () => {
    // For full-day experiences slot is always FULL; for half-day it's AM/PM/null
    const slot = exp.type === "full" ? "FULL" : selectedSlot;
    onAdd(exp, selectedDate, slot, pax);
    setShowModal(false);
  };

  return (
    <>
      {/* Card */}
      <div
        onClick={openModal}
        style={{
          borderRadius: 30,
          overflow: "hidden",
          position: "relative",
          height: 420,
          cursor: isUnavailable ? "default" : "pointer",
          boxShadow: "3px 3px 15.8px 4px rgba(0,0,0,0.25)",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isUnavailable) e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
        }}
      >
        {exp.image && (
          <Image
            src={exp.image}
            alt={exp.name[lang]}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: gradientOverlay }} />

        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: inCart ? "#0c4629" : "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.32)",
            borderRadius: 50,
            padding: "4px 12px",
            fontSize: 11,
            fontFamily: "var(--font-jetbrains-mono)",
            fontWeight: 300,
            color: "#fff",
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
        >
          {badgeLabel}
        </div>

        {cartCount > 1 && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "#1ad477",
              color: "#0c4629",
              borderRadius: 50,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ×{cartCount}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 24px 28px",
          }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 24,
              fontWeight: 500,
              color: "#fff",
              letterSpacing: -0.96,
              textTransform: "uppercase",
              fontFamily: "var(--font-jetbrains-mono)",
              lineHeight: 1.2,
            }}
          >
            {exp.name[lang]}
          </h3>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {exp.desc[lang]}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 18 }}>
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-inter)" }}>
              {formatCLP(exp.price)}
            </span>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 300, fontFamily: "var(--font-inter)" }}>
              {t.per_person}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); openModal(); }}
            disabled={isUnavailable}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 23.5,
              border: "#ffffff6a 1.5px solid",
              background: inCart ? "#1ad477" : "",
              color: inCart ? "#0c4629" : "#fff",
              fontFamily: "var(--font-jetbrains-mono)",
              fontWeight: inCart ? 700 : 300,
              fontSize: 14,
              textTransform: "uppercase",
              cursor: isUnavailable ? "not-allowed" : "pointer",
              boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
              letterSpacing: 0.5,
              transition: "background .15s",
            }}
          >
            {isUnavailable
              ? t.unavailable
              : inCart
                ? `✓ ${lang === "es" ? "SELECCIONADO" : "SELECTED"}`
                : lang === "es" ? "AGREGAR" : "ADD"}
          </button>
        </div>
      </div>

      {/* Booking modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: isMobile ? "24px 20px" : "32px 36px",
              maxWidth: 640,
              width: "100%",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 24,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: -0.96,
                  color: "#1e1e1e",
                }}
              >
                {exp.name[lang]}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                  color: "#1e1e1e",
                  fontSize: 20,
                  flexShrink: 0,
                  marginLeft: 12,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Two-column: calendar + details */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 20 }}>
              <MiniCalendar
                value={selectedDate}
                onChange={handleDateChange}
                lang={lang}
                highlightedDates={[...new Set(cartItems.map((c) => c.date).filter(Boolean))]}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Pax stepper */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 12,
                      color: "#000",
                      letterSpacing: 0.5,
                    }}
                  >
                    {lang === "es" ? "PASAJEROS" : "PASSENGERS"}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid rgba(0,0,0,0.5)",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setPax((p) => Math.max(exp.minPax, p - 1))}
                      disabled={pax <= exp.minPax}
                      style={{
                        padding: "4px 8px",
                        background: "none",
                        border: "none",
                        cursor: pax > exp.minPax ? "pointer" : "default",
                        fontSize: 15,
                        color: pax > exp.minPax ? "#000" : "#bbb",
                        lineHeight: 1,
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        padding: "4px 10px",
                        fontSize: 13,
                        fontWeight: 500,
                        borderLeft: "1px solid rgba(0,0,0,0.15)",
                        borderRight: "1px solid rgba(0,0,0,0.15)",
                        minWidth: 28,
                        textAlign: "center",
                      }}
                    >
                      {pax}
                    </span>
                    <button
                      onClick={() => setPax((p) => Math.min(exp.maxPax, p + 1))}
                      disabled={pax >= exp.maxPax}
                      style={{
                        padding: "4px 8px",
                        background: "none",
                        border: "none",
                        cursor: pax < exp.maxPax ? "pointer" : "default",
                        fontSize: 15,
                        color: pax < exp.maxPax ? "#000" : "#bbb",
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 300,
                    color: "#1e1e1e",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {exp.desc[lang]}
                </p>

                {/* Includes */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#1e1e1e",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{t.includes}: </span>
                  {exp.includes[lang]}
                </p>
              </div>
            </div>

            {/* Conflict warning */}
            {(() => {
              if (!selectedDate) return null;
              const blocked =
                exp.type === "full"
                  ? !slotAvail.FULL
                  : !slotAvail.AM && !slotAvail.PM;
              if (!blocked) return null;
              return (
                <p
                  style={{
                    margin: "0 0 16px",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#fff1f1",
                    border: "1px solid #f5c2c2",
                    color: "#c0392b",
                    fontSize: 13,
                    fontFamily: "var(--font-inter)",
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {t.conflict_full}
                </p>
              );
            })()}

            {/* MAÑANA / TARDE — half-day only */}
            {exp.type === "half" && (
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {[
                  { slot: "AM", label: lang === "es" ? "MAÑANA" : "MORNING", time: "8:00 - 13:00", avail: slotAvail.AM },
                  { slot: "PM", label: lang === "es" ? "TARDE" : "AFTERNOON", time: "14:00 - 19:00", avail: slotAvail.PM },
                ].map(({ slot, label, time, avail }) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => avail && setSelectedSlot(isSelected ? null : slot)}
                      disabled={!avail}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 21,
                        border: isSelected ? "1.5px solid #1e1e1e" : "1px solid rgba(0,0,0,0.3)",
                        background: isSelected ? "#1e1e1e" : !avail ? "#f5f5f5" : "#fff",
                        color: isSelected ? "#fff" : !avail ? "#bbb" : "#000",
                        cursor: avail ? "pointer" : "not-allowed",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 14,
                        fontWeight: isSelected ? 700 : 400,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        transition: "all .15s",
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 300 }}>{time}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* + AGREGAR */}
            {(() => {
              const canAdd = selectedDate && (exp.type === "full" ? slotAvail.FULL : !!selectedSlot);
              return (
                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 50,
                    border: "none",
                    background: canAdd ? "#1e1e1e" : "#e0e0e0",
                    color: canAdd ? "#fff" : "#aaa",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontWeight: 300,
                    fontSize: 20,
                    textTransform: "uppercase",
                    cursor: canAdd ? "pointer" : "not-allowed",
                    letterSpacing: 0.5,
                    transition: "background .15s, color .15s",
                  }}
                >
                  + {lang === "es" ? "AGREGAR" : "ADD"}
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default ExperienceCard;
