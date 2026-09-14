// ============================================================================
// ElectroVoltio - Component Library (SVG Icons)
// ============================================================================

"use client";

import { createElement, useState } from "react";
import { useCircuitStore } from "@/store";
import { CATALOG_BY_CATEGORY, CATEGORY_LABELS } from "@/data/catalog";
import { getIconForType } from "@/components/icons";
import type { ElectricalComponentModel } from "@/engine/types";

export default function Library() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("source");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const setPlacingType = useCircuitStore((s) => s.setPlacingType);

  const categories = Object.keys(CATALOG_BY_CATEGORY);

  const filteredCatalog = Object.fromEntries(
    Object.entries(CATALOG_BY_CATEGORY)
      .filter(([cat]) => quickFilter === "all" || cat === quickFilter)
      .map(([cat, items]) => [
        cat,
        items.filter((item) =>
          !searchTerm ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.typeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
        ),
      ])
      .filter(([, items]) => items.length > 0)
  );

  return (
    <div
      className="w-64 border-r flex flex-col select-none shadow-sm z-10"
      style={{
        background: "var(--ev-surface)",
        borderColor: "var(--ev-border)",
      }}
    >
      {/* Header */}
      <div className="p-2.5 border-b space-y-2" style={{ borderColor: "var(--ev-border)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ev-text-secondary)" }}>
            Catálogo Eléctrico
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-medium border border-blue-200 dark:border-blue-800">
            REBT / IEC
          </span>
        </div>

        {/* Search input */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Buscar PIA, ID, motor, LED..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-xs rounded-md border outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
            style={{
              background: "var(--ev-bg)",
              borderColor: "var(--ev-border)",
              color: "var(--ev-text)",
            }}
          />
          <div className="absolute left-2 text-slate-400 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3.5 3.5" strokeLinecap="round" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick filter pills — wrap, no horizontal scroll */}
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {[
            { id: "all", label: "Todos" },
            { id: "residential", label: "Vivienda" },
            { id: "protection", label: "Protección" },
            { id: "instrument", label: "Medición" },
            { id: "source", label: "Fuentes" },
            { id: "load", label: "Cargas" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setQuickFilter(pill.id)}
              className={`px-1.5 py-1 rounded text-center transition-colors ${
                quickFilter === pill.id
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => {
          const items = filteredCatalog[category];
          if (!items || items.length === 0) return null;

          const isExpanded = searchTerm ? true : expandedCategory === category;

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-3 py-2 text-xs font-semibold text-left flex items-center gap-1.5 hover:opacity-80 transition-all"
                style={{
                  background: isExpanded ? "var(--ev-bg)" : "transparent",
                  color: "var(--ev-text)",
                  borderBottom: "1px solid var(--ev-border)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                  <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {CATEGORY_LABELS[category] || category}
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--ev-border)", color: "var(--ev-text-secondary)" }}
                >
                  {items.length}
                </span>
              </button>

              {isExpanded && (
                <div className="py-1">
                  {items.map((item: ElectricalComponentModel) => (
                    <ComponentItem key={item.typeId} item={item} onPlace={setPlacingType} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComponentItem({
  item,
  onPlace,
}: {
  item: ElectricalComponentModel;
  onPlace: (typeId: string) => void;
}) {
  return (
    <button
      onClick={() => onPlace(item.typeId)}
      className="w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 hover:opacity-80 transition-all"
      style={{ color: "var(--ev-text)" }}
      title={`${item.name} — Arrastrar al lienzo`}
    >
      <div className="flex-shrink-0" style={{ color: "var(--ev-text-secondary)" }}>
        {createElement(getIconForType(item.typeId), { size: 18 })}
      </div>
      <div className="flex-1 truncate">{item.name}</div>
      {item.ratedCurrent && (
        <span className="text-[10px] tabular-nums" style={{ color: "var(--ev-text-secondary)" }}>
          {item.ratedCurrent}A
        </span>
      )}
    </button>
  );
}
