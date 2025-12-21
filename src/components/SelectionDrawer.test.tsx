import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { SelectionDrawer } from './SelectionDrawer';
import { createMockAlaCarteOption, createMockPackageTier } from '../test/test-utils';

describe('SelectionDrawer', () => {
  const pkg = createMockPackageTier({ name: 'Gold', price: 1999 });
  const item = createMockAlaCarteOption({ id: 'opt-1', name: 'Tire Protection', price: 299 });

  it('renders selected package, add-ons, and total', () => {
    render(
      <SelectionDrawer
        selectedPackage={pkg}
        customItems={[item]}
        totalPrice={pkg.price + item.price}
        onRemoveItem={vi.fn()}
        onPrint={vi.fn()}
        onDeselectPackage={vi.fn()}
      />
    );

    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Tire Protection')).toBeInTheDocument();
    expect(screen.getByText('$1,999')).toBeInTheDocument();
    expect(screen.getByText('$299')).toBeInTheDocument();
    expect(screen.getByText('$2,298')).toBeInTheDocument();
  });

  it('calls onRemoveItem when remove is clicked', async () => {
    const onRemoveItem = vi.fn();
    const user = userEvent.setup();

    render(
      <SelectionDrawer
        selectedPackage={pkg}
        customItems={[item]}
        totalPrice={pkg.price + item.price}
        onRemoveItem={onRemoveItem}
        onPrint={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove Tire Protection/i }));
    expect(onRemoveItem).toHaveBeenCalledWith('opt-1');
  });

  it('calls onPrint when print buttons are clicked', async () => {
    const onPrint = vi.fn();
    const user = userEvent.setup();

    render(
      <SelectionDrawer
        selectedPackage={pkg}
        customItems={[]}
        totalPrice={pkg.price}
        onRemoveItem={vi.fn()}
        onPrint={onPrint}
      />
    );

    await user.click(screen.getByRole('button', { name: /Print Selection/i }));
    expect(onPrint).toHaveBeenCalled();
  });

  it('calls onDeselectPackage when clear is clicked', async () => {
    const onDeselectPackage = vi.fn();
    const user = userEvent.setup();

    render(
      <SelectionDrawer
        selectedPackage={pkg}
        customItems={[]}
        totalPrice={pkg.price}
        onRemoveItem={vi.fn()}
        onPrint={vi.fn()}
        onDeselectPackage={onDeselectPackage}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove selected package/i }));
    expect(onDeselectPackage).toHaveBeenCalled();
  });

  it('shows empty add-ons state when none selected', () => {
    render(
      <SelectionDrawer
        selectedPackage={null}
        customItems={[]}
        totalPrice={0}
        onRemoveItem={vi.fn()}
        onPrint={vi.fn()}
      />
    );

    expect(screen.getByText('No add-ons selected')).toBeInTheDocument();
  });
});
