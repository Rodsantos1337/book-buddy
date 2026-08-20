import { useCallback, useEffect, useState } from "react";
import type { Settings, ModelInfo } from "../types";
import { fetchModels } from "../api/chat";

interface SettingsModalProps {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadModels = useCallback(async (url: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await fetchModels(url);
      const free = list.filter((m) => m.id.endsWith(":free"));
      setModels(free.length > 0 ? free : list);
    } catch {
      setFetchError("Could not reach the server. Make sure the backend is running.");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (settings.baseUrl) void loadModels(settings.baseUrl);
  }, [settings.baseUrl, loadModels]);

  const handleSave = () => {
    onSave({ baseUrl, apiKey, model });
    onClose();
  };

  const modelIds = new Set(models.map((m) => m.id));
  const hasSavedModel = model.length > 0 && !modelIds.has(model);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl bg-bg-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Settings</h2>
          <button onClick={onClose} className="cursor-pointer text-grey-0 hover:text-fg">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-grey-0">Base URL</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-lg border border-bg-3 bg-bg-0 px-3 py-2 text-sm text-fg focus:border-green focus:outline-none"
              placeholder="https://openrouter.ai/api/v1"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-grey-0">Model</label>
            <div className="flex gap-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-bg-3 bg-bg-0 px-3 py-2 text-sm text-fg focus:border-green focus:outline-none"
              >
                <option value="">Select a model</option>
                {hasSavedModel && <option value={model}>{model}</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadModels(baseUrl)}
                disabled={loading || !baseUrl}
                className="cursor-pointer rounded-lg border border-bg-3 px-3 py-2 text-sm text-grey-0 hover:bg-bg-2 disabled:opacity-50"
              >
                {loading ? "..." : "Fetch"}
              </button>
            </div>
            {fetchError && <p className="mt-1 text-xs text-red">{fetchError}</p>}
            {models.length === 0 && !loading && !fetchError && (
              <p className="mt-1 text-xs text-grey-1">
                No models found — check the Base URL or click "Fetch" to retry.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-grey-0">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-bg-3 bg-bg-0 px-3 py-2 text-sm text-fg focus:border-green focus:outline-none"
              placeholder="sk-..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-bg-3 px-4 py-2 text-sm text-grey-0 hover:bg-bg-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer rounded-lg bg-green px-4 py-2 text-sm text-bg-0 hover:bg-green/80"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
