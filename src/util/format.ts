// Centralized number formatting (TECH_ARCHITECTURE §6).
// All currency display goes through here. Currencies are break_infinity Decimals.

import Decimal from "break_infinity.js";

export type NotationMode = "scientific" | "suffix";

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];

/** Threshold below which we show plain/suffix numbers; above, switch to sci. */
const SUFFIX_LIMIT = new Decimal(1e33); // ~ end of the suffix table

export function format(value: Decimal, mode: NotationMode = "suffix"): string {
  if (value.lt(0)) return "-" + format(value.neg(), mode);
  if (value.lt(1000)) {
    // Small numbers: show with minimal decimals.
    const n = value.toNumber();
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  if (mode === "scientific" || value.gte(SUFFIX_LIMIT)) {
    return formatScientific(value);
  }
  return formatSuffix(value);
}

function formatScientific(value: Decimal): string {
  const exp = value.exponent;
  const mantissa = value.div(Decimal.pow(10, exp)).toNumber();
  return `${mantissa.toFixed(2)}e${exp}`;
}

function formatSuffix(value: Decimal): string {
  const exp = value.exponent;
  const group = Math.floor(exp / 3);
  const suffix = SUFFIXES[group];
  if (suffix === undefined) return formatScientific(value);
  const scaled = value.div(Decimal.pow(10, group * 3)).toNumber();
  return `${scaled.toFixed(2)}${suffix}`;
}
