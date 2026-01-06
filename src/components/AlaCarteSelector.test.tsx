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

  it('should render all published items and hide unpublished', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Published Option', isPublished: true, column: 1 }),
      createOption({ id: '2', name: 'Unpublished Option', isPublished: false, column: 2 }),
      createOption({ id: '3', name: 'Missing Column', isPublished: true }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('Published Option')).toBeInTheDocument();
    expect(screen.queryByText('Unpublished Option')).not.toBeInTheDocument();
    expect(screen.getByText('Missing Column')).toBeInTheDocument();
  });

  it('renders featured items first and sorted by position', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Column 1', isPublished: true, column: 1, position: 1 }),
      createOption({ id: '2', name: 'Featured Later', isPublished: true, column: 4, position: 2 }),
      createOption({ id: '3', name: 'Featured First', isPublished: true, column: 4, position: 0 }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    const buttons = screen.getAllByLabelText(/Learn more about/);
    expect(buttons.map((btn) => btn.textContent)).toEqual(['Featured First', 'Featured Later', 'Column 1']);
  });

  it('shows all published items together in All Add-Ons section', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Placed', isPublished: true, column: 1, position: 0 }),
      createOption({ id: '2', name: 'Loose', isPublished: true }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('All Add-Ons')).toBeInTheDocument();
    expect(screen.getByText('Loose')).toBeInTheDocument();
    expect(screen.getByText('Placed')).toBeInTheDocument();
  });

  it('should show empty state when no curated items', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Unpublished', isPublished: false, column: 1 }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('No add-ons configured')).toBeInTheDocument();
  });

  it('should show empty state when items array is empty', () => {
    render(<AlaCarteSelector items={[]} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('No add-ons configured')).toBeInTheDocument();
  });

  it('shows tap-to-add buttons and disables when already selected', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Tap Add', isPublished: true, column: 1 }),
    ];

    render(
      <AlaCarteSelector
        items={items}
        onViewItem={mockOnViewItem}
        disableDrag
        onToggleItem={vi.fn()}
        selectedIds={['1']}
      />
    );

    expect(screen.getByText('Tap Add')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ADDED/i })).toBeDisabled();
  });
});
