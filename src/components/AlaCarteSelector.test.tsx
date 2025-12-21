import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlaCarteSelector } from './AlaCarteSelector';
import type { AlaCarteOption } from '../types';

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

  it('should only render published items', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Published Option', isPublished: true }),
      createOption({ id: '2', name: 'Unpublished Option', isPublished: false }),
      createOption({ id: '3', name: 'Another Published', isPublished: true }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('Published Option')).toBeInTheDocument();
    expect(screen.getByText('Another Published')).toBeInTheDocument();
    expect(screen.queryByText('Unpublished Option')).not.toBeInTheDocument();
  });

  it('should render items with sourceFeatureId as published (backward compatibility)', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Old Published', sourceFeatureId: 'feature-1' }),
      createOption({ id: '2', name: 'Not Published' }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('Old Published')).toBeInTheDocument();
    expect(screen.queryByText('Not Published')).not.toBeInTheDocument();
  });

  it('should not render items with sourceFeatureId but isPublished false', () => {
    const items: AlaCarteOption[] = [
      createOption({ 
        id: '1', 
        name: 'Explicitly Unpublished', 
        sourceFeatureId: 'feature-1',
        isPublished: false 
      }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.queryByText('Explicitly Unpublished')).not.toBeInTheDocument();
  });

  it('should show "All Options Selected" message when no published items', () => {
    const items: AlaCarteOption[] = [
      createOption({ id: '1', name: 'Unpublished', isPublished: false }),
    ];

    render(<AlaCarteSelector items={items} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('All Options Selected!')).toBeInTheDocument();
  });

  it('should show "All Options Selected" message when items array is empty', () => {
    render(<AlaCarteSelector items={[]} onViewItem={mockOnViewItem} />);

    expect(screen.getByText('All Options Selected!')).toBeInTheDocument();
  });
});
