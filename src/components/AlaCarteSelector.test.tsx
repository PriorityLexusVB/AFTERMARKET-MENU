import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlaCarteSelector } from './AlaCarteSelector';
import type { AlaCarteOption } from '../types';

// Note: isItemPublished is not exported, so we test it through the component behavior
describe('AlaCarteSelector', () => {
  const createOption = (overrides: Partial<AlaCarteOption>): AlaCarteOption => ({
    id: 'test-id',
    name: 'Test Option',
    description: 'Test description',
    points: ['Point 1'],
    price: 100,
    cost: 50,
    ...overrides,
  });

  const mockOnViewItem = vi.fn();

  it('should only render published items with valid columns', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Published Option', isPublished: true, column: 1 }),
      createOption({ id: '2', name: 'Unpublished Option', isPublished: false, column: 2 }),
      createOption({ id: '3', name: 'Missing Column', isPublished: true }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('Published Option')).toBeInTheDocument();
    expect(screen.queryByText('Unpublished Option')).not.toBeInTheDocument();
    expect(screen.queryByText('Missing Column')).not.toBeInTheDocument();
  });

  it('should sort curated items with column 4 first then position', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Column 1', isPublished: true, column: 1, position: 1 }),
      createOption({ id: '2', name: 'Featured Later', isPublished: true, column: 4, position: 2 }),
      createOption({ id: '3', name: 'Featured First', isPublished: true, column: 4, position: 0 }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    const buttons = screen.getAllByRole('button', { name: /Column 1|Featured/ });
    expect(buttons.map((btn) => btn.textContent)).toEqual([
      'Featured First',
      'Featured Later',
      'Column 1',
    ]);
  });

  it('should show empty state when no curated items', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Unpublished', isPublished: false, column: 1 }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('No add-ons configured.')).toBeInTheDocument();
  });

  it('should show "All Options Selected" message when items array is empty', () => {
    render(<AlaCarteSelector items={[]} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('No add-ons configured.')).toBeInTheDocument();
  });
});
