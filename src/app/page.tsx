// ============================================================================
// ElectroVoltio - Main Application Page
// ============================================================================

"use client";

import dynamic from "next/dynamic";

const ElectroVoltioApp = dynamic(() => import("@/components/App"), { ssr: false });

export default function Home() {
  return <ElectroVoltioApp />;
}
