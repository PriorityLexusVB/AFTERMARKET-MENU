import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { ProductImage } from './ProductImage';

describe('ProductImage', () => {
  it('should render loading state initially', () => {
    render(<ProductImage src="https://example.com/image.jpg" alt="Test Image" />);

    // Loading skeleton should be visible
    const loadingIndicator = screen.getByRole('img', { hidden: true });
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('should display placeholder when no src provided', () => {
    render(<ProductImage alt="Test Image" showPlaceholder={true} />);

    // Should show placeholder SVG icon
    const placeholder = screen.getByRole('img');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('aria-label', 'Test Image');
  });

  it('should render nothing when no src and showPlaceholder is false', () => {
    const { container } = render(<ProductImage alt="Test Image" showPlaceholder={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('should handle image load success', async () => {
    const { container } = render(
      <ProductImage src="https://example.com/image.jpg" alt="Test Image" className="w-full" />
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', 'Test Image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProductImage
        src="https://example.com/image.jpg"
        alt="Test Image"
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should use fallback src on error', async () => {
    const { container } = render(
      <ProductImage
        src="https://example.com/bad-image.jpg"
        fallbackSrc="https://example.com/fallback.jpg"
        alt="Test Image"
      />
    );

    const img = container.querySelector('img');
    if (img) {
      // Simulate image error
      img.dispatchEvent(new Event('error'));

      // Wait for state update and fallback to be applied
      await waitFor(() => {
        expect(img).toHaveAttribute('src', 'https://example.com/fallback.jpg');
      });
    }
  });
});
