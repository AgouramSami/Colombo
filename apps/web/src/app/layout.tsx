import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Colombo - Gerez votre pigeonnier",
  description:
    "Colombo vous permet de gerer votre pigeonnier et de retrouver tous vos resultats de concours en un seul endroit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
