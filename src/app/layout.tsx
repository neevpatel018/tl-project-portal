import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Tinkerers' Lab | Project Portal", description: "Project registration, resource requests and inventory management." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
