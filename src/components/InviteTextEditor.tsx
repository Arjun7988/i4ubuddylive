// src/components/InviteTextEditor.tsx
import React, { useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from "react";
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

export interface InviteTextEditorRef {
  exportAsImage: () => Promise<Blob | null>;
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

export const InviteTextEditor = forwardRef<InviteTextEditorRef, Props>(({
  template,
  eventValues,
  value,
  onChange,
}, ref) => {
  const [local, setLocal] = useState<InviteTextValues>({});
  const previewRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    exportAsImage: async () => {
      if (!previewRef.current) return null;

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const previewElement = previewRef.current;
        const rect = previewElement.getBoundingClientRect();

        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        const img = new Image();
        img.crossOrigin = 'anonymous';

        return new Promise<Blob | null>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);

            // Draw each text field from local state
            fields.forEach((f) => {
              const item = local[f.key];
              if (!item) return;
              const { text, style } = item;

              // Convert percentage to pixel positions
              const x = ((style.x ?? DEFAULT_STYLE.x) / 100) * rect.width;
              const y = ((style.y ?? DEFAULT_STYLE.y) / 100) * rect.height;

              ctx.fillStyle = style.color || '#ffffff';
              ctx.textAlign = 'center';
              ctx.shadowColor = 'rgba(0,0,0,0.6)';
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 1;

              const fontWeight = style.fontWeight || 'bold';
              const fontSize = `${style.fontSize || 26}px`;
              const fontFamily = style.fontFamily || 'Inter';
              const fontStyle = style.fontStyle || 'normal';

              ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;

              const lines = (text || f.label).split('\n');
              const lineHeight = parseFloat(fontSize) * 1.2;
              lines.forEach((line, i) => {
                ctx.fillText(line, x, y + (i * lineHeight));
              });
            });

            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png');
          };

          img.onerror = () => resolve(null);
          img.src = template.thumbnail_url || template.image_url;
        });
      } catch (error) {
        console.error('Error exporting image:', error);
        return null;
      }
    },
  }));

  // Read editable_fields (array or JSON string) or provide defaults
  const fields: EditableFieldConfig[] = useMemo(() => {
    const raw = (template as any).editable_fields;

    // If template has configured fields, use them
    if (raw) {
      if (Array.isArray(raw)) return raw as EditableFieldConfig[];
      try {
        const parsed = JSON.parse(raw as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as EditableFieldConfig[];
        }
      } catch {
        // Fall through to defaults
      }
    }

    // Otherwise, provide default fields with automatic binding
    return [
      {
        key: 'title',
        label: 'Event Title',
        bindTo: 'title',
        x: 50,
        y: 15,
        fontSize: 32,
        color: '#FFFFFF',
      },
      {
        key: 'datetime',
        label: 'Date & Time',
        bindTo: 'event_datetime',
        x: 50,
        y: 35,
        fontSize: 20,
        color: '#FFFFFF',
      },
      {
        key: 'location',
        label: 'Location',
        bindTo: 'location',
        x: 50,
        y: 50,
        fontSize: 18,
        color: '#FFFFFF',
      },
      {
        key: 'extra_message',
        label: 'Additional Message',
        bindTo: 'extra_message',
        x: 50,
        y: 70,
        fontSize: 16,
        color: '#FFFFFF',
      },
    ];
  }, [template]);

  // Initialize local state from template + eventValues + saved value
  const initializedRef = useRef(false);

  useEffect(() => {
    // Reset initialized flag when template changes
    initializedRef.current = false;
  }, [template]);

  // Initial setup - only runs once per template
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

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
    initializedRef.current = true;
  }, [fields, value, eventValues]);

  // Update bound text when eventValues change (but preserve styles)
  useEffect(() => {
    if (!initializedRef.current) return;

    setLocal((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      fields.forEach((f) => {
        if (f.bindTo && eventValues[f.bindTo]) {
          const newText = eventValues[f.bindTo];
          if (updated[f.key] && updated[f.key].text !== newText) {
            updated[f.key] = {
              ...updated[f.key],
              text: newText,
            };
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        onChange(updated);
        return updated;
      }
      return prev;
    });
  }, [eventValues, fields, onChange]);

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
    setLocal((prev) => {
      const curr = prev[key];
      if (!curr) return prev;

      const updated = {
        ...curr,
        style: {
          ...curr.style,
          ...patch,
        },
      };

      const merged = { ...prev, [key]: updated };
      onChange(merged);
      return merged;
    });
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
                  <select
                    className="w-full px-2 py-1.5 rounded-md bg-black/40 border border-border text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={style.fontSize}
                    onChange={(e) =>
                      changeStyle(f.key, { fontSize: Number(e.target.value) })
                    }
                  >
                    {[8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
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

              {/* Color picker only */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">
                  Text Color
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={style.color}
                    onChange={(e) =>
                      changeStyle(f.key, { color: e.target.value })
                    }
                    className="w-12 h-12 rounded-md border-2 border-border cursor-pointer"
                    title="Choose text color"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-300 font-mono">{style.color}</div>
                    <div className="text-[10px] text-gray-500">Click to change color</div>
                  </div>
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
        <div ref={previewRef} className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-border bg-black">
          <img
            src={template.thumbnail_url || template.image_url}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {fields.map((f) => {
            const item = local[f.key];
            if (!item) return null;
            const { text, style } = item;

            // Get container dimensions for percentage conversion
            const container = previewRef.current;
            if (!container) return null;

            const rect = container.getBoundingClientRect();
            const xPercent = style.x ?? DEFAULT_STYLE.x;
            const yPercent = style.y ?? DEFAULT_STYLE.y;
            const posX = (xPercent / 100) * rect.width;
            const posY = (yPercent / 100) * rect.height;

            return (
              <Rnd
                key={f.key}
                bounds="parent"
                enableResizing={false}
                position={{ x: posX, y: posY }}
                onDrag={(e, d) => {
                  // Update position during drag for smooth movement
                  const container = previewRef.current;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const xPercent = (d.x / rect.width) * 100;
                  const yPercent = (d.y / rect.height) * 100;

                  setLocal((prev) => {
                    const curr = prev[f.key];
                    if (!curr) return prev;
                    return {
                      ...prev,
                      [f.key]: {
                        ...curr,
                        style: {
                          ...curr.style,
                          x: xPercent,
                          y: yPercent,
                        },
                      },
                    };
                  });
                }}
                onDragStop={(e, d) => {
                  const container = previewRef.current;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const xPercent = (d.x / rect.width) * 100;
                  const yPercent = (d.y / rect.height) * 100;
                  changeStyle(f.key, { x: xPercent, y: yPercent });
                }}
              >
                <div
                  data-text-field
                  style={{
                    fontFamily: style.fontFamily,
                    fontSize: `${style.fontSize}px`,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    color: style.color,
                    whiteSpace: "pre-wrap",
                    textAlign: "center",
                    textShadow:
                      "0 1px 2px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.4)",
                    padding: "2px 6px",
                    cursor: "move",
                    minWidth: "100px",
                    transform: "translateX(-50%)",
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
});
