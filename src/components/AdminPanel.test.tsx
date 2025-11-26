import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { AdminPanel } from './AdminPanel';
import userEvent from '@testing-library/user-event';
import { getDocs } from 'firebase/firestore/lite';
import type { ProductFeature } from '../types';

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
    
    expect(screen.getByText('Manage Features')).toBeInTheDocument();
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

  it('should display helper text for drag and drop functionality', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Drag between columns/)).toBeInTheDocument();
    });
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
      const andButtons = screen.getAllByRole('button', { name: /Toggle connector.*from AND/i });
      const orButtons = screen.getAllByRole('button', { name: /Toggle connector.*from OR/i });
      
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
  });
});
