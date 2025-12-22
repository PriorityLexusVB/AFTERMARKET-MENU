import type { AlaCarteOption } from '../types';

export const VALID_ALACARTE_COLUMNS = [1, 2, 3, 4];

export const columnOrderValue = (col?: number) => {
  if (col === 4) return 0;
  if (col === 1) return 1;
  if (col === 2) return 2;
  if (col === 3) return 3;
  return 999;
};

export const isCuratedOption = (option: AlaCarteOption) =>
  option.isPublished === true && (typeof option.column !== 'number' || VALID_ALACARTE_COLUMNS.includes(option.column));
