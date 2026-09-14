// ============================================================================
// ElectroVoltio - SVG Icon Components
// Pure SVG icons for all electrical devices
// ============================================================================

"use client";

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const D = ({ size = 24, color = "currentColor", className }: IconProps) => ({ size, color, className });

// --- SOURCE -----------------------------------------------------------------

export function IconSource({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 5v14" stroke={color} strokeWidth="1.5" />
      <path d="M8 9l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="18" textAnchor="middle" fontSize="5" fill={color} fontWeight="bold">AC</text>
    </svg>
  );
}

export function IconSource3Ph({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M7 10C7 10 9 7 12 7C15 7 17 10 17 10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 14C7 14 9 17 12 17C15 17 17 14 17 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} opacity="0.3" />
    </svg>
  );
}

export function IconSourceDC({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M10 9v6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// --- PROTECTION --------------------------------------------------------------

export function IconMCB({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="3" width="10" height="18" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="9" y="5" width="6" height="3" rx="0.5" fill={color} opacity="0.2" />
      <path d="M12 10v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13l3 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1" fill={color} />
    </svg>
  );
}

export function IconRCD({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3.5" stroke={color} strokeWidth="1.2" />
      <path d="M10 10h4" stroke={color} strokeWidth="1" />
      <path d="M12 8v4" stroke={color} strokeWidth="1" />
      <rect x="9" y="16" width="2" height="2" rx="0.5" fill={color} opacity="0.3" />
      <rect x="13" y="16" width="2" height="2" rx="0.5" fill={color} opacity="0.3" />
    </svg>
  );
}

export function IconIGA({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M10 7h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 9v5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9 17h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFuse({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="8" width="12" height="8" rx="3" stroke={color} strokeWidth="1.5" />
      <path d="M4 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12h4" stroke={color} strokeWidth="1" strokeDasharray="1 1" />
    </svg>
  );
}

export function IconSPD({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="3" width="10" height="18" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M14 7l-3 5h4l-3 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMCCB({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="5" width="8" height="3" rx="0.5" fill={color} opacity="0.15" />
      <path d="M12 10v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 18h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSectionalizer({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="3" width="10" height="18" rx="1.5" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function IconAFDD({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 8c2-1 2 3 4 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 12c2-1 2 3 4 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <text x="12" y="18" textAnchor="middle" fontSize="4" fill={color}>AF</text>
    </svg>
  );
}

export function IconVoltageRelay({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="4" width="12" height="16" rx="1.5" stroke={color} strokeWidth="1.5" />
      <text x="12" y="10" textAnchor="middle" fontSize="5" fill={color} fontWeight="bold">V</text>
      <path d="M9 14h6" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M9 16h4" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// --- DISTRIBUTION ------------------------------------------------------------

export function IconDistributionBoard({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M3 8h18" stroke={color} strokeWidth="1" />
      <rect x="5" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="0.8" />
      <rect x="10" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="0.8" />
      <rect x="15" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="0.8" />
      <rect x="5" y="16" width="3" height="2" rx="0.5" stroke={color} strokeWidth="0.8" />
      <rect x="10" y="16" width="3" height="2" rx="0.5" stroke={color} strokeWidth="0.8" />
      <rect x="15" y="16" width="3" height="2" rx="0.5" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

export function IconTransformer({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="12" r="5" stroke={color} strokeWidth="1.2" />
      <circle cx="15" cy="12" r="5" stroke={color} strokeWidth="1.2" />
      <path d="M12 5v14" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M5 12h2" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M17 12h2" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// --- LOADS -------------------------------------------------------------------

export function IconLightBulb({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 21h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z" stroke={color} strokeWidth="1.5" />
      <path d="M12 3v2" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M7 6l1.5 1.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M17 6l-1.5 1.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function IconOutlet({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <circle cx="9.5" cy="10" r="1" fill={color} />
      <circle cx="14.5" cy="10" r="1" fill={color} />
      <path d="M12 14v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconMotor({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="11" textAnchor="middle" fontSize="6" fill={color} fontWeight="bold">M</text>
      <path d="M8 16l-2 2" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M16 16l2 2" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeater({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12h2l2-4 2 8 2-8 2 8 2-4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconOven({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="6" width="12" height="4" rx="1" stroke={color} strokeWidth="1" />
      <rect x="6" y="12" width="12" height="6" rx="1" stroke={color} strokeWidth="1" />
      <circle cx="10" cy="8" r="0.8" fill={color} />
      <circle cx="14" cy="8" r="0.8" fill={color} />
    </svg>
  );
}

export function IconWashingMachine({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="12" height="3" rx="0.5" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="14" r="2" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export function IconBoiler({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M9 8h6" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M10 11c1-1 1 2 2 1s1 2 2 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.5" stroke={color} strokeWidth="1" />
      <path d="M12 17v-1" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function IconAirConditioner({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="8" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M5 14v2" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M19 14v2" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M7 10h10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M7 12h10" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M9 17c0 0 1.5-2 3-2s3 2 3 2" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function IconExhaustFan({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <path d="M12 8c-2 0-4 2-3 4s3 3 3 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 16c2 0 4-2 3-4s-3-3-3-3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.3" />
    </svg>
  );
}

export function IconDishwasher({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="12" height="3" rx="0.5" stroke={color} strokeWidth="0.8" />
      <path d="M6 10h12" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="15" r="3" stroke={color} strokeWidth="1" />
      <path d="M10 15h4" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export function IconDryer({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="12" height="3" rx="0.5" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.2" />
      <path d="M10 13c1 1 3 1 4 0" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function IconEVCharger({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="4" width="8" height="16" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M14 8h3l2 3v5h-5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h4" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M8 13h4" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <circle cx="10" cy="16" r="0.8" fill={color} />
    </svg>
  );
}

export function IconRadiator({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="6" width="16" height="12" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M7 6v12" stroke={color} strokeWidth="1" />
      <path d="M10 6v12" stroke={color} strokeWidth="1" />
      <path d="M13 6v12" stroke={color} strokeWidth="1" />
      <path d="M16 6v12" stroke={color} strokeWidth="1" />
      <path d="M6 9h12" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M6 12h12" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M6 15h12" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function IconDoorbell({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3a6 6 0 0 0-6 6c0 3-1.5 5-1.5 5h15S18 12 18 9a6 6 0 0 0-6-6z" stroke={color} strokeWidth="1.5" />
      <path d="M10 18h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSmokeDetector({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1" />
      <circle cx="12" cy="12" r="1" fill={color} />
      <path d="M12 4v1" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M12 19v1" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M4 12h1" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M19 12h1" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function IconInductionHob({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="12" r="3" stroke={color} strokeWidth="1" />
      <circle cx="9" cy="12" r="1.5" stroke={color} strokeWidth="0.5" opacity="0.5" />
      <circle cx="16" cy="12" r="2.5" stroke={color} strokeWidth="1" />
      <circle cx="16" cy="12" r="1" stroke={color} strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function IconSwitch({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="7" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <circle cx="17" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 12h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// --- INSTRUMENTS -------------------------------------------------------------

export function IconVoltmeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">V</text>
    </svg>
  );
}

export function IconAmmeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="8" fill={color} fontWeight="bold">A</text>
    </svg>
  );
}

export function IconWattmeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="7" fill={color} fontWeight="bold">W</text>
    </svg>
  );
}

export function IconVarmeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="5" fill={color} fontWeight="bold">var</text>
    </svg>
  );
}

export function IconFrequencymeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="5.5" fill={color} fontWeight="bold">Hz</text>
    </svg>
  );
}

export function IconEnergyMeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="6" y="5" width="12" height="6" rx="1" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" />
      <text x="12" y="9.5" textAnchor="middle" fontSize="4" fill={color} fontWeight="bold" fontFamily="monospace">0042.8</text>
      <text x="12" y="15" textAnchor="middle" fontSize="3.5" fill={color} fontWeight="bold">kWh</text>
      <circle cx="9" cy="18" r="1" fill={color} />
      <circle cx="15" cy="18" r="1" fill={color} />
    </svg>
  );
}

export function IconNetworkAnalyzer({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="5" y="5" width="14" height="8" rx="1" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" />
      <path d="M7 9h2l1.5-2.5L12 11l1.5-2H17" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="17" textAnchor="middle" fontSize="3.5" fill={color} fontWeight="bold">ANALYZER</text>
    </svg>
  );
}

export function IconClampMeter({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="9" width="8" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="11" width="4" height="3" rx="0.5" fill={color} fillOpacity="0.15" />
      <circle cx="12" cy="17" r="1.5" fill={color} />
    </svg>
  );
}

export function IconEarthTester({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M12 6v6M8 12h8M9.5 14.5h5M11 17h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <text x="12" y="20" textAnchor="middle" fontSize="3" fill={color} fontWeight="bold">Ω TIERRA</text>
    </svg>
  );
}

export function IconOscilloscope({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="5" y="6" width="11" height="9" rx="1" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="0.8" />
      <path d="M6 10.5c1.5-3 2.5-3 4 0s2.5 3 4 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="8" r="1" fill={color} />
      <circle cx="18" cy="12" r="1" fill={color} />
      <circle cx="8" cy="17" r="1" stroke={color} strokeWidth="0.8" />
      <circle cx="13" cy="17" r="1" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

// --- PHOTOVOLTAIC & RENEWABLES -----------------------------------------------

export function IconSolarPanel({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="14" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M3 10h18" stroke={color} strokeWidth="0.8" />
      <path d="M3 14h18" stroke={color} strokeWidth="0.8" />
      <path d="M9 6v14" stroke={color} strokeWidth="0.8" />
      <path d="M15 6v14" stroke={color} strokeWidth="0.8" />
      <path d="M10 3l2 3 2-3" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDCMCB({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="3" width="10" height="18" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="9" y="5" width="6" height="3" rx="0.5" fill={color} opacity="0.2" />
      <path d="M12 10v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13l3 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <text x="12" y="20" textAnchor="middle" fontSize="3.5" fill={color}>DC</text>
    </svg>
  );
}

// --- CABLES / CONNECTIONS ----------------------------------------------------

export function IconCable({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="12" r="2" fill={color} />
      <circle cx="20" cy="12" r="2" fill={color} />
    </svg>
  );
}

// --- Icon registry -----------------------------------------------------------

const iconRegistry: Record<string, React.FC<IconProps>> = {
  // Sources
  source_single_230v: IconSource,
  source_three_400v: IconSource3Ph,
  source_dc_48v: IconSourceDC,

  // MCBs
  mcb_b_10a_1p: IconMCB, mcb_b_16a_1p: IconMCB, mcb_b_20a_1p: IconMCB,
  mcb_b_25a_1p: IconMCB, mcb_b_32a_1p: IconMCB,
  mcb_c_16a_1p: IconMCB, mcb_c_20a_1p: IconMCB, mcb_c_25a_1p: IconMCB,
  mcb_c_32a_1p: IconMCB, mcb_c_40a_1p: IconMCB,
  mcb_d_16a_1p: IconMCB, mcb_d_20a_1p: IconMCB, mcb_d_32a_1p: IconMCB,
  mcb_c_16a_2p: IconMCB, mcb_c_20a_2p: IconMCB, mcb_c_32a_2p: IconMCB,
  mcb_c_16a_3p: IconMCB, mcb_c_20a_3p: IconMCB, mcb_c_32a_3p: IconMCB, mcb_c_40a_3p: IconMCB,

  // RCDs
  rcd_ac_30ma_2p: IconRCD, rcd_a_30ma_2p: IconRCD, rcd_f_30ma_2p: IconRCD,
  rcd_b_30ma_2p: IconRCD, rcd_s_300ma_2p: IconRCD, rcd_ac_30ma_4p: IconRCD,
  rcd_a_30ma_4p: IconRCD, rcd_b_30ma_4p: IconRCD, rcd_super_30ma_2p: IconRCD,
  rcd_reset_30ma_2p: IconRCD,

  // IGA, ICP
  iga_40a_2p: IconIGA, iga_63a_4p: IconIGA, icp_40a_2p: IconIGA,

  // MCCB, ACB
  mccb_100a_3p: IconMCCB, acb_400a_3p: IconMCCB,

  // Fuses
  fuse_gg_16a: IconFuse, fuse_gg_25a: IconFuse, fuse_gg_32a: IconFuse,
  fuse_gg_63a: IconFuse, fuse_am_10a: IconFuse, fuse_gpv_15a: IconFuse,

  // SPD
  spd_t2_2p: IconSPD,

  // Sectionalizer
  sectionalizer_2p: IconSectionalizer,

  // Distribution
  dist_board_6way: IconDistributionBoard,

  // Loads (existing)
  load_resistive_500w: IconLightBulb,
  load_resistive_1000w: IconHeater,
  load_resistive_2300w: IconHeater,
  load_motor_3kw: IconMotor,
  load_cap_800w: IconMotor,

  // Transformer
  transformer_230_400_5kva: IconTransformer,

  // Instruments
  voltmeter: IconVoltmeter,
  ammeter: IconAmmeter,
  wattmeter: IconWattmeter,
  varmeter: IconVarmeter,
  frequencymeter: IconFrequencymeter,
  energy_meter: IconEnergyMeter,
  network_analyzer_1p: IconNetworkAnalyzer,
  network_analyzer_3p: IconNetworkAnalyzer,
  clamp_meter: IconClampMeter,
  earth_tester: IconEarthTester,
  oscilloscope: IconOscilloscope,

  // PV
  pv_panel_400w: IconSolarPanel,
  dcmcb_16a: IconDCMCB,

  // EV
  ev_charger_7kw: IconEVCharger,

  // AFDD
  afdd_16a: IconAFDD,

  // Voltage relay
  voltage_relay_2p: IconVoltageRelay,

  // Residential loads
  load_light_100w: IconLightBulb,
  load_light_led_12w: IconLightBulb,
  load_light_fluorescent_36w: IconLightBulb,
  load_outlet_16a: IconOutlet,
  load_outlet_32a: IconOutlet,
  load_outlet_schuko: IconOutlet,
  load_boiler_2000w: IconBoiler,
  load_boiler_3000w: IconBoiler,
  load_oven_3000w: IconOven,
  load_induction_hob_7200w: IconInductionHob,
  load_washing_machine_2200w: IconWashingMachine,
  load_dishwasher_2000w: IconDishwasher,
  load_dryer_2500w: IconDryer,
  load_ac_3500w: IconAirConditioner,
  load_ac_5000w: IconAirConditioner,
  load_radiator_2000w: IconRadiator,
  load_exhaust_fan_60w: IconExhaustFan,
  load_doorbell: IconDoorbell,
  load_smoke_detector: IconSmokeDetector,
  load_resistive_2000w: IconHeater,
  load_iron_2200w: IconHeater,
  load_fridge_150w: IconMotor,

  // Residential controls (shared icons)
  sw_simple: IconSwitch, sw_bipolar: IconSwitch, sw_double: IconSwitch, sw_triple: IconSwitch,
  sw_conmutador: IconSwitch, sw_conmutador_doble: IconSwitch, sw_conmutador_triple: IconSwitch,
  sw_cruzamiento: IconSwitch, sw_cruzamiento_doble: IconSwitch, sw_persiana: IconSwitch,
  sw_toldo: IconSwitch, sw_selector_man_auto: IconSwitch, sw_llave: IconSwitch,
  sw_tirador: IconSwitch, sw_pedal: IconSwitch, sw_fin_carrera: IconSwitch,
  sw_magnetico: IconSwitch, sw_flotador: IconSwitch, sw_inteligente: IconSwitch,
  sw_wifi: IconSwitch, sw_inteligente_doble: IconSwitch, sw_conmutador_inteligente: IconSwitch,
  pb_no: IconSwitch, pb_nc: IconSwitch, pb_timbre: IconDoorbell, pb_luminoso: IconSwitch,
  pb_doble: IconSwitch, pb_piloto: IconSwitch, pb_temporizado: IconSwitch, pb_persiana: IconSwitch,
  pb_apertura_puerta: IconSwitch, pb_inteligente: IconSwitch,
  dimmer: IconSwitch, dimmer_push: IconSwitch, dimmer_smart: IconSwitch,
  sw_crepuscular: IconSwitch, sw_horario: IconSwitch, timer_escalera: IconSwitch,
  pir_motion: IconSmokeDetector, presence_sensor: IconSmokeDetector,
  relay_impulse: IconVoltageRelay, relay_timed: IconVoltageRelay,
  shutter_comm: IconSwitch, shutter_motor_ctrl: IconSwitch, shutter_smart: IconSwitch,
  motion_smart: IconSmokeDetector, door_window_sensor: IconSwitch,
  thermostat: IconSwitch, thermostat_smart: IconSwitch,
  doorbell_unit: IconDoorbell, buzzer: IconDoorbell, bell_campana: IconDoorbell,
  door_phone: IconDoorbell, video_door_phone: IconDoorbell, electric_lock: IconSwitch,
  socket_simple: IconOutlet, socket_double: IconOutlet, socket_with_switch: IconOutlet,
  socket_protected: IconOutlet, socket_ip44: IconOutlet, socket_usb_a: IconOutlet,
  socket_usb_c: IconOutlet, socket_usb_ac: IconOutlet, outlet_tv: IconOutlet,
  outlet_radio: IconOutlet, outlet_rj45: IconOutlet, outlet_rj11: IconOutlet,
  outlet_hdmi: IconOutlet, outlet_coax: IconOutlet,
  lamp_ceiling: IconLightBulb, lamp_wall: IconLightBulb, wall_sconce: IconLightBulb,
  lamp_holder: IconLightBulb, bulb_led: IconLightBulb, bulb_halogen: IconLightBulb,
  downlight_led: IconLightBulb, panel_led: IconLightBulb, strip_led: IconLightBulb,
  emergency_light: IconLightBulb, ceiling_fan: IconExhaustFan, bath_extractor: IconExhaustFan,
  motor_electric: IconMotor, load_timer: IconSwitch,
};

export function getIconForType(typeId: string): React.FC<IconProps> {
  return iconRegistry[typeId] || IconMCB;
}

export { iconRegistry };
