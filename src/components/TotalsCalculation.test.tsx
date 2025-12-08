import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { Summary } from './Summary';
import { createMockPackageTier, createMockAlaCarteOption } from '../test/test-utils';

describe('Totals Calculation', () => {
  const defaultCustomerInfo = {
    name: 'John Doe',
    year: '2024',
    make: 'Lexus',
    model: 'RX 350',
  };

  describe('Package-only totals', () => {
    it('should display correct total for Elite package ($3,499)', () => {
      const elitePackage = createMockPackageTier({
        name: 'Elite',
        price: 3499,
        cost: 900,
      });

      render(
        <Summary
          selectedPackage={elitePackage}
          customPackageItems={[]}
          totalPrice={3499}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$3,499.00')).toBeInTheDocument();
    });

    it('should display correct total for Platinum package ($2,899)', () => {
      const platinumPackage = createMockPackageTier({
        name: 'Platinum',
        price: 2899,
        cost: 750,
      });

      render(
        <Summary
          selectedPackage={platinumPackage}
          customPackageItems={[]}
          totalPrice={2899}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$2,899.00')).toBeInTheDocument();
    });

    it('should display correct total for Gold package ($2,399)', () => {
      const goldPackage = createMockPackageTier({
        name: 'Gold',
        price: 2399,
        cost: 550,
      });

      render(
        <Summary
          selectedPackage={goldPackage}
          customPackageItems={[]}
          totalPrice={2399}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$2,399.00')).toBeInTheDocument();
    });
  });

  describe('A la carte totals', () => {
    it('should display correct total for single a la carte item', () => {
      const alaCarteItem = createMockAlaCarteOption({
        id: 'suntek-complete',
        name: 'Suntek Pro Complete Package',
        price: 1195,
        cost: 550,
      });

      render(
        <Summary
          selectedPackage={null}
          customPackageItems={[alaCarteItem]}
          totalPrice={1195}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$1,195.00')).toBeInTheDocument();
    });

    it('should display correct total for multiple a la carte items', () => {
      const items = [
        createMockAlaCarteOption({
          id: 'suntek-complete',
          name: 'Suntek Pro Complete Package',
          price: 1195,
          cost: 550,
        }),
        createMockAlaCarteOption({
          id: 'headlights',
          name: 'Headlights Protection',
          price: 295,
          cost: 125,
        }),
      ];

      const totalPrice = 1195 + 295; // 1490

      render(
        <Summary
          selectedPackage={null}
          customPackageItems={items}
          totalPrice={totalPrice}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$1,490.00')).toBeInTheDocument();
    });
  });

  describe('Combined package and a la carte totals', () => {
    it('should display correct total for package + single a la carte', () => {
      const platinumPackage = createMockPackageTier({
        name: 'Platinum',
        price: 2899,
        cost: 750,
      });

      const alaCarteItem = createMockAlaCarteOption({
        id: 'headlights',
        name: 'Headlights Protection',
        price: 295,
        cost: 125,
      });

      const totalPrice = 2899 + 295; // 3194

      render(
        <Summary
          selectedPackage={platinumPackage}
          customPackageItems={[alaCarteItem]}
          totalPrice={totalPrice}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$3,194.00')).toBeInTheDocument();
    });

    it('should display correct total for package + multiple a la carte items', () => {
      const goldPackage = createMockPackageTier({
        name: 'Gold',
        price: 2399,
        cost: 550,
      });

      const items = [
        createMockAlaCarteOption({
          id: 'suntek-standard',
          name: 'Suntek Pro Standard Package',
          price: 795,
          cost: 350,
        }),
        createMockAlaCarteOption({
          id: 'doorcups',
          name: 'Door Cups Only',
          price: 195,
          cost: 75,
        }),
        createMockAlaCarteOption({
          id: 'screen-defender',
          name: 'Screen Defender',
          price: 149,
          cost: 50,
        }),
      ];

      const totalPrice = 2399 + 795 + 195 + 149; // 3538

      render(
        <Summary
          selectedPackage={goldPackage}
          customPackageItems={items}
          totalPrice={totalPrice}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$3,538.00')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should display $0.00 when no selection is made', () => {
      render(
        <Summary
          selectedPackage={null}
          customPackageItems={[]}
          totalPrice={0}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle decimal prices correctly', () => {
      const packageWithDecimal = createMockPackageTier({
        name: 'Custom',
        price: 2499.99,
        cost: 600,
      });

      render(
        <Summary
          selectedPackage={packageWithDecimal}
          customPackageItems={[]}
          totalPrice={2499.99}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$2,499.99')).toBeInTheDocument();
    });

    it('should handle large totals with proper formatting', () => {
      const expensivePackage = createMockPackageTier({
        name: 'Premium',
        price: 9999,
        cost: 5000,
      });

      const expensiveItem = createMockAlaCarteOption({
        id: 'expensive',
        name: 'Expensive Add-on',
        price: 5001,
        cost: 2500,
      });

      const totalPrice = 9999 + 5001; // 15000

      render(
        <Summary
          selectedPackage={expensivePackage}
          customPackageItems={[expensiveItem]}
          totalPrice={totalPrice}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$15,000.00')).toBeInTheDocument();
    });
  });

  describe('Price formatting', () => {
    it('should always display 2 decimal places', () => {
      const packageWithWholeNumber = createMockPackageTier({
        name: 'Test',
        price: 2500,
        cost: 600,
      });

      render(
        <Summary
          selectedPackage={packageWithWholeNumber}
          customPackageItems={[]}
          totalPrice={2500}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      // Should be $2,500.00, not $2,500
      expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    });

    it('should include thousands separator', () => {
      const expensivePackage = createMockPackageTier({
        name: 'Expensive',
        price: 10000,
        cost: 5000,
      });

      render(
        <Summary
          selectedPackage={expensivePackage}
          customPackageItems={[]}
          totalPrice={10000}
          customerInfo={defaultCustomerInfo}
          onShowAgreement={() => {}}
        />
      );

      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    });
  });
});
