import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Requisitos → UML",
  description: "Geração de diagramas UML a partir de requisitos em texto, usando LLMs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
