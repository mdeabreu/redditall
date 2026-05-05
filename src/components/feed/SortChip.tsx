import { DropdownMenu } from "radix-ui";

import { Icon } from "../ui/Icon";
import type { SortKey, TimeRangeKey } from "./types";

const sortLabels: Record<SortKey, string> = {
  hot: "Hot",
  top: "Top",
  new: "New",
  rising: "Rising",
  controversial: "Controversial",
  best: "Best",
};

const timeRangeLabels: Record<TimeRangeKey, string> = {
  hour: "Hour",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  all: "All",
};

export function SortChip({
  value = "hot",
  disabled,
  onChange,
}: {
  value?: SortKey;
  disabled?: boolean;
  onChange?: (value: SortKey) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button className="ar-sort-chip" type="button" aria-label="Sort posts">
          <Icon name={value === "hot" ? "hot" : "text"} />
          <span>{sortLabels[value]}</span>
          <Icon name="chevron" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ar-sort-menu-content" align="start" sideOffset={6}>
          <DropdownMenu.RadioGroup value={value} onValueChange={(nextValue) => onChange?.(nextValue as SortKey)}>
            {Object.entries(sortLabels).map(([key, label]) => (
              <DropdownMenu.RadioItem key={key} className="ar-sort-menu-item" value={key}>
                <span>{label}</span>
                <DropdownMenu.ItemIndicator className="ar-sort-menu-indicator">✓</DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function TimeRangeChip({
  value = "day",
  disabled,
  onChange,
}: {
  value?: TimeRangeKey;
  disabled?: boolean;
  onChange?: (value: TimeRangeKey) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button className="ar-sort-chip ar-time-chip" type="button" aria-label="Top posts time range">
          <span>{timeRangeLabels[value]}</span>
          <Icon name="chevron" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ar-sort-menu-content" align="start" sideOffset={6}>
          <DropdownMenu.RadioGroup value={value} onValueChange={(nextValue) => onChange?.(nextValue as TimeRangeKey)}>
            {Object.entries(timeRangeLabels).map(([key, label]) => (
              <DropdownMenu.RadioItem key={key} className="ar-sort-menu-item" value={key}>
                <span>{label}</span>
                <DropdownMenu.ItemIndicator className="ar-sort-menu-indicator">✓</DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
