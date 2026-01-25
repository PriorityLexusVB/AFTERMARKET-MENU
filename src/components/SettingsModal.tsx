import React, { useMemo, useState, useEffect, useCallback } from "react";
import type { AlaCarteOption, PackageTier, PriceOverrides } from "../types";

const parseMoneyInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Accept common sales inputs like "$2,999" or "2,999".
  const normalized = trimmed.replace(/[$,\s]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const normalizeOverrides = (
  overrides: PriceOverrides
): Record<string, { price?: number; cost?: number }> => {
  const result: Record<string, { price?: number; cost?: number }> = {};
  Object.entries(overrides).forEach(([id, value]) => {
    if (!value) return;
    const next: { price?: number; cost?: number } = {};
    if (typeof value.price === "number") next.price = value.price;
    if (typeof value.cost === "number") next.cost = value.cost;
    if (Object.keys(next).length > 0) {
      result[id] = next;
    }
  });
  return result;
};

const overridesEqual = (a: PriceOverrides, b: PriceOverrides): boolean => {
  const na = normalizeOverrides(a);
  const nb = normalizeOverrides(b);
  const aKeys = Object.keys(na).sort();
  const bKeys = Object.keys(nb).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in nb)) return false;
    const av = na[key];
    const bv = nb[key];
    if (!av || !bv) return false;
    if (av.price !== bv.price) return false;
    if (av.cost !== bv.cost) return false;
  }
  return true;
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (priceOverrides: PriceOverrides) => void;
  currentPriceOverrides: PriceOverrides;
  basePackagePricesById?: Record<string, number>;
  basePackageCostsById?: Record<string, number>;
  baseAddonPricesById?: Record<string, number>;
  baseAddonCostsById?: Record<string, number>;
  selectedPackage?: PackageTier | null;
  selectedAddOns?: AlaCarteOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentPriceOverrides,
  basePackagePricesById = {},
  basePackageCostsById = {},
  baseAddonPricesById = {},
  baseAddonCostsById = {},
  selectedPackage = null,
  selectedAddOns = [],
}) => {
  const [overrides, setOverrides] = useState<PriceOverrides>(currentPriceOverrides);
  const [desiredTotal, setDesiredTotal] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const selectionItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      standardPrice: number;
      standardCost: number;
    }> = [];
    if (selectedPackage) {
      const standardPrice = basePackagePricesById[selectedPackage.id] ?? selectedPackage.price;
      const standardCost = basePackageCostsById[selectedPackage.id] ?? selectedPackage.cost;
      items.push({
        id: selectedPackage.id,
        name: `${selectedPackage.name} Package`,
        standardPrice,
        standardCost,
      });
    }
    selectedAddOns.forEach((item) => {
      const standardPrice = baseAddonPricesById[item.id] ?? item.price;
      const standardCost = baseAddonCostsById[item.id] ?? item.cost;
      items.push({
        id: item.id,
        name: item.name,
        standardPrice,
        standardCost,
      });
    });
    return items;
  }, [
    baseAddonCostsById,
    baseAddonPricesById,
    basePackageCostsById,
    basePackagePricesById,
    selectedAddOns,
    selectedPackage,
  ]);

  const standardTotal = useMemo(
    () => selectionItems.reduce((sum, item) => sum + (item.standardPrice || 0), 0),
    [selectionItems]
  );

  const currentTotal = useMemo(() => {
    return selectionItems.reduce((sum, item) => {
      const override = overrides[item.id] || {};
      const effectivePrice = override.price ?? item.standardPrice;
      return sum + (effectivePrice || 0);
    }, 0);
  }, [overrides, selectionItems]);

  const totalDelta = useMemo(() => currentTotal - standardTotal, [currentTotal, standardTotal]);

  const isDirty = useMemo(
    () => !overridesEqual(overrides, currentPriceOverrides),
    [overrides, currentPriceOverrides]
  );

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (isOpen) {
      setOverrides(currentPriceOverrides);
      setSaveError(null);
      setDesiredTotal("");
      setShowDiscardConfirm(false);
    }
  }, [currentPriceOverrides, isOpen]);

  const setOverrideNumber = (id: string, key: "price" | "cost", raw: string) => {
    const trimmed = raw.trim();
    setOverrides((prev) => {
      const current = prev[id] || {};

      // Empty input clears that override key.
      if (trimmed === "") {
        const next = { ...current };
        delete next[key];
        const result = { ...prev, [id]: next };
        if (Object.keys(next).length === 0) {
          delete result[id];
        }
        return result;
      }

      const parsed = parseMoneyInput(trimmed);
      if (parsed == null) {
        return prev;
      }
      return {
        ...prev,
        [id]: { ...current, [key]: parsed },
      };
    });
    setSaveError(null);
  };

  const applyDesiredTotal = () => {
    if (!selectedPackage) return;
    const parsed = parseMoneyInput(desiredTotal);
    if (parsed == null) return;
    const addOnsTotal = selectionItems
      .filter((item) => item.id !== selectedPackage.id)
      .reduce((sum, item) => {
        const override = overrides[item.id] || {};
        const effectivePrice = override.price ?? item.standardPrice;
        return sum + (effectivePrice || 0);
      }, 0);
    const newPackagePrice = Math.max(0, Math.round(parsed - addOnsTotal));
    setOverrideNumber(selectedPackage.id, "price", String(newPackagePrice));
  };

  const clearAllOverrides = () => {
    setOverrides({});
    setSaveError(null);
  };

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, requestClose]);

  const handleSave = () => {
    setSaveError(null);
    try {
      onSave(overrides);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveError("Could not save pricing adjustments. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start p-4 overflow-y-auto">
      <button
        type="button"
        className="absolute inset-0 bg-black bg-opacity-70 animate-fade-in"
        onClick={requestClose}
        aria-label="Close settings"
      />
      <div
        className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-600 animate-slide-up my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
          <div>
            <h2
              id="settings-modal-title"
              className="text-2xl font-bold font-teko text-white tracking-wider"
            >
              Pricing Adjustments
            </h2>
            <p className="text-gray-400 text-sm -mt-1">
              Negotiate pricing for the current selection
            </p>
          </div>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[calc(100vh-220px)] overflow-y-auto">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-red-300"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-10.75a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5Zm.75 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-200 font-semibold">{saveError}</span>
            </div>
          )}

          {showDiscardConfirm && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
              <div className="text-amber-100">
                <p className="font-semibold">Discard unsaved changes?</p>
                <p className="text-sm text-amber-200/80">
                  Your pricing edits won’t apply unless you Save.
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="btn-lux-ghost px-3 min-h-[40px]"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="bg-amber-500 text-black px-3 min-h-[40px] rounded-md font-bold"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-xl font-bold font-teko text-gray-100 tracking-wider mb-3">
              Negotiated Pricing (Optional)
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Adjust pricing for the current selection. These overrides affect totals and will be
              reflected on the printed agreement.
            </p>

            {selectionItems.length === 0 ? (
              <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 text-gray-300">
                Select a package and/or add-ons first, then return here to negotiate pricing.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Negotiated total (preview)
                      </p>
                      <p className="text-2xl font-teko text-white">{formatMoney(currentTotal)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Standard: {formatMoney(standardTotal)}
                        <span className="mx-2 text-gray-600">•</span>
                        Delta:
                        <span
                          className={`ml-1 font-semibold ${
                            totalDelta > 0
                              ? "text-emerald-300"
                              : totalDelta < 0
                                ? "text-amber-300"
                                : "text-gray-400"
                          }`}
                        >
                          {totalDelta > 0 ? "+" : ""}
                          {formatMoney(totalDelta)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tip: Use a whole-dollar target for faster quoting.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-300 mb-1"
                          htmlFor="desiredTotal"
                        >
                          Target total (adjusts package price)
                        </label>
                        <input
                          id="desiredTotal"
                          inputMode="numeric"
                          value={desiredTotal}
                          onChange={(e) => {
                            setDesiredTotal(e.target.value);
                            setSaveError(null);
                          }}
                          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. 2999"
                          disabled={!selectedPackage}
                        />
                        {!selectedPackage && (
                          <p className="text-xs text-gray-500 mt-1">
                            Select a package to use target-total pricing.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={applyDesiredTotal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={!selectedPackage}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Changes are a preview here and apply only after Save.
                    </p>
                    <button
                      type="button"
                      onClick={clearAllOverrides}
                      className="text-xs uppercase tracking-[0.2em] text-gray-300 hover:text-white underline underline-offset-4"
                    >
                      Clear all overrides
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h4 className="text-lg font-semibold text-white">Selected items</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Leave blank to use standard pricing.
                    </p>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {selectionItems.map((item) => {
                      const override = overrides[item.id] || {};
                      const effectivePrice = override.price ?? item.standardPrice;
                      const deltaPrice = effectivePrice - item.standardPrice;
                      return (
                        <div key={item.id} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Standard: {formatMoney(item.standardPrice)} · Current:{" "}
                                {formatMoney(effectivePrice)} · Delta:{" "}
                                <span
                                  className={`font-semibold ${
                                    deltaPrice > 0
                                      ? "text-emerald-300"
                                      : deltaPrice < 0
                                        ? "text-amber-300"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {deltaPrice > 0 ? "+" : ""}
                                  {formatMoney(deltaPrice)}
                                </span>
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
                              <div>
                                <label
                                  htmlFor={`override-price-${item.id}`}
                                  className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1"
                                >
                                  Override price
                                </label>
                                <input
                                  id={`override-price-${item.id}`}
                                  inputMode="numeric"
                                  value={override.price ?? ""}
                                  onChange={(e) =>
                                    setOverrideNumber(item.id, "price", e.target.value)
                                  }
                                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={String(item.standardPrice)}
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`override-cost-${item.id}`}
                                  className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1"
                                >
                                  Override cost (optional)
                                </label>
                                <input
                                  id={`override-cost-${item.id}`}
                                  inputMode="numeric"
                                  value={override.cost ?? ""}
                                  onChange={(e) =>
                                    setOverrideNumber(item.id, "cost", e.target.value)
                                  }
                                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={String(item.standardCost)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 bg-gray-900/50 border-t border-gray-700 flex justify-end items-center rounded-b-xl sticky bottom-0 z-10">
          <button type="button" onClick={requestClose} className="btn-lux-ghost px-5 py-2 mr-3">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors transform active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
