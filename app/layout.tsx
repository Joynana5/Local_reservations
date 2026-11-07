import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableNook | Find a table in Maple Bay",
  description: "Discover local restaurants and check table availability in Maple Bay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
