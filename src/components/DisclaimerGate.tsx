import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { useApplicationStore } from "../store/useApplicationStore";
import { useDisclaimerStore } from "../store/useDisclaimerStore";

export function DisclaimerGate() {
  const { t } = useTranslation();
  const ready = useApplicationStore((s) => s.ready);
  const accepted = useDisclaimerStore((s) => s.accepted);
  const accept = useDisclaimerStore((s) => s.accept);

  if (!ready || accepted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="w-full max-w-md rounded-lg border border-line bg-surface shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <ShieldAlert size={18} strokeWidth={1.75} className="text-accent" />
          <h2 id="disclaimer-title" className="text-sm font-medium text-fg">
            {t("disclaimer.title")}
          </h2>
        </div>
        <p className="px-4 py-4 text-sm leading-relaxed text-muted">
          {t("disclaimer.body")}
        </p>
        <div className="flex justify-end border-t border-line px-4 py-3">
          <Button variant="primary" autoFocus onClick={accept}>
            {t("disclaimer.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
