import { Icon, type IconName } from "../ui/Icon";
import type { PostKind } from "../feed/types";

const badgeConfig: Record<PostKind, { label: string; icon: IconName }> = {
  text: { label: "Text", icon: "text" },
  image: { label: "Image", icon: "image" },
  gif: { label: "GIF", icon: "image" },
  link: { label: "Link", icon: "link" },
  video: { label: "Video", icon: "video" },
};

export function PostTypeBadge({ kind = "text" }: { kind?: PostKind }) {
  const badge = badgeConfig[kind];
  return (
    <span className="ar-post-badge">
      <Icon name={badge.icon} />
      {badge.label}
    </span>
  );
}
