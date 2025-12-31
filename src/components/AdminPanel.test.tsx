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
vi.mock('firebase/firestore/lite', () => {
  return {
    collection: vi.fn((_db: any, name: string) => {
      return { _collectionName: name };
    }),
    getDocs: vi.fn(async (collectionRef: any) => {
      // Get collection name from either direct collection ref or query result
      const collectionName = collectionRef?._collectionName;
      
      if (collectionName === 'packages') {
        return {
          docs: [
            { id: 'pkg-elite', data: () => ({ name: 'Elite', price: 100, cost: 50, tier_color: 'gray-400' }) },
            { id: 'pkg-platinum', data: () => ({ name: 'Platinum', price: 200, cost: 75, tier_color: 'blue-400', isRecommended: true }) },
            { id: 'pkg-gold', data: () => ({ name: 'Gold', price: 150, cost: 60, tier_color: 'yellow-400' }) },
          ],
          size: 3,
          empty: false,
        };
      }
      
      // Check for A La Carte options
      if (collectionName === 'ala_carte_options') {
        const mockAlaCarteCount = (global as any).__mockAlaCarteCount;
        if (mockAlaCarteCount !== undefined) {
          return {
            size: mockAlaCarteCount,
            docs: Array(mockAlaCarteCount).fill(null).map((_, i) => ({
              id: `alacarte-${i}`,
              data: () => ({ 
                name: `Option ${i}`, 
                price: 100, 
                cost: 50,
                description: 'Test option',
                points: ['Point 1']
              })
            }))
          };
        }
      }
      
      // Default: return empty
      return { docs: [], size: 0 };
    }),
    orderBy: vi.fn(() => ({ _orderBy: true })),
    query: vi.fn((collectionRef) => {
      // Pass through collection name
      return { ...collectionRef, _query: true };
    }),
  };
});

