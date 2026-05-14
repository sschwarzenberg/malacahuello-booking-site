import { useState } from "react";
import { formatCLP } from "../constants/formatters";
import { LANG } from "../constants/LANG";

// Render a slot value (AM/PM/FULL/null) as a human-readable label.
function slotLabel(slot, t) {
  if (!slot) return "";
  if (slot === "AM") return t.slot_am;
  if (slot === "PM") return t.slot_pm;
  if (slot === "FULL") return t.slot_full;
  return slot;
}

export default function CheckoutFlow({ lang, cartItems, onBack, onConfirm }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [payMethod, setPayMethod] = useState("mp");
  const [confirmed, setConfirmed] = useState(false);
  const [ref] = useState(() => "MCH-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  const total = cartItems.reduce((s, c) => s + c.exp.price * (c.pax || 1), 0);
  const valid = form.name.trim() && form.email.includes("@") && form.phone.trim();

  const steps = [LANG[lang].step_info, LANG[lang].step_pay, LANG[lang].step_confirm];

  if (confirmed) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 500 }}>{LANG[lang].confirm_title}</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>{LANG[lang].confirm_sub}</p>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-tertiary)" }}>{LANG[lang].confirm_ref}</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: 2 }}>{ref}</p>
        </div>
        <div style={{ textAlign: "left", background: "var(--color-background-secondary)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          {cartItems.map(c => (
            <div key={c.cartId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <span>{c.exp.emoji} {c.exp.name[lang]} — {c.date}{c.slot ? ` (${slotLabel(c.slot, LANG[lang])})` : ""}</span>
              <span style={{ fontWeight: 500 }}>{formatCLP(c.exp.price * (c.pax || 1))}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, fontWeight: 500 }}>
            <span>{LANG[lang].total}</span><span>{formatCLP(total)}</span>
          </div>
        </div>
        <button onClick={onConfirm} style={{ padding: "12px 32px", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: 14 }}>
          {LANG[lang].confirm_back}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14, padding: "0 0 20px", display: "flex", alignItems: "center", gap: 6 }}>
        ← {LANG[lang].back}
      </button>

      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, paddingBottom: 10, textAlign: "center", fontSize: 13, fontWeight: step === i ? 500 : 400, color: step === i ? "var(--color-text-primary)" : "var(--color-text-tertiary)", borderBottom: step === i ? "2px solid var(--color-text-primary)" : "2px solid transparent", marginBottom: -1, transition: "all .2s" }}>
            {s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            [LANG[lang].field_name, "name", "text"],
            [LANG[lang].field_email, "email", "email"],
            [LANG[lang].field_phone, "phone", "tel"],
          ].map(([label, field, type]) => (
            <div key={field}>
              <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14 }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 5 }}>{LANG[lang].field_notes}</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, resize: "vertical" }}
            />
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>{LANG[lang].booking_summary}</p>
            {cartItems.map(c => (
              <div key={c.cartId} style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span>{c.exp.emoji} {c.exp.name[lang]} · {c.date}{c.slot ? ` (${slotLabel(c.slot, LANG[lang])})` : ""} · {c.pax || 1} {lang === "es" ? "pax" : "guests"}</span>
                <span>{formatCLP(c.exp.price * (c.pax || 1))}</span>
              </div>
            ))}
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 500, fontSize: 14 }}>
              <span>{LANG[lang].total}</span><span>{formatCLP(total)}</span>
            </div>
          </div>

          <button onClick={() => setStep(1)} disabled={!valid} style={{
            padding: "13px 0", borderRadius: 12, border: "none",
            background: valid ? "#1a1a1a" : "var(--color-background-tertiary)",
            color: valid ? "#fff" : "var(--color-text-tertiary)",
            fontWeight: 500, fontSize: 15, cursor: valid ? "pointer" : "not-allowed",
          }}>
            {LANG[lang].continue} →
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--color-text-secondary)" }}>{LANG[lang].pay_with}</p>
          {[
            { id: "mp", label: LANG[lang].pay_mp, icon: "💳", desc: lang === "es" ? "Tarjetas, débito, QR, efectivo" : "Cards, debit, QR, cash" },
            { id: "fintoc", label: LANG[lang].pay_fintoc, icon: "🏦", desc: lang === "es" ? "Transferencia directa desde tu banco" : "Direct bank transfer" },
          ].map(opt => (
            <div key={opt.id} onClick={() => setPayMethod(opt.id)} style={{
              border: payMethod === opt.id ? "2px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)",
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              background: payMethod === opt.id ? "var(--color-background-info)" : "var(--color-background-primary)",
              display: "flex", gap: 12, alignItems: "center", transition: "all .15s",
            }}>
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{opt.desc}</p>
              </div>
            </div>
          ))}
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>{LANG[lang].pay_disclaimer}</p>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setStep(0)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: 14 }}>
              ← {LANG[lang].back}
            </button>
            <button onClick={() => setConfirmed(true)} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "#1a1a1a", color: "#fff", fontWeight: 500, fontSize: 15, cursor: "pointer" }}>
              {formatCLP(total)} — {lang === "es" ? "Pagar" : "Pay"} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}