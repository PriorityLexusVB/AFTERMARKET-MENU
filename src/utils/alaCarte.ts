import type { AlaCarteOption } from '../types';

export const VALID_ALACARTE_COLUMNS = [1, 2, 3, 4];

export const columnOrderValue = (col?: number) => {
  // Customer-facing order: Elite (2) → Platinum (3) → Gold (1) → Featured (4)
  if (col === 2) return 1;
  if (col === 3) return 2;
  if (col === 1) return 3;
  if (col === 4) return 4;
  return 999;
};

export const isCuratedOption = (option: AlaCarteOption) => option.isPublished === true;
