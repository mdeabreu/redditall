import type { Metadata } from "next";
import "./globals.css";

const themeScript = `
(() => {
  try {
    const storedPreference = window.localStorage.getItem("redditall:theme");
    const preference = storedPreference === "light" || storedPreference === "dark" ? storedPreference : "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = preference === "dark" || (preference === "system" && prefersDark) ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    const fallbackTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = fallbackTheme;
    document.documentElement.style.colorScheme = fallbackTheme;
  }
})();
`;

export const metadata: Metadata = {
  title: "ReddItAll",
  description: "A calm, client-side Reddit reader for every subreddit.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
