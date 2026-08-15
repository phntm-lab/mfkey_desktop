import { useTranslation } from "react-i18next";
import { useUiStore } from "../../store/useUiStore";
import { SCREENS, type ScreenGroup, type ScreenMeta } from "../../config/screens";

function itemsFor(group: ScreenGroup): ScreenMeta[] {
  return SCREENS.filter((screen) => screen.group === group);
}

export function SideRail() {
  const { t } = useTranslation();
  const activeScreen = useUiStore((s) => s.activeScreen);
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);

  return (
    <nav
      aria-label={t("nav.ariaLabel")}
      className="flex w-14 shrink-0 flex-col items-center justify-between border-r border-line bg-surface py-3"
    >
      <div className="flex flex-col items-center gap-1">
        {itemsFor("primary").map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={activeScreen === item.id}
            onSelect={() => setActiveScreen(item.id)}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        {itemsFor("secondary").map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={activeScreen === item.id}
            onSelect={() => setActiveScreen(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}

function RailButton({
  item,
  active,
  onSelect,
}: {
  item: ScreenMeta;
  active: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { Icon } = item;
  const label = t(`nav.${item.id}`);
  const state = active
    ? "text-accent bg-accent-soft"
    : "text-muted hover:text-fg hover:bg-raised";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
      className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${state}`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-2 bottom-2 w-0.5 rounded-r bg-accent"
        />
      )}
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );
}
