// src/components/InviteTextEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import type { TemplateWithCategory } from "../types/templates";

export type EditableFieldConfig = {
  key: string;
  label: string;
  bindTo?: string | null;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
};

export type FieldStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
  x: number;
  y: number;
};

export type FieldValue = {
  text: string;
  style: FieldStyle;
};

export type InviteTextValues = Record<string, FieldValue>;

interface Props {
  template: TemplateWithCategory;
  /** raw event values: title, description, event_date_time, location, etc. */
  eventValues: Record<string, string | undefined>;
  /** stored per-event values from DB (template_custom_values jsonb) */
  value: InviteTextValues | null;
  onChange: (v: InviteTextValues) => void;
}

// ---- font list & colors ----
const FONT_FAMILIES = [
  "Inter, sans-serif",
  "Poppins, sans-serif",
  "Roboto, sans-serif",
  "Open Sans, sans-serif",
  "Montserrat, sans-serif",
  "Lora, serif",
  "Merriweather, serif",
  "Playfair Display, serif",
  "DM Serif Display, serif",
  "Dancing Script, cursive",
  "Pacifico, cursive",
  "Great Vibes, cursive",
];

const COLORS = [
  "#ffffff",
  "#000000",
  "#f97373",
  "#ff9800",
  "#ffeb3b",
  "#4caf50",
  "#2196f3",
  "#3f51b5",
  "#9c27b0",
  "#e91e63",
];

const DEFAULT_STYLE: FieldStyle = {
  fontFamily: FONT_FAMILIES[0],
  fontSize: 26,
  fontWeight: "bold",
  fontStyle: "normal",
  color: "#ffffff",
  x: 50,
  y: 60,
};

