import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { AlaCarteAdminPanel } from './AlaCarteAdminPanel';

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore/lite', () => {
  return {
    collection: vi.fn((_db: any, name: string) => ({ _collectionName: name })),
    orderBy: vi.fn(() => ({})),
    query: vi.fn((collectionRef: any) => collectionRef),
    getDocs: vi.fn(async (collectionRef: any) => {
      if (collectionRef?._collectionName === 'ala_carte_options') {
        return {
          docs: [
            {
              id: 'published-1',
              data: () => ({
                name: 'Published Item',
                price: 100,
                cost: 50,
                description: 'Desc',
                points: ['Point'],
                isPublished: true,
                column: 1,
              }),
            },
            {
              id: 'unpublished-1',
              data: () => ({
                name: 'Unpublished Item',
                price: 100,
                cost: 50,
                description: 'Desc',
                points: ['Point'],
                isPublished: false,
                column: 2,
              }),
            },
            {
              id: 'legacy-1',
              data: () => ({
                name: 'Legacy Item',
                price: 150,
                cost: 75,
                description: 'Legacy desc',
                points: ['Legacy point'],
                // isPublished is undefined (legacy doc)
                column: 3,
              }),
            },
          ],
        };
      }
      return { docs: [] };
    }),
  };
});

vi.mock('../data', () => ({
  batchUpdateAlaCartePositions: vi.fn().mockResolvedValue(undefined),
  updateAlaCarteOption: vi.fn().mockResolvedValue(undefined),
}));

describe('AlaCarteAdminPanel', () => {
  it('shows published and legacy (undefined) A La Carte options in admin', async () => {
    render(<AlaCarteAdminPanel onDataUpdate={vi.fn()} />);

    // Should show published item
    await waitFor(() => expect(screen.getByText('Published Item')).toBeInTheDocument());

    // Should show legacy item (with undefined isPublished)
    expect(screen.getByText('Legacy Item')).toBeInTheDocument();

    // Should NOT show explicitly unpublished item
    expect(screen.queryByText('Unpublished Item')).not.toBeInTheDocument();
  });
});
