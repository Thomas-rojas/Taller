import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresa o regístrate | Moto Taller Familiar",
  description: "Gestión de recepción, entrega y calendario del taller",
};

export default function MecanicoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
