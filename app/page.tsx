"use client";
import { useState, useEffect } from "react";
import { LANG } from "./constants/LANG";
import { EXPERIENCES } from "./constants/EXPERIENCES";
import BookingSidebar from "./components/BookingSidebar";
import CheckoutFlow from "./components/CheckoutFlow";
import ExperienceCard from "./components/ExperienceCard";
import { checkAvailability, defaultSlotFor, newCartId } from "./lib/booking/availability";
import type { CartItem, Experience, Slot } from "./lib/booking/types";

export default function App() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [filter, setFilter] = useState<"all" | "full" | "half">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<"catalog" | "checkout">("catalog");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = LANG[lang];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const filtered = (EXPERIENCES as Experience[]).filter(
    (e) => filter === "all" || e.type === filter,
  );

  const addToCart = (exp: Experience, date?: string, slot?: Slot | null, pax?: number) => {
    setCart((prev) => {
      const resolvedSlot = slot !== undefined ? slot : defaultSlotFor(exp);
      const { ok } = checkAvailability({
        exp,
        date: date ?? "",
        slot: resolvedSlot,
        pax: pax ?? Math.max(1, exp.minPax),
        cart: prev,
      });
      if (!ok) return prev;
      return [
        ...prev,
        {
          cartId: newCartId(),
          exp,
          date: date ?? "",
          slot: resolvedSlot,
          pax: pax ?? Math.max(1, exp.minPax),
        },
      ];
    });
  };

  const removeFromCart = (cartId: string) =>
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));

  return (
    <div
      style={{
        fontFamily: "var(--font-inter)",
        color: "var(--color-text-primary)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "14px 16px" : "18px 40px",
          background: "#fff",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontWeight: 300,
            fontSize: 14,
            color: "#1c1c1a",
            letterSpacing: 0,
          }}
        >
          Surreal Adventour
        </span>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {view === "checkout" && (
            <button
              onClick={() => setView("catalog")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                fontSize: 14,
                fontFamily: "var(--font-inter)",
              }}
            >
              ← {lang === "es" ? "Volver" : "Back"}
            </button>
          )}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--color-background-secondary)",
              borderRadius: 20,
              padding: 3,
            }}
          >
            {["es", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l as "es" | "en")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: lang === l ? 500 : 400,
                  fontFamily: "var(--font-jetbrains-mono)",
                  background: lang === l ? "#fff" : "transparent",
                  border:
                    lang === l
                      ? "0.5px solid var(--color-border-secondary)"
                      : "none",
                  cursor: "pointer",
                  color: "var(--color-text-primary)",
                  transition: "all .15s",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Catalog View */}
      {view === "catalog" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(0, 420px)",
              gap: 0,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Left: catalog */}
            <div style={{ padding: isMobile ? "24px 16px 120px" : "44px 44px 64px", overflowY: "auto", boxSizing: "border-box" }}>
              {/* Heading row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 40,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 24 : 32,
                    fontWeight: 400,
                    fontFamily: "var(--font-jetbrains-mono)",
                    textTransform: "uppercase",
                    color: "#000",
                    letterSpacing: 0,
                  }}
                >
                  {lang === "es" ? "Experiencias" : "Experiences"}
                </h1>

                {/* Filter pills */}
                <div
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    background: "var(--color-background-secondary)",
                    borderRadius: 50,
                    padding: "4px 6px",
                  }}
                >
                  {[
                    ["all", t.filter_all],
                    ["full", t.filter_full],
                    ["half", t.filter_half],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() =>
                        setFilter(val as "all" | "full" | "half")
                      }
                      style={{
                        padding: "6px 16px",
                        borderRadius: 50,
                        fontSize: 12,
                        fontWeight: filter === val ? 500 : 400,
                        fontFamily: "var(--font-jetbrains-mono)",
                        background:
                          filter === val ? "#1e1e1e" : "transparent",
                        color:
                          filter === val
                            ? "#fff"
                            : "var(--color-text-secondary)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all .15s",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 28,
                }}
              >
                {filtered.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    exp={exp}
                    lang={lang}
                    t={t}
                    onAdd={addToCart}
                    cartItems={cart}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>

            {/* Right: itinerary sidebar (desktop only) */}
            {!isMobile && (
              <div
                style={{
                  borderLeft: "0.5px solid var(--color-border-tertiary)",
                  padding: "44px 28px",
                  background: "#fff",
                  height: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <BookingSidebar
                  lang={lang}
                  t={t}
                  cartItems={cart}
                  onRemove={removeFromCart}
                  onCheckout={() => setView("checkout")}
                />
              </div>
            )}
          </div>

          {/* Mobile: bottom sheet + trigger bar */}
          {isMobile && (
            <>
              <BookingSidebar
                lang={lang}
                t={t}
                cartItems={cart}
                onRemove={removeFromCart}
                onCheckout={() => {
                  setSidebarOpen(false);
                  setView("checkout");
                }}
                bottomSheet
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />

              {/* Sticky trigger bar */}
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  padding: "12px 16px env(safe-area-inset-bottom, 0px)",
                  background: "#fff",
                  borderTop: "0.5px solid var(--color-border-tertiary)",
                }}
              >
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    borderRadius: 50,
                    border: "none",
                    background: cart.length ? "#1e1e1e" : "var(--color-background-secondary)",
                    color: cart.length ? "#fff" : "var(--color-text-secondary)",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background .2s, color .2s",
                  }}
                >
                  {lang === "es" ? "MI ITINERARIO" : "MY ITINERARY"}
                  {cart.length > 0 && (
                    <span
                      style={{
                        background: "#1ad477",
                        color: "#0c4629",
                        borderRadius: 50,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Checkout View */}
      {view === "checkout" && (
        <div style={{ padding: isMobile ? "16px 16px 32px" : "24px 32px", flex: 1, overflowY: "auto", boxSizing: "border-box" }}>
          <CheckoutFlow
            lang={lang}
            cartItems={cart}
            onBack={() => setView("catalog")}
            onConfirm={() => {
              setCart([]);
              setView("catalog");
            }}
          />
        </div>
      )}
    </div>
  );
}
