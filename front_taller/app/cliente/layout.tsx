import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi cuenta — Moto Taller Familiar",
  description: "Regístrate o inicia sesión para ver el estado de tus citas.",
};

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
