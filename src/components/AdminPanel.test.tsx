import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { AdminPanel } from './AdminPanel';
import userEvent from '@testing-library/user-event';
import { getDocs } from 'firebase/firestore/lite';
import type { ProductFeature } from '../types';
import { groupFeaturesByColumn, normalizePositions, sortFeatures } from '../utils/featureOrdering';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}, // Mock db to allow testing
}));

// Mock firebase/firestore/lite
vi.mock('firebase/firestore/lite', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [],
  }),
  orderBy: vi.fn(),
  query: vi.fn(),
}));

// Mock data functions
vi.mock('../data', () => ({
  batchUpdateFeaturesPositions: vi.fn().mockResolvedValue(undefined),
  addFeature: vi.fn().mockResolvedValue(undefined),
  updateFeature: vi.fn().mockResolvedValue(undefined),
}));

// Sample features for testing
const mockFeatures: ProductFeature[] = [
  {
    id: 'feature-1',
    name: 'Test Feature 1',
    description: 'Description 1',
    points: ['Point 1'],
    useCases: ['Use case 1'],
    price: 100,
    cost: 50,
    column: 1,
    position: 0,
    connector: 'AND',
  },
  {
    id: 'feature-2',
    name: 'Test Feature 2',
    description: 'Description 2',
    points: ['Point 2'],
    useCases: ['Use case 2'],
    price: 200,
    cost: 100,
    column: 1,
    position: 1,
    connector: 'OR',
  },
  {
    id: 'feature-3',
    name: 'Test Feature 3',
    description: 'Description 3',
    points: ['Point 3'],
    useCases: ['Use case 3'],
    price: 300,
    cost: 150,
    column: 2,
    position: 0,
    connector: 'AND',
  },
];

