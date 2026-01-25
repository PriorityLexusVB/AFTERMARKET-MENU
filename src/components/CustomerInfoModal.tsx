import React, { useEffect, useState } from "react";
import { CustomerInfoSchema } from "../schemas";

export interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: CustomerInfo) => void;
  currentInfo: CustomerInfo;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentInfo,
}) => {
  const [info, setInfo] = useState<CustomerInfo>(currentInfo);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInfo(currentInfo);
      setValidationErrors({});
      setSaveSuccess(false);
    }
  }, [currentInfo, isOpen]);

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
    setSaveSuccess(false);

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSave = () => {
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

    setTimeout(() => {
      try {
        onSave(info);
      } finally {
        onClose();
      }
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex justify-center items-start p-4 overflow-y-auto">
      <button
        type="button"
        className="absolute inset-0 bg-black bg-opacity-70 animate-fade-in"
        onClick={onClose}
        aria-label="Close customer info"
      />
      <div
        className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-600 animate-slide-up my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-info-modal-title"
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
          <div>
            <h2
              id="customer-info-modal-title"
              className="text-2xl font-bold font-teko text-white tracking-wider"
            >
              Customer & Vehicle
            </h2>
            <p className="text-gray-400 text-sm -mt-1">Used for the slide 1 header and agreement</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close customer info"
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

        <div className="p-6 space-y-6">
          {saveSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <span className="text-green-400 font-semibold">Saved</span>
            </div>
          )}

          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in">
              <p className="text-red-400 font-semibold mb-1">Please fix:</p>
              <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Customer Name
                  {validationErrors["name"] && <span className="text-red-400 text-xs"> *</span>}
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={info.name}
                  onChange={handleInfoChange}
                  placeholder="e.g. Jane Doe"
                  autoCapitalize="words"
                  autoComplete="off"
                  className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors["name"] ? "border-red-500" : "border-gray-600"
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                    Year
                    {validationErrors["year"] && <span className="text-red-400 text-xs"> *</span>}
                  </label>
                  <input
                    type="text"
                    name="year"
                    id="year"
                    value={info.year}
                    onChange={handleInfoChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="e.g. 2025"
                    autoComplete="off"
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["year"] ? "border-red-500" : "border-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                    Make
                    {validationErrors["make"] && <span className="text-red-400 text-xs"> *</span>}
                  </label>
                  <input
                    type="text"
                    name="make"
                    id="make"
                    value={info.make}
                    onChange={handleInfoChange}
                    placeholder="e.g. Lexus"
                    autoCapitalize="words"
                    autoComplete="off"
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["make"] ? "border-red-500" : "border-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                    Model
                    {validationErrors["model"] && <span className="text-red-400 text-xs"> *</span>}
                  </label>
                  <input
                    type="text"
                    name="model"
                    id="model"
                    value={info.model}
                    onChange={handleInfoChange}
                    placeholder="e.g. RX 350"
                    autoCapitalize="words"
                    autoComplete="off"
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors["model"] ? "border-red-500" : "border-gray-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-900/50 border-t border-gray-700 flex justify-end items-center rounded-b-xl sticky bottom-0 z-10">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold uppercase tracking-wider text-sm hover:bg-blue-700 transition-colors transform active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
