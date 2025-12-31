import type { PackageTier } from '../types';

const tierRank = (name: string) => {
  const n = name.trim().toLowerCase();
  if (/\belite\b/.test(n)) return 1;
  if (/\bplatinum\b/.test(n)) return 2;
  if (/\bgold\b/.test(n)) return 3;
  return 99;
};

export const sortPackagesForDisplay = (packages: PackageTier[]): PackageTier[] => {
  return [...packages].sort((a, b) => tierRank(a.name) - tierRank(b.name));
};
