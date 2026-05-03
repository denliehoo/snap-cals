import { useState } from "react";
import { ConfirmModal } from "@/components/confirm-modal";
import { useSettings } from "./use-settings";

export function SettingsPage() {
  const { settings, loading, saving, error, update } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aiLimitInput, setAiLimitInput] = useState("");
  const [aiLimitError, setAiLimitError] = useState("");
  const [aiLimitConfirmOpen, setAiLimitConfirmOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (loading) {
    return <p className="text-gray-400">Loading settings…</p>;
  }

  if (settings && !initialized) {
    setAiLimitInput(String(settings.freeDailyAiLimit));
    setInitialized(true);
  }

  const nextValue = !settings?.signupEnabled;

  const parsedLimit = Number(aiLimitInput);
  const isValidLimit =
    aiLimitInput !== "" &&
    Number.isInteger(parsedLimit) &&
    parsedLimit >= 1 &&
    parsedLimit <= 20;
  const isLimitChanged = parsedLimit !== settings?.freeDailyAiLimit;
  const canSaveLimit = isValidLimit && isLimitChanged;

  function handleAiLimitChange(value: string) {
    setAiLimitInput(value);
    setAiLimitError("");
    const num = Number(value);
    if (value === "") return;
    if (!Number.isInteger(num) || num < 1 || num > 20) {
      setAiLimitError("Must be a whole number between 1 and 20");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-100 mb-6">
        Platform Settings
      </h1>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
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

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-gray-100 font-medium">Free Daily AI Limit</p>
              <p className="text-gray-500 text-sm">
                Max AI lookups per day for free users
              </p>
              {aiLimitError && (
                <p className="text-red-400 text-sm mt-1">{aiLimitError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={aiLimitInput}
                onChange={(e) => handleAiLimitChange(e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 text-center"
              />
              <button
                type="button"
                disabled={!canSaveLimit || saving}
                onClick={() => setAiLimitConfirmOpen(true)}
                className={`px-3 py-1 text-sm rounded font-medium text-white ${
                  canSaveLimit && !saving
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-gray-700 opacity-50 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </div>
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

      <ConfirmModal
        open={aiLimitConfirmOpen}
        title="Change AI Limit?"
        message={`Free users will get ${parsedLimit} AI lookups per day (currently ${settings?.freeDailyAiLimit}).`}
        confirmLabel="Update"
        confirmVariant="success"
        loading={saving}
        onCancel={() => setAiLimitConfirmOpen(false)}
        onConfirm={async () => {
          setAiLimitConfirmOpen(false);
          await update({ freeDailyAiLimit: parsedLimit });
        }}
      />
    </div>
  );
}
