import { useState } from "react";
import { ConfirmModal } from "@/components/confirm-modal";
import { useSettings } from "./use-settings";

export function SettingsPage() {
  const { settings, loading, saving, error, update } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) {
    return <p className="text-gray-400">Loading settings…</p>;
  }

  const nextValue = !settings?.signupEnabled;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-100 mb-6">
        Platform Settings
      </h1>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-100 font-medium">Allow New Signups</p>
            <p className="text-gray-500 text-sm">
              When disabled, new users cannot create accounts
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings?.signupEnabled ?? true}
            disabled={saving}
            onClick={() => setConfirmOpen(true)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings?.signupEnabled ? "bg-green-500" : "bg-gray-600"
            } ${saving ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.signupEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={nextValue ? "Enable Signups?" : "Disable Signups?"}
        message={
          nextValue
            ? "New users will be able to create accounts."
            : "New users will not be able to create accounts. Existing users are unaffected."
        }
        confirmLabel={nextValue ? "Enable" : "Disable"}
        confirmVariant={nextValue ? "success" : "danger"}
        loading={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await update({ signupEnabled: nextValue });
        }}
      />
    </div>
  );
}
