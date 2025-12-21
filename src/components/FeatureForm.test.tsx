import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { FeatureForm } from './FeatureForm';
import type { ProductFeature } from '../types';

const mockUpdateFeature = vi.fn().mockResolvedValue(undefined);
const mockAddFeature = vi.fn().mockResolvedValue(undefined);
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockUnpublish = vi.fn().mockResolvedValue(undefined);

vi.mock('../data', () => ({
  addFeature: (...args: unknown[]) => mockAddFeature(...args),
  updateFeature: (...args: unknown[]) => mockUpdateFeature(...args),
  upsertAlaCarteFromFeature: (...args: unknown[]) => mockUpsert(...args),
  unpublishAlaCarteFromFeature: (...args: unknown[]) => mockUnpublish(...args),
}));

vi.mock('./ImageUploader', () => ({
  ImageUploader: () => <div>ImageUploader</div>,
}));

const baseFeature: ProductFeature = {
  id: 'feature-1',
  name: 'Test Feature',
  description: 'Test description',
  points: ['Point 1'],
  useCases: ['Use case 1'],
  price: 100,
  cost: 50,
  warranty: 'Standard',
  publishToAlaCarte: true,
  alaCartePrice: 150,
  column: 1,
};

describe('FeatureForm A La Carte publishing', () => {
  beforeEach(() => {
    mockUpdateFeature.mockClear();
    mockAddFeature.mockClear();
    mockUpsert.mockClear();
    mockUnpublish.mockClear();
  });

  it('calls upsert when publish to A La Carte is checked on save', async () => {
    const onSaveSuccess = vi.fn();
    render(<FeatureForm editingFeature={baseFeature} onSaveSuccess={onSaveSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /Update Feature/i }));

    await waitFor(() => expect(mockUpdateFeature).toHaveBeenCalled());
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: baseFeature.id }));
    expect(mockUnpublish).not.toHaveBeenCalled();
  });

  it('calls unpublish when publish to A La Carte is unchecked on save', async () => {
    const onSaveSuccess = vi.fn();
    render(<FeatureForm editingFeature={baseFeature} onSaveSuccess={onSaveSuccess} />);

    const checkbox = screen.getByLabelText(/Offer as A La Carte/i);
    await userEvent.click(checkbox); // uncheck

    await userEvent.click(screen.getByRole('button', { name: /Update Feature/i }));

    await waitFor(() => expect(mockUpdateFeature).toHaveBeenCalled());
    expect(mockUnpublish).toHaveBeenCalledWith(baseFeature.id);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
