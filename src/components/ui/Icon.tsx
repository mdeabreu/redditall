import type { ReactNode } from "react";

export type IconName =
  | "alert"
  | "chevron"
  | "external"
  | "hot"
  | "image"
  | "link"
  | "menu"
  | "pin"
  | "refresh"
  | "search"
  | "text"
  | "video";

const iconPaths: Record<IconName, ReactNode> = {
  alert: (
    <>
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  external: (
    <>
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </>
  ),
  hot: (
    <>
      <path d="M8.5 14.5A3.5 3.5 0 0 0 12 20a3.5 3.5 0 0 0 3.5-5.5c-.7-1-1.5-1.7-1.5-3.5-1.4.8-2.4 1.9-2.8 3.4-.9-1.5-.7-3.3.3-5.4-2.8 1.5-5 3.3-3 5.5Z" />
      <path d="M13 3c3 2.6 5 5.4 5 9a6 6 0 1 1-12 0c0-3 2.1-5.8 5.5-9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 2-2 7 7" />
      <path d="M15 9h.01" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  pin: (
    <>
      <path d="M12 17v5" />
      <path d="m5 17 14 0" />
      <path d="M8 17 9.5 9 7 6.5 8.5 5h7L17 6.5 14.5 9 16 17" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 0 1-15.3 6.4" />
      <path d="M3 12A9 9 0 0 1 18.3 5.6" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  text: (
    <>
      <path d="M6 6h12" />
      <path d="M6 12h12" />
      <path d="M6 18h7" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ?? "ar-icon"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {iconPaths[name]}
    </svg>
  );
}
