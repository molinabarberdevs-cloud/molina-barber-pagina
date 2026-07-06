/**
 * Formatea un string a un formato de RUT chileno (xx.xxx.xxx-x).
 * @param {string} value El valor del RUT a formatear.
 * @returns {string} El RUT formateado.
 */
export function formatRut(value) {
  let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}