export const InviteTextEditor: React.FC<Props> = ({
  template,
  eventValues,
  value,
  onChange,
}) => {
  const [local, setLocal] = useState<InviteTextValues>({});

  // Read editable_fields (array or JSON string)
  const fields: EditableFieldConfig[] = useMemo(() => {
    const raw = (template as any).editable_fields;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as EditableFieldConfig[];
    try {
      const parsed = JSON.parse(raw as string);
      return Array.isArray(parsed) ? (parsed as EditableFieldConfig[]) : [];
    } catch {
      return [];
    }
  }, [template]);

  // Initialize local state from template + eventValues + saved value
  useEffect(() => {
    const next: InviteTextValues = {};

    fields.forEach((f) => {
      const existing = value?.[f.key];

      const initialText =
        existing?.text ??
        (f.bindTo && eventValues[f.bindTo]) ??
        "";

      const style: FieldStyle = {
        ...DEFAULT_STYLE,
        ...(existing?.style || {}),
        ...(f.x !== undefined ? { x: f.x } : {}),
        ...(f.y !== undefined ? { y: f.y } : {}),
        ...(f.fontSize ? { fontSize: f.fontSize } : {}),
        ...(f.color ? { color: f.color } : {}),
      };

      next[f.key] = {
        text: initialText,
        style,
      };
    });

    setLocal(next);
  }, [fields, value, eventValues]);

  const updateField = (key: string, data: Partial<FieldValue>) => {
    setLocal((prev) => {
      const curr =
        prev[key] ??
        ({
          text: "",
          style: { ...DEFAULT_STYLE },
        } as FieldValue);

      const updated: FieldValue = {
        text: data.text ?? curr.text,
        style: {
          ...curr.style,
          ...(data.style || {}),
        },
      };

      const merged = { ...prev, [key]: updated };
      onChange(merged); // push up so RSVPCreatePage can persist
      return merged;
    });
  };

  const changeText = (key: string, text: string) => {
    updateField(key, { text });
  };

  const changeStyle = (key: string, patch: Partial<FieldStyle>) => {
    updateField(key, { style: patch });
  };

  if (!template || fields.length === 0) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-surface border border-border/60 text-xs text-gray-400">
        No editable text fields configured for this template.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* LEFT: controls */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-100">
          Customize invite text &amp; style
        </h3>
        <p className="text-xs text-gray-400 mb-2">
          Edit each text block separately: content, font, size, bold, italic, color.
        </p>

        {fields.map((f) => {
          const item = local[f.key];
          if (!item) return null;
          const { text, style } = item;

          return (
            <div
              key={f.key}
              className="rounded-lg border border-border/70 bg-dark-200/60 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">
                  {f.label}
                </span>
                {f.bindTo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/30">
                    Auto from: {f.bindTo}
                  </span>
                )}
              </div>

              {/* Text input */}
              <textarea
                className="w-full px-2 py-1.5 rounded-md bg-black/40 border border-border text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                value={text}
                onChange={(e) => changeText(f.key, e.target.value)}
                placeholder={f.label}
              />

              {/* Font family + size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    Font
                  </label>
                  <select
                    className="w-full px-2 py-1.5 rounded-md bg-black/40 border border-border text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={style.fontFamily}
                    onChange={(e) =>
                      changeStyle(f.key, { fontFamily: e.target.value })
                    }
                  >
                    {FONT_FAMILIES.map((ff) => (
                      <option key={ff} value={ff}>
                        {ff.split(",")[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">
                    Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={64}
                      value={style.fontSize}
                      onChange={(e) =>
                        changeStyle(f.key, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-gray-300 text-xs w-8 text-right">
                      {style.fontSize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weight + italic */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeStyle(f.key, { fontWeight: "normal" })}
                  className={`px-2 py-1 rounded-md text-[11px] border ${
                    style.fontWeight === "normal"
                      ? "border-primary-500 bg-primary-500/20 text-primary-100"
                      : "border-border bg-black/40 text-gray-300"
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => changeStyle(f.key, { fontWeight: "bold" })}
                  className={`px-2 py-1 rounded-md text-[11px] border font-semibold ${
                    style.fontWeight === "bold"
                      ? "border-primary-500 bg-primary-500/20 text-primary-100"
                      : "border-border bg-black/40 text-gray-300"
                  }`}
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() =>
                    changeStyle(f.key, {
                      fontStyle:
                        style.fontStyle === "italic" ? "normal" : "italic",
                    })
                  }
                  className={`px-2 py-1 rounded-md text-[11px] border italic ${
                    style.fontStyle === "italic"
                      ? "border-primary-500 bg-primary-500/20 text-primary-100"
                      : "border-border bg-black/40 text-gray-300"
                  }`}
                >
                  Italic
                </button>
              </div>

              {/* Color palette only */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">
                  Text Color
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => changeStyle(f.key, { color: c })}
                      className={`w-6 h-6 rounded-md border transition-transform ${
                        c === style.color
                          ? "border-white scale-110"
                          : "border-border hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT: preview + drag */}
      <div>
        <h3 className="text-sm font-semibold text-gray-100 mb-2">
          Live invite preview (drag text blocks)
        </h3>
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border bg-black">
          <img
            src={template.thumbnail_url || template.image_url}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {fields.map((f) => {
            const item = local[f.key];
            if (!item) return null;
            const { text, style } = item;

            const startX = style.x ?? DEFAULT_STYLE.x;
            const startY = style.y ?? DEFAULT_STYLE.y;

            return (
              <Rnd
                key={f.key}
                bounds="parent"
                enableResizing={false}
                default={{
                  x: startX,
                  y: startY,
                  width: "auto",
                  height: "auto",
                }}
                onDragStop={(_, d) =>
                  changeStyle(f.key, { x: d.x, y: d.y })
                }
              >
                <div
                  style={{
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    color: style.color,
                    whiteSpace: "pre-wrap",
                    textAlign: "center",
                    textShadow:
                      "0 1px 2px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.4)",
                    padding: "2px 6px",
                    cursor: "move",
                  }}
                >
                  {text || f.label}
                </div>
              </Rnd>
            );
          })}
        </div>
      </div>
    </div>
  );
};
