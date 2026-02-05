import React, { useState } from "react";
import type { PackageTier, AlaCarteOption } from "../types";
import { PrintView } from "./PrintView";
import { trackQuotePrint } from "../analytics";

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface AgreementViewProps {
  onBack: () => void;
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  pick2?: { price: number; items: AlaCarteOption[]; cost: number };
  totalPrice: number;
  totalCost: number;
  customerInfo: CustomerInfo;
  baseTotalPrice?: number;
  basePackagePricesById?: Record<string, number>;
  baseAddonPricesById?: Record<string, number>;
}

const LexusLogo: React.FC<{ isPrint?: boolean }> = ({ isPrint }) => (
  <div
    className={`font-teko tracking-widest ${
      isPrint ? "text-black" : "text-white"
    }`}
  >
    <p className={`text-3xl font-bold`}>
      PRIORITY{" "}
      <span className={isPrint ? "font-light text-gray-700" : "text-gray-400"}>
        LEXUS
      </span>
    </p>
    <p
      className={`text-sm tracking-widest ${
        isPrint ? "text-gray-600" : "text-gray-500"
      } -mt-2`}
    >
      VIRGINIA BEACH
    </p>
  </div>
);

export const AgreementView: React.FC<AgreementViewProps> = ({
  onBack,
  selectedPackage,
  customPackageItems,
  pick2,
  totalPrice,
  totalCost,
  customerInfo,
  baseTotalPrice,
  basePackagePricesById,
  baseAddonPricesById,
}) => {
  const [isManagerView, setIsManagerView] = useState(false);

  const handlePrint = () => {
    // Track print action
    trackQuotePrint(totalPrice);

    // Quick note for users in restrictive environments like the previewer
    try {
      window.print();
    } catch (e) {
      alert(
        "Printing is disabled in this preview environment. This feature will work on a live website."
      );
      console.error("Print failed:", e);
    }
  };

  const packageLine = selectedPackage
    ? ({ ...selectedPackage, name: `${selectedPackage.name} Package` } as const)
    : null;
  const pick2Line = pick2 && pick2.items.length > 0 ? pick2 : null;

  const vehicleString = [
    customerInfo.year,
    customerInfo.make,
    customerInfo.model,
  ]
    .filter(Boolean)
    .join(" ");
  const todayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const grossProfit = totalPrice - totalCost;
  const showDiscountTotal =
    typeof baseTotalPrice === "number" && baseTotalPrice > totalPrice;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const getBaseRetailPrice = (itemId: string, currentRetail: number) => {
    const baseFromPackages = basePackagePricesById?.[itemId];
    if (typeof baseFromPackages === "number") return baseFromPackages;
    const baseFromAddons = baseAddonPricesById?.[itemId];
    if (typeof baseFromAddons === "number") return baseFromAddons;
    return currentRetail;
  };

  const renderScreenTable = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-gray-700">
          <th className="text-left font-bold uppercase tracking-wider pb-2">
            Item Description
          </th>
          <th className="text-right font-bold uppercase tracking-wider pb-2">
            Retail Price
          </th>
          {isManagerView && (
            <th className="text-right font-bold uppercase tracking-wider pb-2">
              Internal Cost
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {packageLine ? (
          <tr key={packageLine.id} className="border-b border-gray-800">
            <td className="py-3 pr-2">{packageLine.name}</td>
            <td className="text-right font-mono pr-2">
              {(() => {
                const baseRetail = getBaseRetailPrice(packageLine.id, packageLine.price);
                const isDiscounted = baseRetail > packageLine.price;
                if (!isDiscounted) return formatCurrency(packageLine.price);
                return (
                  <div className="inline-flex flex-col items-end">
                    <span className="text-xs text-gray-400 line-through decoration-2 decoration-gray-500/60">
                      {formatCurrency(baseRetail)}
                    </span>
                    <span className="text-white">{formatCurrency(packageLine.price)}</span>
                  </div>
                );
              })()}
            </td>
            {isManagerView && (
              <td className="text-right font-mono">{formatCurrency(packageLine.cost)}</td>
            )}
          </tr>
        ) : null}

        {pick2Line ? (
          <>
            <tr key="pick2-bundle" className="border-b border-gray-800">
              <td className="py-3 pr-2">You Pick 2 Bundle</td>
              <td className="text-right font-mono pr-2">{formatCurrency(pick2Line.price)}</td>
              {isManagerView && (
                <td className="text-right font-mono">{formatCurrency(pick2Line.cost)}</td>
              )}
            </tr>
            {pick2Line.items.map((item) => (
              <tr key={`pick2-${item.id}`} className="border-b border-gray-900/40">
                <td className="py-2 pr-2 pl-6 text-xs text-gray-300"> {item.name}</td>
                <td className="text-right font-mono pr-2 text-xs text-gray-500"></td>
                {isManagerView && <td className="text-right font-mono text-xs text-gray-500"></td>}
              </tr>
            ))}
          </>
        ) : null}

        {customPackageItems.map((item) => (
          <tr key={item.id} className="border-b border-gray-800">
            <td className="py-3 pr-2">{item.name}</td>
            <td className="text-right font-mono pr-2">
              {(() => {
                const baseRetail = getBaseRetailPrice(item.id, item.price);
                const isDiscounted = baseRetail > item.price;
                if (!isDiscounted) return formatCurrency(item.price);
                return (
                  <div className="inline-flex flex-col items-end">
                    <span className="text-xs text-gray-400 line-through decoration-2 decoration-gray-500/60">
                      {formatCurrency(baseRetail)}
                    </span>
                    <span className="text-white">{formatCurrency(item.price)}</span>
                  </div>
                );
              })()}
            </td>
            {isManagerView && (
              <td className="text-right font-mono">{formatCurrency(item.cost)}</td>
            )}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-bold">
          <td
            className={`text-right pt-4 ${isManagerView ? "col-span-2" : ""}`}
          >
            Total Retail Price:
          </td>
          <td className="text-right pt-4 font-mono text-lg">
            {showDiscountTotal ? (
              <div className="inline-flex flex-col items-end">
                <span className="text-sm text-gray-400 line-through decoration-2 decoration-gray-500/60">
                  {formatCurrency(baseTotalPrice)}
                </span>
                <span className="text-white">{formatCurrency(totalPrice)}</span>
              </div>
            ) : (
              formatCurrency(totalPrice)
            )}
          </td>
        </tr>
        {isManagerView && (
          <>
            <tr className="font-bold">
              <td className="text-right pt-2 col-span-2">
                Total Internal Cost:
              </td>
              <td className="text-right pt-2 font-mono text-lg">
                {formatCurrency(totalCost)}
              </td>
            </tr>
            <tr className="font-bold border-t-2 border-gray-700">
              <td className="text-right pt-2 col-span-2">Gross Profit:</td>
              <td className="text-right pt-2 font-mono text-lg text-green-400">
                {formatCurrency(grossProfit)}
              </td>
            </tr>
          </>
        )}
      </tfoot>
    </table>
  );

  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl mx-auto border border-gray-700 animate-fade-in screen-view">
        {/* Header for screen view */}
        <header className="p-4 flex justify-between items-center border-b border-gray-700">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                clipRule="evenodd"
              />
            </svg>
            Back to Menu
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">
                MANAGER VIEW
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManagerView}
                  onChange={() => setIsManagerView(!isManagerView)}
                  className="sr-only peer"
                  aria-label="Manager view"
                />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0-1.423-4.832a1.125 1.125 0 0 0-2.155-.025l-1.152.411a1.125 1.125 0 0 1-1.298-.287l-2.406-2.406a1.125 1.125 0 0 0-1.59 0l-2.406 2.406a1.125 1.125 0 0 1-1.298.287l-1.152-.411a1.125 1.125 0 0 0-2.155.025L5.85 7.232"
                />
              </svg>
              Print
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8">
          <header className="flex justify-between items-start mb-8">
            <LexusLogo />
            <div className="text-right">
              <h1 className="text-3xl font-bold font-teko tracking-wider uppercase">
                {isManagerView
                  ? "Internal Finance Record"
                  : "Vehicle Protection Agreement"}
              </h1>
              <p className="font-semibold text-gray-500 -mt-1">
                {isManagerView
                  ? "Confidential - Manager Copy"
                  : "Customer Copy"}
              </p>
            </div>
          </header>
          <section className="mb-8 border-y-2 border-gray-700 py-4 grid grid-cols-3 gap-4">
            <div>
              <strong>Customer:</strong> {customerInfo.name || "N/A"}
            </div>
            <div>
              <strong>Vehicle:</strong> {vehicleString || "N/A"}
            </div>
            <div>
              <strong>Date:</strong> {todayDate}
            </div>
          </section>

          {renderScreenTable()}

          <footer className="mt-24 pt-8 text-sm text-gray-400">
            {!isManagerView && (
              <p className="mb-8">
                I acknowledge that I have reviewed and agree to the purchase of
                the items listed above. All coverages, terms, and conditions are
                detailed in the respective product warranty documents provided
                to me.
              </p>
            )}
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="border-b-2 border-gray-700 pt-12"></div>
                <p className="mt-2 font-bold">
                  {isManagerView ? "Manager Signature" : "Customer Signature"}
                </p>
              </div>
              <div>
                <div className="border-b-2 border-gray-700 pt-12"></div>
                <p className="mt-2 font-bold">
                  {isManagerView ? "Date Processed" : "Manager Signature"}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Hidden container for the print-optimized view */}
      <div className="print-mount">
        <PrintView
          selectedPackage={selectedPackage}
          customPackageItems={customPackageItems}
          pick2={pick2Line ?? undefined}
          totalPrice={totalPrice}
          totalCost={totalCost}
          customerInfo={customerInfo}
          isManagerView={isManagerView}
          baseTotalPrice={baseTotalPrice}
          basePackagePricesById={basePackagePricesById}
          baseAddonPricesById={baseAddonPricesById}
        />
      </div>
    </>
  );
};
