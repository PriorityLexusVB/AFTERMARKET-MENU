import { useCallback, useState } from "react";
import type { PackageTier } from "../types";
import { trackPackageSelect } from "../analytics";

export interface UsePackageSelectionReturn {
  selectedPackage: PackageTier | null;
  setSelectedPackage: React.Dispatch<React.SetStateAction<PackageTier | null>>;
  handleSelectPackage: (pkg: PackageTier) => void;
}

export function usePackageSelection(): UsePackageSelectionReturn {
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(null);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    setSelectedPackage((prev) => {
      const isSelecting = prev?.id !== pkg.id;
      if (isSelecting) {
        trackPackageSelect(pkg);
      }
      return prev?.id === pkg.id ? null : pkg;
    });
  }, []);

  return {
    selectedPackage,
    setSelectedPackage,
    handleSelectPackage,
  };
}