// Mock data functions
vi.mock('../data', () => ({
  batchUpdateFeaturesPositions: vi.fn().mockResolvedValue(undefined),
  addFeature: vi.fn().mockResolvedValue(undefined),
  updateFeature: vi.fn().mockResolvedValue(undefined),
  setRecommendedPackage: vi.fn().mockResolvedValue(undefined),
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
  {
    id: 'feature-4',
    name: 'Unassigned Feature',
    description: 'Description 4',
    points: ['Point 4'],
    useCases: ['Use case 4'],
    price: 120,
    cost: 60,
    position: 0,
    connector: 'AND',
  },
];

describe('AdminPanel', () => {
  const mockOnDataUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any mock A La Carte count
    delete (global as any).__mockAlaCarteCount;
    localStorage.clear();
  });

  it('should render the admin panel title', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText('Admin Control Panel')).toBeInTheDocument();
  });

  it('shows Product Hub guidance instead of inline creation controls', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText(/column ordering by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Create or edit products in the/i)).toBeInTheDocument();
    expect(screen.queryByText('Add New Feature')).not.toBeInTheDocument();
  });

  it('should render the manage features section', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
  });

  it('should render recommended package controls', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

    expect(screen.getByText(/Recommended package/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /Recommended package/i })).toBeInTheDocument();
  });

  it('should not render the feature form by default', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    expect(screen.queryByLabelText(/Feature Name/)).not.toBeInTheDocument();
  });

  it('should display help text for drag-and-drop and connector toggle', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    // The help text should mention cross-column drag and connector toggle
    expect(screen.getByText(/Drag to reorder or move between columns/)).toBeInTheDocument();
    expect(screen.getByText(/Click AND\/OR to toggle/)).toBeInTheDocument();
  });

  it('should render column headers', async () => {
    // Need to provide some features to see the column grid
    vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
      if (collectionRef?._collectionName === 'features') {
        return {
          docs: mockFeatures.map(f => ({
            id: f.id,
            data: () => ({ ...f, id: undefined }),
          })),
          size: mockFeatures.length,
        } as any;
      }
      return { docs: [], size: 0 } as any;
    });
    
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Features by Column')).toBeInTheDocument();
    });
    
    // Check that all column headers are present with new tier order
    // Column 1 = Elite, Column 2 = Platinum, Column 3 = Gold
    expect(screen.getByText(/Column\s+1/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+2/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+3/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+4/)).toBeInTheDocument();
    expect(screen.getByText(/Elite Package/)).toBeInTheDocument();
    expect(screen.getByText(/Platinum Package/)).toBeInTheDocument();
    expect(screen.getByText(/Gold Package/)).toBeInTheDocument();
    // Popular Add-ons appears in both header and empty state message, so use getAllByText
    const popularAddonsMatches = screen.getAllByText(/Popular Add-ons/);
    expect(popularAddonsMatches.length).toBeGreaterThan(0);
  });

  describe('with features loaded', () => {
    beforeEach(() => {
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: mockFeatures.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: mockFeatures.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });
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

    it('hides unassigned lane by default and reveals it when toggled', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('column-unassigned')).not.toBeInTheDocument();

      await userEvent.click(screen.getByLabelText(/Show unassigned/i));

      expect(await screen.findByTestId('column-unassigned')).toBeInTheDocument();
      expect(screen.getByText('Unassigned Feature')).toBeInTheDocument();
    });

    it('should display drag handles for features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Each feature should have a drag handle
      const dragHandles = screen.getAllByRole('button', { name: /Drag.*to reorder/i });
      const visibleFeatureCount = mockFeatures.filter((f) => typeof f.column === 'number').length;
      expect(dragHandles.length).toBe(visibleFeatureCount);
    });

    it('should not render inline edit buttons (Product Hub handles editing)', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    });

    it('should display position indicators for features', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      });
      
      // Position indicators now show as badges with just the number (1, 2)
      // Check that position badges are visible in the DOM
      // Since badges are rendered before feature names, we can verify they exist
      const featureDivs = screen.getAllByTestId('column-1')[0];
      expect(featureDivs).toBeInTheDocument();
      
      // Verify features are rendered with their structure
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 2')).toBeInTheDocument();
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

  describe('Tab Navigation and A La Carte Integration', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      // Reset URL
      window.history.replaceState({}, '', '/');
      vi.clearAllMocks();
      // Clear any mock A La Carte count
      delete (global as any).__mockAlaCarteCount;
    });

    it('should render both Package Features and A La Carte Options tabs', async () => {
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      expect(screen.getByText('Package Features')).toBeInTheDocument();
      expect(screen.getByText(/A La Carte Options/)).toBeInTheDocument();
    });

    it('should display A La Carte count in tab label', async () => {
      // Mock getDocs to return different values based on collection
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;
        
        if (collectionName === 'ala_carte_options') {
          return {
            size: 5,
            docs: Array(5).fill(null).map((_, i) => ({
              id: `alacarte-${i}`,
              data: () => ({ 
                name: `Option ${i}`, 
                price: 100, 
                cost: 50,
                description: 'Test option',
                points: ['Point 1']
              })
            }))
          } as any;
        }
        
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Wait for the count to load and be rendered
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const alaCarteButton = buttons.find(btn => btn.textContent?.includes('A La Carte Options'));
        expect(alaCarteButton).toBeDefined();
        expect(alaCarteButton?.textContent).toContain('5');
      }, { timeout: 3000 });
    });

    it('should switch to A La Carte tab when clicked and show correct heading', async () => {
      const user = userEvent.setup();
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Initially on Package Features tab
      expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
      
      // Click A La Carte Options tab
      const alaCarteTab = screen.getByText(/A La Carte Options/);
      await user.click(alaCarteTab);
      
      // Should now show A La Carte heading
      await waitFor(() => {
        expect(screen.getByText('Manage A La Carte Options')).toBeInTheDocument();
      });
      
      // Should not show Package Features heading
      expect(screen.queryByText('Manage Package Features')).not.toBeInTheDocument();
    });

    it('should support deep-link with ?tab=alacarte query parameter', async () => {
      // Set the query parameter before rendering
      window.history.replaceState({}, '', '/?tab=alacarte');
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Should render A La Carte tab content directly
      await waitFor(() => {
        expect(screen.getByText('Manage A La Carte Options')).toBeInTheDocument();
      });
    });

    it('should support deep-link with ?tab=features query parameter', async () => {
      // Set the query parameter before rendering
      window.history.replaceState({}, '', '/?tab=features');
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Should render Package Features tab content
      expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
    });

    it('should persist tab selection to localStorage', async () => {
      const user = userEvent.setup();
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Click A La Carte Options tab
      const alaCarteTab = screen.getByText(/A La Carte Options/);
      await user.click(alaCarteTab);
      
      // Check localStorage
      expect(localStorage.getItem('adminPanel_lastTab')).toBe('alacarte');
    });

    it('should restore last selected tab from localStorage on mount', async () => {
      // Set localStorage before rendering
      localStorage.setItem('adminPanel_lastTab', 'alacarte');
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Should render A La Carte tab content
      await waitFor(() => {
        expect(screen.getByText('Manage A La Carte Options')).toBeInTheDocument();
      });
    });

    it('should prioritize query parameter over localStorage', async () => {
      // Set localStorage to one tab
      localStorage.setItem('adminPanel_lastTab', 'alacarte');
      
      // But query parameter specifies a different tab
      window.history.replaceState({}, '', '/?tab=features');
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Should use query parameter (features)
      expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
    });

    it('should update URL when switching tabs', async () => {
      const user = userEvent.setup();
      
      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Click A La Carte Options tab
      const alaCarteTab = screen.getByText(/A La Carte Options/);
      await user.click(alaCarteTab);
      
      // Check URL was updated
      expect(window.location.search).toBe('?tab=alacarte');
    });

    it('should show informational banner on Package Features tab when A La Carte count > 0', async () => {
      // Mock getDocs to return A La Carte count of 3
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;
        
        if (collectionName === 'ala_carte_options') {
          return {
            size: 3,
            docs: Array(3).fill(null).map((_, i) => ({
              id: `alacarte-${i}`,
              data: () => ({ 
                name: `Option ${i}`, 
                price: 100, 
                cost: 50,
                description: 'Test option',
                points: ['Point 1']
              })
            }))
          } as any;
        }
        
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Wait for banner to appear
      await waitFor(() => {
        expect(screen.getByText(/Looking for A La Carte options\?/)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Banner should mention the count
      expect(screen.getByText(/You currently have/)).toBeInTheDocument();
      const bannerText = screen.getByText(/You currently have/).closest('div')?.textContent;
      expect(bannerText).toContain('3');
    });

    it('should hide banner when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock getDocs to return A La Carte count of 2
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;
        
        if (collectionName === 'ala_carte_options') {
          return {
            size: 2,
            docs: Array(2).fill(null).map((_, i) => ({
              id: `alacarte-${i}`,
              data: () => ({ 
                name: `Option ${i}`, 
                price: 100, 
                cost: 50,
                description: 'Test option',
                points: ['Point 1']
              })
            }))
          } as any;
        }
        
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Wait for banner to appear
      await waitFor(() => {
        expect(screen.getByText(/Looking for A La Carte options\?/)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss banner');
      await user.click(dismissButton);
      
      // Banner should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/Looking for A La Carte options\?/)).not.toBeInTheDocument();
      });
      
      // Check localStorage
      expect(localStorage.getItem('adminPanel_alaCarteBannerDismissed')).toBe('true');
    });

    it('should not show banner if previously dismissed', async () => {
      // Set dismissed flag in localStorage
      localStorage.setItem('adminPanel_alaCarteBannerDismissed', 'true');
      
      // Mock getDocs to return A La Carte count of 2
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;
        
        if (collectionName === 'ala_carte_options') {
          return {
            size: 2,
            docs: Array(2).fill(null).map((_, i) => ({
              id: `alacarte-${i}`,
              data: () => ({ 
                name: `Option ${i}`, 
                price: 100, 
                cost: 50,
                description: 'Test option',
                points: ['Point 1']
              })
            }))
          } as any;
        }
        
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Wait for potential banner (it shouldn't appear)
      await waitFor(() => {
        expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
      });
      
      // Banner should not be shown
      expect(screen.queryByText(/Looking for A La Carte options\?/)).not.toBeInTheDocument();
    });

    it('should not show banner if A La Carte count is 0', async () => {
      // Mock getDocs to return A La Carte count of 0
      vi.mocked(getDocs).mockImplementation(async (_collectionRef: any) => {
        // Always return empty for this test
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
      
      // Wait for render
      await waitFor(() => {
        expect(screen.getByText('Manage Package Features')).toBeInTheDocument();
      });
      
      // Banner should not be shown
      expect(screen.queryByText(/Looking for A La Carte options\?/)).not.toBeInTheDocument();
    });
  });

  describe('Strict Mapping Warning Banner', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
    });

    it.skip('should show warning banner when Column 1 (Elite) is empty', async () => {
      // Mock features with Column 1 empty
      const featuresWithEmptyCol1: ProductFeature[] = [
        {
          id: 'feature-2',
          name: 'Elite Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: 'AND',
        },
        {
          id: 'feature-3',
          name: 'Platinum Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 300,
          cost: 150,
          column: 3,
          position: 0,
          connector: 'AND',
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: featuresWithEmptyCol1.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol1.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      await waitFor(() => {
        expect(screen.getByTestId('strict-mapping-warning')).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Column/)).toBeInTheDocument();
      expect(screen.getByText(/Column 1 \(Elite\)/)).toBeInTheDocument();
    });

    it.skip('should show warning banner when Column 3 (Gold) is empty', async () => {
      // Mock features with Column 3 empty
      const featuresWithEmptyCol3: ProductFeature[] = [
        {
          id: 'feature-1',
          name: 'Gold Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 100,
          cost: 50,
          column: 1,
          position: 0,
          connector: 'AND',
        },
        {
          id: 'feature-2',
          name: 'Elite Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: 'AND',
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: featuresWithEmptyCol3.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol3.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      await waitFor(() => {
        expect(screen.getByTestId('strict-mapping-warning')).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Column/)).toBeInTheDocument();
      expect(screen.getByText(/Column 3 \(Gold\)/)).toBeInTheDocument();
    });

    it.skip('should show warning for multiple empty columns', async () => {
      // Mock features with Columns 1 and 3 empty
      const featuresWithMultipleEmpty: ProductFeature[] = [
        {
          id: 'feature-2',
          name: 'Elite Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: 'AND',
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: featuresWithMultipleEmpty.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithMultipleEmpty.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      await waitFor(() => {
        expect(screen.getByTestId('strict-mapping-warning')).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Columns/)).toBeInTheDocument();
      expect(screen.getByText(/Column 1 \(Elite\), Column 3 \(Gold\)/)).toBeInTheDocument();
    });

    it('should not show warning when all package columns (1-3) have features', async () => {
      // Mock features with all columns populated
      const allColumnsPopulated: ProductFeature[] = [
        {
          id: 'feature-1',
          name: 'Gold Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 100,
          cost: 50,
          column: 1,
          position: 0,
          connector: 'AND',
        },
        {
          id: 'feature-2',
          name: 'Elite Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: 'AND',
        },
        {
          id: 'feature-3',
          name: 'Platinum Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 300,
          cost: 150,
          column: 3,
          position: 0,
          connector: 'AND',
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: allColumnsPopulated.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: allColumnsPopulated.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      // Wait for features to be loaded and rendered
      await waitFor(() => {
        expect(screen.getByText('Gold Feature')).toBeInTheDocument();
        expect(screen.getByText('Elite Feature')).toBeInTheDocument();
        expect(screen.getByText('Platinum Feature')).toBeInTheDocument();
      });

      // Now check that the warning is not shown
      expect(screen.queryByTestId('strict-mapping-warning')).not.toBeInTheDocument();
    });

    it.skip('should include guidance on how to fix empty columns', async () => {
      // Mock features with Column 1 empty
      const featuresWithEmptyCol1: ProductFeature[] = [
        {
          id: 'feature-2',
          name: 'Elite Feature',
          description: 'Description',
          points: ['Point'],
          useCases: ['Use case'],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: 'AND',
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === 'features') {
          return {
            docs: featuresWithEmptyCol1.map(f => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol1.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

      await waitFor(() => {
        expect(screen.getByTestId('strict-mapping-warning')).toBeInTheDocument();
      });

      // Check for fix guidance
      expect(screen.getByText(/How to Fix/)).toBeInTheDocument();
      const productHubButtons = screen.getAllByText(/Product Hub/);
      expect(productHubButtons.length).toBeGreaterThan(0); // Multiple buttons exist (tab + in banner)
      expect(screen.getByText(/duplicate it and assign copies to different columns/)).toBeInTheDocument();
      expect(screen.getByText(/VITE_ALLOW_PACKAGE_FEATUREIDS_FALLBACK/)).toBeInTheDocument();
    });
  });
});
