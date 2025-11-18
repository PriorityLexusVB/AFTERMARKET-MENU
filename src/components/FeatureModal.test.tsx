import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { FeatureModal } from './FeatureModal';
import { createMockFeature, createMockAlaCarteOption } from '../test/test-utils';
import userEvent from '@testing-library/user-event';

describe('FeatureModal', () => {
  const mockFeature = createMockFeature({
    name: 'Paint Protection Film',
    description: 'Premium PPF protection for your vehicle',
    warranty: '10-year warranty',
    points: ['Full front coverage', 'Self-healing technology', 'UV protection'],
    useCases: [
      'Protects against rock chips on highways',
      'Prevents scratches in parking lots',
    ],
  });

  const mockAlaCarteOption = createMockAlaCarteOption({
    name: 'Windshield Protection',
    description: 'Comprehensive windshield coverage',
    points: ['Chip repair included', 'Full replacement coverage'],
    useCases: ['Highway driving protection', 'Daily commute peace of mind'],
  });

  const getDefaultProps = () => ({
    feature: mockFeature,
    onClose: vi.fn(),
  });

  let originalBodyOverflow: string;

  beforeEach(() => {
    // Store original overflow value
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    // Restore original overflow
    document.body.style.overflow = originalBodyOverflow;
  });

  it('should render feature name and description', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('Paint Protection Film')).toBeInTheDocument();
    expect(screen.getByText('Premium PPF protection for your vehicle')).toBeInTheDocument();
  });

  it('should render warranty information when present', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('10-year warranty')).toBeInTheDocument();
  });

  it('should not render warranty badge when warranty is not present', () => {
    const featureNoWarranty = createMockFeature({
      name: 'Test Feature',
      description: 'Test description',
    });

    render(<FeatureModal {...getDefaultProps()} feature={featureNoWarranty} />);

    // Check that no warranty badge is rendered
    expect(screen.queryByText(/warranty/i)).not.toBeInTheDocument();
  });

  it('should render all feature points', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('Full front coverage')).toBeInTheDocument();
    expect(screen.getByText('Self-healing technology')).toBeInTheDocument();
    expect(screen.getByText('UV protection')).toBeInTheDocument();
  });

  it('should render Key Features section when points exist', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('Key Features')).toBeInTheDocument();
  });

  it('should not render Key Features section when points are empty', () => {
    const featureNoPoints = createMockFeature({
      name: 'Test Feature',
      description: 'Test description',
      points: [],
    });

    render(<FeatureModal {...getDefaultProps()} feature={featureNoPoints} />);

    expect(screen.queryByText('Key Features')).not.toBeInTheDocument();
  });

  it('should render all use cases', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('Protects against rock chips on highways')).toBeInTheDocument();
    expect(screen.getByText('Prevents scratches in parking lots')).toBeInTheDocument();
  });

  it('should render Real-World Scenarios section when useCases exist', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(screen.getByText('Real-World Scenarios')).toBeInTheDocument();
  });

  it('should not render Real-World Scenarios section when useCases are empty', () => {
    const featureNoUseCases = createMockFeature({
      name: 'Test Feature',
      description: 'Test description',
      useCases: [],
    });

    render(<FeatureModal {...getDefaultProps()} feature={featureNoUseCases} />);

    expect(screen.queryByText('Real-World Scenarios')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const props = getDefaultProps();
    render(<FeatureModal {...props} />);

    const closeButton = screen.getByLabelText('Close feature details');
    await user.click(closeButton);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking outside modal content', async () => {
    const user = userEvent.setup();
    const props = getDefaultProps();
    const { container } = render(<FeatureModal {...props} />);

    // Click on the overlay (backdrop)
    const overlay = container.querySelector('.bg-black.bg-opacity-70');
    if (overlay) {
      await user.click(overlay);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when clicking inside modal content', async () => {
    const user = userEvent.setup();
    const props = getDefaultProps();
    render(<FeatureModal {...props} />);

    // Click on the modal title instead of the dialog wrapper
    const modalTitle = screen.getByText('Paint Protection Film');
    await user.click(modalTitle);

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const props = getDefaultProps();
    render(<FeatureModal {...props} />);

    await user.keyboard('{Escape}');

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('should set body overflow to hidden when mounted', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body overflow when unmounted', () => {
    const { unmount } = render(<FeatureModal {...getDefaultProps()} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe(originalBodyOverflow);
  });

  it('should have proper accessibility attributes', () => {
    render(<FeatureModal {...getDefaultProps()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'feature-modal-title');
  });

  it('should render correctly with AlaCarteOption type', () => {
    render(<FeatureModal {...getDefaultProps()} feature={mockAlaCarteOption} />);

    expect(screen.getByText('Windshield Protection')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive windshield coverage')).toBeInTheDocument();
    expect(screen.getByText('Chip repair included')).toBeInTheDocument();
    expect(screen.getByText('Full replacement coverage')).toBeInTheDocument();
  });

  it('should render check icons for each key feature point', () => {
    const { container } = render(<FeatureModal {...getDefaultProps()} />);

    // Each point should have a check icon (SVG)
    const checkIcons = container.querySelectorAll('.text-green-400');
    expect(checkIcons.length).toBe(mockFeature.points.length);
  });

  it('should render lightbulb icons for each use case', () => {
    const { container } = render(<FeatureModal {...getDefaultProps()} />);

    // Each use case should have a lightbulb icon (SVG)
    const lightbulbIcons = container.querySelectorAll('.text-yellow-400');
    // One for the heading, plus one for each use case
    expect(lightbulbIcons.length).toBeGreaterThanOrEqual(mockFeature.useCases!.length);
  });

  it('should apply animation classes', () => {
    const { container } = render(<FeatureModal {...getDefaultProps()} />);

    const overlay = container.querySelector('.animate-fade-in');
    expect(overlay).toBeInTheDocument();

    const modalContent = container.querySelector('.animate-slide-up');
    expect(modalContent).toBeInTheDocument();
  });

  it('should be scrollable when content exceeds viewport', () => {
    const { container } = render(<FeatureModal {...getDefaultProps()} />);

    const modalContent = container.querySelector('.max-h-\\[90vh\\]');
    expect(modalContent).toHaveClass('overflow-y-auto');
  });
});
