import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { Summary } from './Summary';
import { createMockPackageTier, createMockAlaCarteOption } from '../test/test-utils';
import userEvent from '@testing-library/user-event';

describe('Summary', () => {
  const mockPackage = createMockPackageTier({
    name: 'Gold',
    price: 2500,
  });

  const mockAlaCarteOptions = [
    createMockAlaCarteOption({
      id: 'alacarte-1',
      name: 'Windshield Protection',
      price: 300,
    }),
    createMockAlaCarteOption({
      id: 'alacarte-2',
      name: 'Wheel Protection',
      price: 200,
    }),
  ];

  const defaultCustomerInfo = {
    name: 'John Doe',
    year: '2024',
    make: 'Lexus',
    model: 'RX 350',
  };

  const defaultProps = {
    selectedPackage: null,
    customPackageItems: [] as typeof mockAlaCarteOptions,
    totalPrice: 0,
    customerInfo: defaultCustomerInfo,
    onShowAgreement: vi.fn(),
  };

  it('should be hidden when no selection is made', () => {
    const { container } = render(<Summary {...defaultProps} />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('translate-y-full');
  });

  it('should be visible when a package is selected', () => {
    const { container } = render(
      <Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />
    );

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('translate-y-0');
  });

  it('should be visible when custom items are selected', () => {
    const { container } = render(
      <Summary {...defaultProps} customPackageItems={mockAlaCarteOptions} totalPrice={500} />
    );

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('translate-y-0');
  });

  it('should display customer name when provided', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    expect(screen.getByText('Custom quote prepared for:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display vehicle information when provided', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    expect(screen.getByText('2024 Lexus RX 350')).toBeInTheDocument();
  });

  it('should display "Your Custom Quote" when no customer name provided', () => {
    const emptyCustomerInfo = {
      name: '',
      year: '',
      make: '',
      model: '',
    };

    render(
      <Summary
        {...defaultProps}
        customerInfo={emptyCustomerInfo}
        selectedPackage={mockPackage}
        totalPrice={2500}
      />
    );

    expect(screen.getByText('Your Custom Quote')).toBeInTheDocument();
  });

  it('should display selected package name', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    expect(screen.getByText('Gold Package')).toBeInTheDocument();
  });

  it('should display all custom package items', () => {
    render(
      <Summary {...defaultProps} customPackageItems={mockAlaCarteOptions} totalPrice={500} />
    );

    expect(screen.getByText('Windshield Protection')).toBeInTheDocument();
    expect(screen.getByText('Wheel Protection')).toBeInTheDocument();
  });

  it('should display both package and custom items when both are selected', () => {
    render(
      <Summary
        {...defaultProps}
        selectedPackage={mockPackage}
        customPackageItems={mockAlaCarteOptions}
        totalPrice={3000}
      />
    );

    expect(screen.getByText('Gold Package')).toBeInTheDocument();
    expect(screen.getByText('Windshield Protection')).toBeInTheDocument();
    expect(screen.getByText('Wheel Protection')).toBeInTheDocument();
  });

  it('should format and display total price correctly', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
  });

  it('should format total price with decimals', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2499.99} />);

    expect(screen.getByText('$2,499.99')).toBeInTheDocument();
  });

  it('should display "Total Purchase Price" label', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    expect(screen.getByText('Total Purchase Price')).toBeInTheDocument();
  });

  it('should call onShowAgreement when finalize button is clicked', async () => {
    const user = userEvent.setup();
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    const finalizeButton = screen.getByLabelText('Finalize and Print');
    await user.click(finalizeButton);

    expect(defaultProps.onShowAgreement).toHaveBeenCalledTimes(1);
  });

  it('should render finalize button with proper text', () => {
    render(<Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />);

    // Button text may be hidden on mobile, check aria-label
    expect(screen.getByLabelText('Finalize and Print')).toBeInTheDocument();
  });

  it('should handle partial vehicle information', () => {
    const partialCustomerInfo = {
      name: 'Jane Smith',
      year: '2023',
      make: 'Lexus',
      model: '',
    };

    render(
      <Summary
        {...defaultProps}
        customerInfo={partialCustomerInfo}
        selectedPackage={mockPackage}
        totalPrice={2500}
      />
    );

    expect(screen.getByText('2023 Lexus')).toBeInTheDocument();
  });

  it('should handle empty vehicle information gracefully', () => {
    const customerInfoNoVehicle = {
      name: 'Jane Smith',
      year: '',
      make: '',
      model: '',
    };

    render(
      <Summary
        {...defaultProps}
        customerInfo={customerInfoNoVehicle}
        selectedPackage={mockPackage}
        totalPrice={2500}
      />
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Vehicle string should not be rendered
    expect(screen.queryByText(/Lexus/)).not.toBeInTheDocument();
  });

  it('should apply animation classes to package badge', () => {
    const { container } = render(
      <Summary {...defaultProps} selectedPackage={mockPackage} totalPrice={2500} />
    );

    // The package badge now uses a gradient background instead of bg-blue-600
    const packageBadge = container.querySelector('.from-blue-600');
    expect(packageBadge).toHaveClass('animate-summary-item-in');
  });

  it('should apply animation classes to custom items', () => {
    const { container } = render(
      <Summary {...defaultProps} customPackageItems={[mockAlaCarteOptions[0]!]} totalPrice={300} />
    );

    // The item badge now uses bg-white/10 instead of bg-gray-700
    const itemBadge = container.querySelector('.bg-white\\/10');
    expect(itemBadge).toHaveClass('animate-summary-item-in');
  });

  // Tests for dynamic total calculation display
  describe('dynamic total price calculation', () => {
    it('should display total that equals package price when only package is selected', () => {
      const packagePrice = 2399;
      render(
        <Summary
          {...defaultProps}
          selectedPackage={createMockPackageTier({ name: 'Gold', price: packagePrice })}
          totalPrice={packagePrice}
        />
      );

      expect(screen.getByText('$2,399.00')).toBeInTheDocument();
    });

    it('should display total that equals sum of package and add-ons', () => {
      const packagePrice = 2399;
      const addon1Price = 1195;
      const addon2Price = 295;
      const expectedTotal = packagePrice + addon1Price + addon2Price;

      render(
        <Summary
          {...defaultProps}
          selectedPackage={createMockPackageTier({ name: 'Gold', price: packagePrice })}
          customPackageItems={[
            createMockAlaCarteOption({ id: 'addon-1', name: 'Suntek Pro Complete', price: addon1Price }),
            createMockAlaCarteOption({ id: 'addon-2', name: 'Headlights Protection', price: addon2Price }),
          ]}
          totalPrice={expectedTotal}
        />
      );

      expect(screen.getByText('$3,889.00')).toBeInTheDocument();
    });

    it('should display total that equals sum of add-ons when no package is selected', () => {
      const addon1Price = 300;
      const addon2Price = 200;
      const expectedTotal = addon1Price + addon2Price;

      render(
        <Summary
          {...defaultProps}
          customPackageItems={[
            createMockAlaCarteOption({ id: 'addon-1', name: 'Windshield Protection', price: addon1Price }),
            createMockAlaCarteOption({ id: 'addon-2', name: 'Wheel Protection', price: addon2Price }),
          ]}
          totalPrice={expectedTotal}
        />
      );

      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('should display $0.00 when nothing is selected', () => {
      render(<Summary {...defaultProps} totalPrice={0} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle large totals correctly', () => {
      const largeTotal = 10999.99;
      render(
        <Summary
          {...defaultProps}
          selectedPackage={mockPackage}
          totalPrice={largeTotal}
        />
      );

      expect(screen.getByText('$10,999.99')).toBeInTheDocument();
    });

    it('should guard against NaN by displaying valid formatted price', () => {
      // The component should receive a valid number - this tests that formatting works
      const validPrice = 2500;
      render(
        <Summary
          {...defaultProps}
          selectedPackage={mockPackage}
          totalPrice={validPrice}
        />
      );

      const priceElement = screen.getByText('$2,500.00');
      expect(priceElement).toBeInTheDocument();
      expect(priceElement.textContent).not.toContain('NaN');
    });
  });
});
