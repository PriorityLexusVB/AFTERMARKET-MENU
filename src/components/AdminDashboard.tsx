import React from 'react';
import type { ProductFeature, PackageTier, AlaCarteOption } from '../types';

interface AdminDashboardProps {
  features: ProductFeature[];
  packages: PackageTier[];
  alaCarteOptions: AlaCarteOption[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

const calculateMargin = (price: number, cost: number): number => {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  features,
  packages,
  alaCarteOptions,
}) => {
  // Calculate statistics
  const totalFeatures = features.length;
  const totalPackages = packages.length;
  const totalAlaCarteOptions = alaCarteOptions.length;

  const featuresInPackages = new Set(
    packages.flatMap((pkg) => pkg.features.map((f) => f.id))
  );
  const unassignedFeatures = features.filter((f) => !featuresInPackages.has(f.id));

  // Package stats
  const packageStats = packages.map((pkg) => {
    const effectivePrice = pkg.salePrice ?? pkg.price;
    const totalCost = pkg.features.reduce((sum, f) => sum + f.cost, 0);
    const retailValue = pkg.features.reduce((sum, f) => sum + (f.salePrice ?? f.price), 0);
    const profit = effectivePrice - totalCost;
    const margin = calculateMargin(effectivePrice, totalCost);

    return {
      name: pkg.name,
      price: effectivePrice,
      cost: totalCost,
      profit,
      margin,
      retailValue,
      savings: retailValue - effectivePrice,
    };
  });

  const mostProfitablePackage = packageStats.reduce(
    (max, pkg) => (pkg.profit > max.profit ? pkg : max),
    packageStats[0] || { name: 'N/A', profit: 0 }
  );

  const bestMarginPackage = packageStats.reduce(
    (max, pkg) => (pkg.margin > max.margin ? pkg : max),
    packageStats[0] || { name: 'N/A', margin: 0 }
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold font-teko ${color}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <span className="text-4xl opacity-20">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div>
        <h3 className="text-2xl font-teko tracking-wider text-white mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Packages"
            value={totalPackages}
            subtitle={`${packages.filter((p) => p.is_recommended).length} recommended`}
            icon="📦"
            color="text-blue-400"
          />
          <StatCard
            title="Product Features"
            value={totalFeatures}
            subtitle={`${unassignedFeatures.length} unassigned`}
            icon="🔧"
            color="text-green-400"
          />
          <StatCard
            title="À La Carte Options"
            value={totalAlaCarteOptions}
            subtitle={`${alaCarteOptions.filter((a) => a.isNew).length} marked as new`}
            icon="🛒"
            color="text-yellow-400"
          />
          <StatCard
            title="Total Items"
            value={totalFeatures + totalAlaCarteOptions}
            subtitle="Across all collections"
            icon="📋"
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Package Performance */}
      {packages.length > 0 && (
        <div>
          <h3 className="text-2xl font-teko tracking-wider text-white mb-4">
            Package Performance
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">💰</span>
                <div>
                  <p className="text-gray-400 text-sm">Most Profitable</p>
                  <p className="text-xl font-bold text-green-400">{mostProfitablePackage.name}</p>
                </div>
              </div>
              <p className="text-gray-300">
                Profit: <span className="font-mono font-bold text-green-400">{formatPrice(mostProfitablePackage.profit)}</span>
              </p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📈</span>
                <div>
                  <p className="text-gray-400 text-sm">Best Margin</p>
                  <p className="text-xl font-bold text-blue-400">{bestMarginPackage.name}</p>
                </div>
              </div>
              <p className="text-gray-300">
                Margin: <span className="font-mono font-bold text-blue-400">{bestMarginPackage.margin.toFixed(1)}%</span>
              </p>
            </div>
          </div>

          {/* Package Details Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Retail Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {packageStats.map((pkg, index) => (
                  <tr key={index} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-white font-semibold">{pkg.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {formatPrice(pkg.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">
                      {formatPrice(pkg.cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-green-400">
                      {formatPrice(pkg.profit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">
                      {pkg.margin.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">
                      {formatPrice(pkg.retailValue)}
                      {pkg.savings > 0 && (
                        <span className="block text-xs text-green-400">
                          Save {formatPrice(pkg.savings)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warnings */}
      {unassignedFeatures.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold mb-1">
                {unassignedFeatures.length} Unassigned Features
              </p>
              <p className="text-yellow-200/80 text-sm">
                The following features are not assigned to any package:
              </p>
              <ul className="list-disc list-inside text-yellow-200/60 text-sm mt-2">
                {unassignedFeatures.slice(0, 5).map((f) => (
                  <li key={f.id}>{f.name}</li>
                ))}
                {unassignedFeatures.length > 5 && (
                  <li className="text-yellow-400">
                    ...and {unassignedFeatures.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
