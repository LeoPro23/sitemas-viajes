import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Experto de Recomendación de Viajes",
  description:
    "Cuestionario inteligente que recomienda destinos y hoteles personalizados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
