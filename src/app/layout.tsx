// ============================================================================
// ElectroVoltio - Root Layout
// ============================================================================

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ElectroVoltio - Simulador de instalaciones eléctricas",
  description: "Simulador de instalaciones eléctricas de baja tensión con motor de simulación determinista",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
