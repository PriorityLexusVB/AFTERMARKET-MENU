import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/test-utils';
import { AdminPanel } from './AdminPanel';
import userEvent from '@testing-library/user-event';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: null, // Using null to trigger "Firebase not connected" state
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

describe('AdminPanel', () => {
  const mockOnDataUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should display help text for drag-and-drop and connector toggle', async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);
    
    // The help text should mention cross-column drag and connector toggle
    expect(screen.getByText(/Drag to reorder or move between columns/)).toBeInTheDocument();
    expect(screen.getByText(/Click AND\/OR to toggle/)).toBeInTheDocument();
  });
});