describe('AdminPanel', () => {
  const mockOnDataUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to empty features
    vi.mocked(getDocs).mockResolvedValue({
      docs: [],
    } as never);
  });

  it('should render the admin panel title', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText('Admin Control Panel')).toBeInTheDocument();
  });

  it('should render the "Add New Feature" button', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText('Add New Feature')).toBeInTheDocument();
  });

  it('should render the manage features section', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
  });

  it('should show the feature form when "Add New Feature" is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    const addButton = screen.getByText('Add New Feature');
    await user.click(addButton);
    
    // The form should be visible with form labels
    expect(screen.getByLabelText(/Feature Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Retail Price/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Internal Cost/)).toBeInTheDocument();
  });

  it('should show connector options in the feature form', async () => {
    const user = userEvent.setup();
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    const addButton = screen.getByText('Add New Feature');
    await user.click(addButton);
    
    // The form should show connector options
    expect(screen.getByLabelText('connector-and')).toBeInTheDocument();
    expect(screen.getByLabelText('connector-or')).toBeInTheDocument();
  });

  it('should display help text for drag-and-drop and connector toggle', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    // The help text should mention cross-column drag and connector toggle
    expect(screen.getByText(/Drag to reorder or move between columns/)).toBeInTheDocument();
    expect(screen.getByText(/Click AND\/OR to toggle/)).toBeInTheDocument();
  });

  it('should render column headers', async () => {
    // Need to provide some features to see the column grid
    vi.mocked(getDocs).mockResolvedValue({
      docs: mockFeatures.map(f => ({
        id: f.id,
        data: () => ({ ...f, id: undefined }),
      })),
    } as never);
    
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Features by Column')).toBeInTheDocument();
    });
    
    // Columns contain separated text elements, use regex that handles whitespace
    expect(screen.getByText(/Column\s+1/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+2/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+3/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+4/)).toBeInTheDocument();
    expect(screen.getByText(/Gold Tier/)).toBeInTheDocument();
    expect(screen.getByText(/Elite Tier/)).toBeInTheDocument();
    expect(screen.getByText(/Platinum Tier/)).toBeInTheDocument();
    expect(screen.getByText(/Popular Add-ons/)).toBeInTheDocument();
  });

  describe('with features loaded', () => {
    beforeEach(() => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockFeatures.map(f => ({
          id: f.id,
          data: () => ({ ...f, id: undefined }),
        })),
      } as never);
    });

    it('should display features in their respective columns', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 3')).toBeInTheDocument();
    });

    it('should display connector badges on features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Check for AND and OR connector buttons
      const andButtons = screen.getAllByRole('button', { name: /Toggle connector.*AND/i });
      const orButtons = screen.getAllByRole('button', { name: /Toggle connector.*OR/i });
      
      expect(andButtons.length).toBeGreaterThanOrEqual(1);
      expect(orButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should display drag handles for features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Each feature should have a drag handle
      const dragHandles = screen.getAllByRole('button', { name: /Drag.*to reorder/i });
      expect(dragHandles.length).toBe(mockFeatures.length);
    });

    it('should display edit buttons for features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: /Edit/i });
      expect(editButtons.length).toBe(mockFeatures.length);
    });

    it('should display position indicators for features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Position indicators show as #1, #2 (0-indexed + 1)
      // Two features have position 0 (one per column), so we expect multiple #1
      const positionOne = screen.getAllByText('#1');
      expect(positionOne.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should call updateFeature when connector toggle is clicked', async () => {
      const { updateFeature } = await import('../data');
      vi.mocked(updateFeature).mockClear();
      const user = userEvent.setup();
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Find the AND connector button for feature 1 and click it
      const andButton = screen.getByRole('button', { name: /Toggle connector for Test Feature 1.*AND/i });
      await user.click(andButton);
      
      // Verify updateFeature was called (the toggle function changes AND to OR)
      await waitFor(() => {
        expect(updateFeature).toHaveBeenCalled();
      });
      
      // Check that it was called with a connector change
      const calls = vi.mocked(updateFeature).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      // The first call should have connector: 'OR' (toggling from AND)
      const firstCall = calls[0];
      expect(firstCall).toBeDefined();
      if (firstCall) {
        expect(firstCall[1]).toHaveProperty('connector');
      }
    });
  });

  describe('Position Normalization Logic', () => {
    // Create local test features with guaranteed types
    const testFeature1: ProductFeature = {
      id: 'test-1',
      name: 'Test Feature 1',
      description: 'Description 1',
      points: ['Point 1'],
      useCases: ['Use case 1'],
      price: 100,
      cost: 50,
      column: 1,
      position: 0,
      connector: 'AND',
    };
    const testFeature2: ProductFeature = {
      id: 'test-2',
      name: 'Test Feature 2',
      description: 'Description 2',
      points: ['Point 2'],
      useCases: ['Use case 2'],
      price: 200,
      cost: 100,
      column: 1,
      position: 1,
      connector: 'OR',
    };
    const testFeature3: ProductFeature = {
      id: 'test-3',
      name: 'Test Feature 3',
      description: 'Description 3',
      points: ['Point 3'],
      useCases: ['Use case 3'],
      price: 300,
      cost: 150,
      column: 2,
      position: 0,
      connector: 'AND',
    };

    it('should use groupFeaturesByColumn for organizing features', () => {
      const testFeatures: ProductFeature[] = [testFeature1, testFeature2, testFeature3];

      const grouped = groupFeaturesByColumn(testFeatures);

      expect(grouped[1]).toHaveLength(2);
      expect(grouped[2]).toHaveLength(1);
      expect(grouped[3]).toHaveLength(0);
      expect(grouped[4]).toHaveLength(0);
      expect(grouped.unassigned).toHaveLength(0);
    });

    it('should use sortFeatures for consistent ordering', () => {
      // Create features deliberately out of order
      const unsortedFeatures: ProductFeature[] = [
        testFeature3, // column 2
        testFeature1, // column 1, position 0
        testFeature2, // column 1, position 1
      ];

      const sorted = sortFeatures(unsortedFeatures);

      // Column 1 features should come first, then column 2
      expect(sorted[0]?.id).toBe(testFeature1.id);
      expect(sorted[1]?.id).toBe(testFeature2.id);
      expect(sorted[2]?.id).toBe(testFeature3.id);
    });

    it('should normalize positions to be sequential (0..n-1)', () => {
      const featuresWithGaps: ProductFeature[] = [
        { ...testFeature1, position: 0 },
        { ...testFeature2, position: 5 },
        { ...testFeature3, position: 10 },
      ];

      const normalized = normalizePositions(featuresWithGaps);

      expect(normalized[0]?.position).toBe(0);
      expect(normalized[1]?.position).toBe(1);
      expect(normalized[2]?.position).toBe(2);
    });

    it('should preserve connector values during normalization', () => {
      const featuresWithConnectors: ProductFeature[] = [
        { ...testFeature1, position: 0, connector: 'AND' },
        { ...testFeature2, position: 5, connector: 'OR' },
      ];

      const normalized = normalizePositions(featuresWithConnectors);

      expect(normalized[0]?.connector).toBe('AND');
      expect(normalized[1]?.connector).toBe('OR');
    });

    it('should group features with undefined column as unassigned', () => {
      const mixedFeatures: ProductFeature[] = [
        { ...testFeature1, column: 1, position: 0 },
        { ...testFeature2, column: undefined, position: 0 },
      ];

      const grouped = groupFeaturesByColumn(mixedFeatures);

      expect(grouped[1]).toHaveLength(1);
      expect(grouped.unassigned).toHaveLength(1);
      expect(grouped.unassigned[0]?.id).toBe(testFeature2.id);
    });
  });
});
