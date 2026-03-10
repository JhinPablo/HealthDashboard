import type { Metadata } from "next";
import { AuthProvider } from "../components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthDashboard",
  description: "Panel clinico interoperable con autenticacion por roles."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
