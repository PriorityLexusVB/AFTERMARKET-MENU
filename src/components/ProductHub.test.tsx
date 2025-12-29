import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ProductHub } from './ProductHub';
import { createMockAlaCarteOption, createMockFeature, render, screen, waitFor, within } from '../test/test-utils';
import type { AlaCarteOption, ProductFeature } from '../types';

const mockUpdateFeature = vi.fn().mockResolvedValue(undefined);
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockUnpublish = vi.fn().mockResolvedValue(undefined);
const mockGetDocs = vi.fn();

vi.mock('../data', () => ({
  updateFeature: (...args: unknown[]) => mockUpdateFeature(...args),
  upsertAlaCarteFromFeature: (...args: unknown[]) => mockUpsert(...args),
  unpublishAlaCarteFromFeature: (...args: unknown[]) => mockUnpublish(...args),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore/lite', () => ({
  collection: vi.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: (...args: unknown[]) => args,
  query: (...args: unknown[]) => args,
}));

const stripId = <T extends { id: string }>(item: T) => {
  const { id: _id, ...rest } = item;
  return rest;
};

const renderHub = async (featureOverrides?: Partial<ProductFeature>, optionOverrides?: Partial<AlaCarteOption>) => {
  const feature = createMockFeature({
    id: 'feature-1',
    publishToAlaCarte: false,
    alaCartePrice: undefined,
    column: undefined,
    ...featureOverrides,
  });
  const option = optionOverrides ? createMockAlaCarteOption({ id: feature.id, ...optionOverrides }) : null;

  mockGetDocs.mockResolvedValueOnce({
    docs: [{ id: feature.id, data: () => stripId(feature) }],
  });
  mockGetDocs.mockResolvedValueOnce({
    docs: option ? [{ id: option.id, data: () => stripId(option) }] : [],
  });

  render(<ProductHub onDataUpdate={vi.fn()} onAlaCarteChange={vi.fn()} />);
  await screen.findByText(feature.name);
  return { feature, option };
};

describe('ProductHub inline editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockReset();
  });

  it('orders package lane radios Gold, Elite, Platinum, Not in Packages', async () => {
    const { feature } = await renderHub({ column: 2 });
    const row = screen.getByText(feature.name).closest('tr');
    expect(row).toBeTruthy();
    const radios = within(row as HTMLElement).getAllByRole('radio');
    const labels = radios.map((radio) => (radio as HTMLInputElement).labels?.[0]?.textContent?.trim());
    expect(labels).toEqual(['Gold Package', 'Elite Package', 'Platinum Package', 'Not in Packages']);

    await userEvent.click(within(row as HTMLElement).getByLabelText('Gold Package'));
    await waitFor(() => expect(mockUpdateFeature).toHaveBeenCalledWith(feature.id, expect.objectContaining({ column: 1 })));
  });

  it('publishes inline using the typed A La Carte price', async () => {
    const { feature } = await renderHub();
    const row = screen.getByText(feature.name).closest('tr') as HTMLElement;
    const priceInput = within(row).getAllByRole('spinbutton')[0]!;
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '125');

    const publishToggle = within(row).getByLabelText(/Publish to A La Carte/i);
    await userEvent.click(publishToggle);

    await waitFor(() => expect(mockUpdateFeature).toHaveBeenCalledWith(feature.id, { publishToAlaCarte: true, alaCartePrice: 125 }));
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: feature.id, alaCartePrice: 125, publishToAlaCarte: true }),
      expect.objectContaining({ isPublished: true, price: 125 })
    );
  });

  it('blocks publishing without a price and shows inline validation', async () => {
    const { feature } = await renderHub({ alaCartePrice: undefined });
    const row = screen.getByText(feature.name).closest('tr') as HTMLElement;
    const publishToggle = within(row).getByLabelText(/Publish to A La Carte/i);

    await userEvent.click(publishToggle);

    await screen.findByText(/Enter an A La Carte price before publishing/i);
    expect(mockUpdateFeature).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('updates category and featured placement inline', async () => {
    const { feature } = await renderHub({ publishToAlaCarte: true }, { isPublished: true, column: undefined, price: 200 });
    const row = screen.getByText(feature.name).closest('tr') as HTMLElement;
    const categorySelect = within(row).getAllByRole('combobox')[0]!;

    await userEvent.selectOptions(categorySelect, '2');

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    const categoryCall = mockUpsert.mock.calls[mockUpsert.mock.calls.length - 1]?.[1];
    expect(categoryCall?.column).toBe(2);

    const featuredToggle = within(row).getByLabelText(/Featured \(Popular Add-Ons\)/i);
    await userEvent.click(featuredToggle);

    await waitFor(() => expect(mockUpsert).toHaveBeenCalledTimes(2));
    const featuredCall = mockUpsert.mock.calls[mockUpsert.mock.calls.length - 1]?.[1];
    expect(featuredCall?.column).toBe(4);
  });

  it('shows row error when publish save fails', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('boom'));
    const { feature } = await renderHub({ alaCartePrice: 150 });
    const row = screen.getByText(feature.name).closest('tr') as HTMLElement;
    const publishToggle = within(row).getByLabelText(/Publish to A La Carte/i);

    await userEvent.click(publishToggle);

    await waitFor(() => expect(screen.getByText(/Failed to update publish status/i)).toBeInTheDocument());
  });
});
