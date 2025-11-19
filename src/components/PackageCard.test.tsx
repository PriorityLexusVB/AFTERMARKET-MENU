import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { PackageCard } from './PackageCard';
import { createMockPackageTier, createMockFeature } from '../test/test-utils';
import userEvent from '@testing-library/user-event';

describe('PackageCard', () => {
  const mockFeature1 = createMockFeature({
    id: 'feature-1',
    name: 'Paint Protection Film',
    points: ['Full front coverage', 'Self-healing technology'],
  });

  const mockFeature2 = createMockFeature({
    id: 'feature-2',
    name: 'Ceramic Coating',
    points: ['5-year warranty', 'Hydrophobic protection'],
  });

  const mockFeature3 = createMockFeature({
    id: 'feature-3',
    name: 'Interior Protection',
    points: ['Fabric guard', 'Leather treatment'],
  });

  const defaultProps = {
    packageInfo: createMockPackageTier({
      name: 'Silver',
      price: 1500,
      tier_color: 'gray-400',
      is_recommended: false,
      features: [mockFeature1, mockFeature2],
    }),
    allFeaturesForDisplay: [mockFeature1, mockFeature2, mockFeature3],
    isSelected: false,
    onSelect: vi.fn(),
    onViewFeature: vi.fn(),
  };

  it('should render package name and price', () => {
    const { container } = render(<PackageCard {...defaultProps} />);

    // Package name is uppercase via CSS, but in tests we check the raw text
    expect(screen.getByText(/Silver/i)).toBeInTheDocument();
    // Price is formatted with comma separator - check container for price text
    expect(container.textContent).toContain('$1,500');
  });

  it('should display "Most Popular" badge when is_recommended is true', () => {
    const recommendedPackage = createMockPackageTier({
      ...defaultProps.packageInfo,
      is_recommended: true,
    });

    render(<PackageCard {...defaultProps} packageInfo={recommendedPackage} />);

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('should not display "Most Popular" badge when is_recommended is false', () => {
    render(<PackageCard {...defaultProps} />);

    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
  });

  it('should render all features included in the package', () => {
    render(<PackageCard {...defaultProps} />);

    expect(screen.getByText('Paint Protection Film')).toBeInTheDocument();
    expect(screen.getByText('Ceramic Coating')).toBeInTheDocument();
    // mockFeature3 is not in the package, should not be rendered
    expect(screen.queryByText('Interior Protection')).not.toBeInTheDocument();
  });

  it('should render feature points for each feature', () => {
    render(<PackageCard {...defaultProps} />);

    expect(screen.getByText('*Full front coverage')).toBeInTheDocument();
    expect(screen.getByText('*Self-healing technology')).toBeInTheDocument();
    expect(screen.getByText('*5-year warranty')).toBeInTheDocument();
    expect(screen.getByText('*Hydrophobic protection')).toBeInTheDocument();
  });

  it('should display "AND" dividers between features by default', () => {
    render(<PackageCard {...defaultProps} />);

    const dividers = screen.getAllByText('AND');
    expect(dividers).toHaveLength(1); // One divider between two features
  });

  it('should display "OR" divider for Gold package with Interior Protection', () => {
    const goldPackage = createMockPackageTier({
      name: 'Gold',
      price: 3500,
      tier_color: 'yellow-400',
      features: [mockFeature1, mockFeature2, mockFeature3],
    });

    render(
      <PackageCard
        {...defaultProps}
        packageInfo={goldPackage}
        allFeaturesForDisplay={[mockFeature1, mockFeature2, mockFeature3]}
      />
    );

    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(screen.getAllByText('AND')).toHaveLength(1); // First two features should have AND
  });

  it('should show "Select Plan" button when not selected', () => {
    render(<PackageCard {...defaultProps} />);

    expect(screen.getByText('Select Plan')).toBeInTheDocument();
  });

  it('should show "Selected" button when selected', () => {
    render(<PackageCard {...defaultProps} isSelected={true} />);

    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('should call onSelect when Select Plan button is clicked', async () => {
    const user = userEvent.setup();
    render(<PackageCard {...defaultProps} />);

    const selectButton = screen.getByText('Select Plan');
    await user.click(selectButton);

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onViewFeature when feature name is clicked', async () => {
    const user = userEvent.setup();
    render(<PackageCard {...defaultProps} />);

    const featureButton = screen.getByText('Paint Protection Film');
    await user.click(featureButton);

    expect(defaultProps.onViewFeature).toHaveBeenCalledTimes(1);
    expect(defaultProps.onViewFeature).toHaveBeenCalledWith(mockFeature1);
  });

  it('should apply selected styles when isSelected is true', () => {
    const { container } = render(<PackageCard {...defaultProps} isSelected={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('ring-blue-500');
  });

  it('should have proper accessibility attributes', () => {
    render(<PackageCard {...defaultProps} />);

    const featureButton = screen.getByLabelText('Learn more about Paint Protection Film');
    expect(featureButton).toBeInTheDocument();
  });

  it('should format price correctly', () => {
    const packageWithDecimal = createMockPackageTier({
      ...defaultProps.packageInfo,
      price: 2499.99,
    });

    const { container } = render(<PackageCard {...defaultProps} packageInfo={packageWithDecimal} />);

    // Price formatter uses minimumFractionDigits: 0, which shows decimals if they exist
    // For 2499.99, it will display as $2,499.99 (not rounded)
    expect(container.textContent).toContain('$2,499.99');
  });
});
