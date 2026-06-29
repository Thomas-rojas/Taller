import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar — Moto Taller Familiar",
  description: "Acceso para clientes y mecánicos del taller.",
};

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
