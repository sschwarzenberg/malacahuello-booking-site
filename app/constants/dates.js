export const today = new Date();
export const fmt = (d) => d.toISOString().split("T")[0];
export const addDays = (d, n) => { 
  const r = new Date(d); 
  r.setDate(r.getDate() + n); 
  return r; 
};
export const MIN_DATE = fmt(addDays(today, 1));
export const MAX_DATE = fmt(addDays(today, 90));