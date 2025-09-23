import React, { useEffect, useRef, useState } from "react";

type Props = {
  id?: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  steps?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
  percentage?: boolean; // 👈 nuevo: activa validación 0–100
};

export const DecimalInput = ({
  id,
  value,
  onChange,
  min = 0,
  max,
  steps = 1000,
  required = false,
  placeholder,
  className,
  disabled = false,
  readOnly = false,
  onBlur,
  percentage = false, // por defecto no es porcentaje
}: Props) => {
  const ref = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");

  // Normaliza: quita espacios, convierte coma a punto, elimina duplicados de punto
  const normalize = (s: string | number | null | undefined) => {
    if (s === null || s === undefined) return "";
    const str = typeof s === "string" ? s : String(s);
    if (!str) return "";
    let v = str.replace(/\s+/g, "").replace(/,/g, ".");
    v = v.replace(/[^0-9.]/g, "");
    const i = v.indexOf(".");
    if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
    return v;
  };

  // Formatea para mostrar: miles con espacio, decimales con coma
  const format = (s: string) => {
    if (!s) return "";
    const [intPart, fracPart] = s.split(".");
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return fracPart !== undefined
      ? `${intFormatted},${fracPart}`
      : intFormatted;
  };

  useEffect(() => {
    let normalizedValue = "";
    if (value !== null && value !== undefined && value !== "") {
      let num = typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(num)) {
        // si es porcentaje, fuerza a rango 0–100
        if (percentage) {
          if (num < 0) num = 0;
          if (num > 100) num = 100;
        } else {
          if (min !== undefined && num < min) num = min;
          if (max !== undefined && num > max) num = max;
        }
        normalizedValue = String(num);
      }
    }
    setRaw(normalize(normalizedValue));
  }, [value, min, max, percentage]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const caret = el.selectionStart ?? el.value.length;

    const normalized = normalize(el.value);
    setRaw(normalized);

    // cuando es porcentaje, validamos antes de pasar onChange
    let num = parseFloat(normalized);
    if (percentage && !isNaN(num)) {
      if (num < 0) num = 0;
      if (num > 100) num = 100;
      onChange(String(num));
      setRaw(String(num));
    } else {
      onChange(normalized);
    }

    const newDisplay = format(normalized);

    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.value = newDisplay;

      const rawIndex = Math.min(normalized.length, caret);
      let pos = 0,
        seen = 0;
      for (let i = 0; i < newDisplay.length; i++) {
        if (newDisplay[i] !== " ") seen++;
        if (seen >= rawIndex) {
          pos = i + 1;
          break;
        }
      }
      ref.current.setSelectionRange(pos, pos);
    });
  };

  const handleBlur = () => {
    if (!raw) return;
    onBlur?.();
    let num = parseFloat(raw);
    if (!isNaN(num)) {
      if (percentage) {
        if (num < 0) num = 0;
        if (num > 100) num = 100;
      } else {
        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;
      }
      const normalized = String(num);
      setRaw(normalized);
      onChange(normalized);
    }
  };

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      step={steps}
      readOnly={readOnly}
      required={required}
      disabled={disabled}
      placeholder={placeholder || (percentage ? "0% - 100%" : "0.00")}
      className={`form-control text-muted ${className || ""}`}
      value={format(raw)}
      onInput={handleInput}
      onBlur={handleBlur}
    />
  );
};
