import React, { useMemo, useState, useEffect } from "react";
import type { AlaCarteOption, PackageTier, PriceOverrides } from "../types";
import { CustomerInfoSchema } from "../schemas";

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    customerInfo: CustomerInfo;
    priceOverrides: PriceOverrides;
  }) => void;
  currentInfo: CustomerInfo;
  currentPriceOverrides: PriceOverrides;
  selectedPackage?: PackageTier | null;
  selectedAddOns?: AlaCarteOption[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentInfo,
  currentPriceOverrides,
  selectedPackage = null,
  selectedAddOns = [],
}) => {
  const [info, setInfo] = useState<CustomerInfo>(currentInfo);
  const [overrides, setOverrides] = useState<PriceOverrides>(
    currentPriceOverrides
  );
  const [desiredTotal, setDesiredTotal] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectionItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      price: number;
      cost: number;
    }> = [];
    if (selectedPackage) {
      items.push({
        id: selectedPackage.id,
        name: `${selectedPackage.name} Package`,
        price: selectedPackage.price,
        cost: selectedPackage.cost,
      });
    }
    selectedAddOns.forEach((item) => {
      items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost,
      });
    });
    return items;
  }, [selectedAddOns, selectedPackage]);

  const selectionTotal = useMemo(() => {
    return selectionItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [selectionItems]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (isOpen) {
      setInfo(currentInfo);
      setOverrides(currentPriceOverrides);
      setValidationErrors({});
      setSaveSuccess(false);
      setDesiredTotal("");
    }
  }, [currentInfo, currentPriceOverrides, isOpen]);

  const setOverrideNumber = (
    id: string,
    key: "price" | "cost",
    raw: string
  ) => {
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

      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return prev;
      }
      return {
        ...prev,
        [id]: { ...current, [key]: parsed },
      };
    });
    setSaveSuccess(false);
  };

  const applyDesiredTotal = () => {
    if (!selectedPackage) return;
    const parsed = Number(desiredTotal.trim());
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const addOnsTotal = selectedAddOns.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    const newPackagePrice = Math.max(0, Math.round(parsed - addOnsTotal));
    setOverrideNumber(selectedPackage.id, "price", String(newPackagePrice));
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false); // Clear success message on edit
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    // Validate customer info
    const validation = CustomerInfoSchema.safeParse(info);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaveSuccess(true);

    // Brief success message before closing
    setTimeout(() => {
      try {
        onSave({ customerInfo: info, priceOverrides: overrides });
      } catch (error) {
        setSaveSuccess(false);
        console.error("Error saving settings:", error);
        // Error will be handled by parent component if needed
      }
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-600 animate-slide-up my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
          <div>
            <h2
              id="settings-modal-title"
              className="text-2xl font-bold font-teko text-white tracking-wider"
            >
              Customer & Vehicle Information
            </h2>
            <p className="text-gray-400 text-sm -mt-1">
              Enter customer and vehicle details for this quote
            </p>
          </div>
          <button
            onClick={onClose}
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
          {saveSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-green-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-400 font-semibold">
                Settings saved successfully!
              </span>
            </div>
          )}

          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 text-red-400 mt-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-red-400 font-semibold mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-xl font-bold font-teko text-gray-100 tracking-wider mb-3">
              Customer & Vehicle Information
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Customer Name{" "}
                  {validationErrors["name"] && (
                    <span className="text-red-400 text-xs">*</span>
                  )}
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={info.name}
                  onChange={handleInfoChange}
                  className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors["name"]
                      ? "border-red-500"
                      : "border-gray-600"
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Vehicle Year{" "}
                    {validationErrors["year"] && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="year"
                    id="year"
                    value={info.year}
                    onChange={handleInfoChange}
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["year"]
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="make"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Make{" "}
                    {validationErrors["make"] && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="make"
                    id="make"
                    value={info.make}
                    onChange={handleInfoChange}
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["make"]
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="model"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Model{" "}
                    {validationErrors["model"] && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="model"
                    id="model"
                    value={info.model}
                    onChange={handleInfoChange}
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["model"]
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold font-teko text-gray-100 tracking-wider mb-3">
              Negotiated Pricing (Optional)
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Adjust pricing for the current selection. These overrides affect
              totals and will be reflected on the printed agreement.
            </p>

            {selectionItems.length === 0 ? (
              <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 text-gray-300">
                Select a package and/or add-ons first, then return here to
                negotiate pricing.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Current total
                      </p>
                      <p className="text-2xl font-teko text-white">
                        {formatMoney(selectionTotal)}
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
                            setSaveSuccess(false);
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
                </div>

                <div className="bg-gray-900/40 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h4 className="text-lg font-semibold text-white">
                      Selected items
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Leave blank to use standard pricing.
                    </p>
                  </div>

                  <div className="divide-y divide-gray-800">
                    {selectionItems.map((item) => {
                      const override = overrides[item.id] || {};
                      const effectivePrice = override.price ?? item.price;
                      return (
                        <div key={item.id} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Standard: {formatMoney(item.price)} · Current:{" "}
                                {formatMoney(effectivePrice)}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
                              <div>
                                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                                  Override price
                                </label>
                                <input
                                  inputMode="numeric"
                                  value={override.price ?? ""}
                                  onChange={(e) =>
                                    setOverrideNumber(
                                      item.id,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={String(item.price)}
                                />
                              </div>

                              <div>
                                <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
                                  Override cost (optional)
                                </label>
                                <input
                                  inputMode="numeric"
                                  value={override.cost ?? ""}
                                  onChange={(e) =>
                                    setOverrideNumber(
                                      item.id,
                                      "cost",
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={String(item.cost)}
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
