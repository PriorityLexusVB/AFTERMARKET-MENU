import React from "react";
import type { PackageTier, AlaCarteOption } from "../types";

interface CustomerInfo {
  name: string;
  year: string;
  make: string;
  model: string;
}

interface PrintViewProps {
  selectedPackage: PackageTier | null;
  customPackageItems: AlaCarteOption[];
  pick2?: { price: number; items: AlaCarteOption[]; cost: number };
  totalPrice: number;
  totalCost: number;
  customerInfo: CustomerInfo;
  isManagerView: boolean;
  baseTotalPrice?: number;
  basePackagePricesById?: Record<string, number>;
  baseAddonPricesById?: Record<string, number>;
}

const LexusLogo: React.FC = () => (
  <div className="font-teko tracking-widest text-black">
    <p className="text-3xl font-bold">
      PRIORITY <span className="font-light text-gray-700">LEXUS</span>
    </p>
    <p className="text-sm tracking-widest text-gray-600 -mt-2">
      VIRGINIA BEACH
    </p>
  </div>
);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

export const PrintView: React.FC<PrintViewProps> = ({
  selectedPackage,
  customPackageItems,
  pick2,
  totalPrice,
  totalCost,
  customerInfo,
  isManagerView,
  baseTotalPrice,
  basePackagePricesById,
  baseAddonPricesById,
}) => {
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

  const getBaseRetailPrice = (itemId: string, currentRetail: number) => {
    const baseFromPackages = basePackagePricesById?.[itemId];
    if (typeof baseFromPackages === "number") return baseFromPackages;
    const baseFromAddons = baseAddonPricesById?.[itemId];
    if (typeof baseFromAddons === "number") return baseFromAddons;
    return currentRetail;
  };

  return (
    <div className="bg-white text-black p-8 font-sans">
      <header className="flex justify-between items-start mb-8">
        <LexusLogo />
        <div className="text-right">
          <h1 className="text-3xl font-bold font-teko tracking-wider uppercase">
            {isManagerView
              ? "Internal Finance Record"
              : "Vehicle Protection Agreement"}
          </h1>
          <p className="font-semibold text-gray-700 -mt-1">
            {isManagerView ? "Confidential - Manager Copy" : "Customer Copy"}
          </p>
        </div>
      </header>

      <section className="mb-8 border-y-2 border-black py-4 grid grid-cols-3 gap-4 text-sm">
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

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-black">
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
            <tr key={packageLine.id} className="border-b border-gray-300">
              <td className="py-3 pr-2">{packageLine.name}</td>
              <td className="text-right font-mono pr-2">
                {(() => {
                  const baseRetail = getBaseRetailPrice(packageLine.id, packageLine.price);
                  const isDiscounted = baseRetail > packageLine.price;
                  if (!isDiscounted) return formatCurrency(packageLine.price);
                  return (
                    <div className="inline-flex flex-col items-end">
                      <span className="text-xs text-gray-500 line-through decoration-2 decoration-gray-400/60">
                        {formatCurrency(baseRetail)}
                      </span>
                      <span className="text-black">{formatCurrency(packageLine.price)}</span>
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
              <tr key="pick2-bundle" className="border-b border-gray-300">
                <td className="py-3 pr-2">You Pick 2 Bundle</td>
                <td className="text-right font-mono pr-2">{formatCurrency(pick2Line.price)}</td>
                {isManagerView && (
                  <td className="text-right font-mono">{formatCurrency(pick2Line.cost)}</td>
                )}
              </tr>
              {pick2Line.items.map((item) => (
                <tr key={`pick2-${item.id}`} className="border-b border-gray-200">
                  <td className="py-2 pr-2 pl-6 text-xs text-gray-700">• {item.name}</td>
                  <td className="text-right font-mono pr-2 text-xs text-gray-500"></td>
                  {isManagerView && (
                    <td className="text-right font-mono text-xs text-gray-500"></td>
                  )}
                </tr>
              ))}
            </>
          ) : null}

          {customPackageItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-3 pr-2">{item.name}</td>
              <td className="text-right font-mono pr-2">
                {(() => {
                  const baseRetail = getBaseRetailPrice(item.id, item.price);
                  const isDiscounted = baseRetail > item.price;
                  if (!isDiscounted) return formatCurrency(item.price);
                  return (
                    <div className="inline-flex flex-col items-end">
                      <span className="text-xs text-gray-500 line-through decoration-2 decoration-gray-400/60">
                        {formatCurrency(baseRetail)}
                      </span>
                      <span className="text-black">{formatCurrency(item.price)}</span>
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
                  <span className="text-sm text-gray-500 line-through decoration-2 decoration-gray-400/60">
                    {formatCurrency(baseTotalPrice)}
                  </span>
                  <span className="text-black">
                    {formatCurrency(totalPrice)}
                  </span>
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
              <tr className="font-bold border-t-2 border-black">
                <td className="text-right pt-2 col-span-2">Gross Profit:</td>
                <td className="text-right pt-2 font-mono text-lg text-green-600">
                  {formatCurrency(grossProfit)}
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      <footer className="mt-24 pt-8 text-sm text-gray-600">
        {!isManagerView && (
          <p className="mb-8">
            I acknowledge that I have reviewed and agree to the purchase of the
            items listed above. All coverages, terms, and conditions are
            detailed in the respective product warranty documents provided to
            me.
          </p>
        )}
        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="border-b-2 border-black pt-12"></div>
            <p className="mt-2 font-bold">
              {isManagerView ? "Manager Signature" : "Customer Signature"}
            </p>
          </div>
          <div>
            <div className="border-b-2 border-black pt-12"></div>
            <p className="mt-2 font-bold">
              {isManagerView ? "Date Processed" : "Manager Signature"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
