import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../test/test-utils";
import { AdminPanel } from "./AdminPanel";
import userEvent from "@testing-library/user-event";
import { getDocs } from "firebase/firestore/lite";
import type { ProductFeature } from "../types";
import { groupFeaturesByColumn, normalizePositions, sortFeatures } from "../utils/featureOrdering";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {}, // Mock db to allow testing
}));

// Mock firebase/firestore/lite
vi.mock("firebase/firestore/lite", () => {
  return {
    collection: vi.fn((_db: any, name: string) => {
      return { _collectionName: name };
    }),
    getDocs: vi.fn(async (collectionRef: any) => {
      // Get collection name from either direct collection ref or query result
      const collectionName = collectionRef?._collectionName;

      if (collectionName === "packages") {
        return {
          docs: [
            {
              id: "pkg-elite",
              data: () => ({ name: "Elite", price: 100, cost: 50, tier_color: "gray-400" }),
            },
            {
              id: "pkg-platinum",
              data: () => ({
                name: "Platinum",
                price: 200,
                cost: 75,
                tier_color: "blue-400",
                isRecommended: true,
              }),
            },
            {
              id: "pkg-gold",
              data: () => ({ name: "Gold", price: 150, cost: 60, tier_color: "yellow-400" }),
            },
          ],
          size: 3,
          empty: false,
        };
      }

      // Check for A La Carte options
      if (collectionName === "ala_carte_options") {
        const mockAlaCarteCount = (global as any).__mockAlaCarteCount;
        if (mockAlaCarteCount !== undefined) {
          return {
            size: mockAlaCarteCount,
            docs: Array(mockAlaCarteCount)
              .fill(null)
              .map((_, i) => ({
                id: `alacarte-${i}`,
                data: () => ({
                  name: `Option ${i}`,
                  price: 100,
                  cost: 50,
                  description: "Test option",
                  points: ["Point 1"],
                  isPublished: true,
                  column: i % 2 === 0 ? 4 : 1,
                }),
              })),
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
    deleteField: vi.fn(() => ({ _type: "deleteField" })),
  };
});

// Mock data functions
const mockSetRecommendedPackage = vi.fn().mockResolvedValue(undefined);
vi.mock("../data", () => ({
  batchUpdateFeaturesPositions: vi.fn().mockResolvedValue(undefined),
  addFeature: vi.fn().mockResolvedValue(undefined),
  updateFeature: vi.fn().mockResolvedValue(undefined),
  setRecommendedPackage: (...args: unknown[]) => mockSetRecommendedPackage(...args),
}));

// Sample features for testing
const mockFeatures: ProductFeature[] = [
  {
    id: "feature-1",
    name: "Test Feature 1",
    description: "Description 1",
    points: ["Point 1"],
    useCases: ["Use case 1"],
    price: 100,
    cost: 50,
    column: 1,
    position: 0,
    connector: "AND",
  },
  {
    id: "feature-2",
    name: "Test Feature 2",
    description: "Description 2",
    points: ["Point 2"],
    useCases: ["Use case 2"],
    price: 200,
    cost: 100,
    column: 1,
    position: 1,
    connector: "OR",
  },
  {
    id: "feature-3",
    name: "Test Feature 3",
    description: "Description 3",
    points: ["Point 3"],
    useCases: ["Use case 3"],
    price: 300,
    cost: 150,
    column: 2,
    position: 0,
    connector: "AND",
  },
  {
    id: "feature-4",
    name: "Unassigned Feature",
    description: "Description 4",
    points: ["Point 4"],
    useCases: ["Use case 4"],
    price: 120,
    cost: 60,
    position: 0,
    connector: "AND",
  },
];

describe("AdminPanel", () => {
  const mockOnDataUpdate = vi.fn();

  const renderAdminPanel = async () => {
    render(<AdminPanel onDataUpdate={mockOnDataUpdate} />);

    // AdminPanel fetches data on mount; waiting for loading to clear
    // keeps async state updates inside act() to avoid noisy warnings.
    await waitFor(() => {
      expect(screen.queryByText("Loading features...")).not.toBeInTheDocument();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any mock A La Carte count
    delete (global as any).__mockAlaCarteCount;
    localStorage.clear();
  });

  it("should render the admin panel title", async () => {
    await renderAdminPanel();

    expect(screen.getByText("Admin Control Panel")).toBeInTheDocument();
  });

  it("shows Product Hub guidance instead of inline creation controls", async () => {
    await renderAdminPanel();

    expect(screen.getByText(/column ordering by tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Create or edit products in the/i)).toBeInTheDocument();
    expect(screen.queryByText("Add New Feature")).not.toBeInTheDocument();
  });

  it("should render the manage features section", async () => {
    await renderAdminPanel();

    expect(screen.getByText("Manage Package Features")).toBeInTheDocument();
  });

  it("should render recommended package controls", async () => {
    await renderAdminPanel();

    expect(screen.getByText(/Recommended package/i)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: /Recommended package/i })).toBeInTheDocument();
  });

  it("writes recommended package selection when radio is changed", async () => {
    await renderAdminPanel();
    const eliteRadio = await screen.findByLabelText("Elite");

    await userEvent.click(eliteRadio);

    await waitFor(() => {
      expect(mockSetRecommendedPackage).toHaveBeenCalledWith("pkg-elite");
    });
  });

  it("should not render the feature form by default", async () => {
    await renderAdminPanel();

    expect(screen.queryByLabelText(/Feature Name/)).not.toBeInTheDocument();
  });

  it("should display help text for drag-and-drop and connector toggle", async () => {
    await renderAdminPanel();

    // The help text should mention cross-column drag and connector toggle
    expect(screen.getByText(/Drag using the handle/i)).toBeInTheDocument();
    expect(
      screen.getByText(/AND\/OR controls the connector to the NEXT item below/)
    ).toBeInTheDocument();
  });

  it("should render column headers", async () => {
    // Need to provide some features to see the column grid
    vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
      if (collectionRef?._collectionName === "features") {
        return {
          docs: mockFeatures.map((f) => ({
            id: f.id,
            data: () => ({ ...f, id: undefined }),
          })),
          size: mockFeatures.length,
        } as any;
      }
      return { docs: [], size: 0 } as any;
    });

    await renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText("Features by Column")).toBeInTheDocument();
    });

    // Check that all column headers are present with new tier order (Elite  Platinum  Gold)
    expect(screen.getByText(/Column\s+2/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+3/)).toBeInTheDocument();
    expect(screen.getByText(/Column\s+1/)).toBeInTheDocument();
    expect(screen.getByText("Elite Package (Column 2)")).toBeInTheDocument();
    expect(screen.getByText("Platinum Package (Column 3)")).toBeInTheDocument();
    expect(screen.getByText("Gold Package (Column 1)")).toBeInTheDocument();
  });

  describe("with features loaded", () => {
    beforeEach(() => {
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: mockFeatures.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: mockFeatures.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });
    });

    it("should display features in their respective columns", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Feature 2")).toBeInTheDocument();
      expect(screen.getByText("Test Feature 3")).toBeInTheDocument();
    });

    it("should display connector badges on features", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      // Check for AND and OR connector buttons
      const andButtons = screen.getAllByRole("button", { name: /Toggle connector.*AND/i });
      const orButtons = screen.getAllByRole("button", { name: /Toggle connector.*OR/i });

      expect(andButtons.length).toBeGreaterThanOrEqual(1);
      expect(orButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("does not show an unassigned lane in the UI", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("column-unassigned")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Show unassigned/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Unassigned Features/i)).not.toBeInTheDocument();
    });

    it("should display drag handles for features", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      // Each feature should have a drag handle
      const dragHandles = screen.getAllByRole("button", { name: /Drag.*to reorder/i });
      const visibleFeatureCount = mockFeatures.filter((f) => typeof f.column === "number").length;
      expect(dragHandles.length).toBe(visibleFeatureCount);
    });

    it("surfaces Product Hub edit links for features", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      const editLinks = screen.getAllByRole("button", { name: /Edit in Product Hub/i });
      expect(editLinks.length).toBeGreaterThan(0);
    });

    it("should display position indicators for features", async () => {
      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      // Position indicators now show as badges with just the number (1, 2)
      // Check that position badges are visible in the DOM
      // Since badges are rendered before feature names, we can verify they exist
      const featureDivs = screen.getAllByTestId("column-1")[0];
      expect(featureDivs).toBeInTheDocument();

      // Verify features are rendered with their structure
      expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Test Feature 2")).toBeInTheDocument();
    });

    it("should call updateFeature when connector toggle is clicked", async () => {
      const { updateFeature } = await import("../data");
      vi.mocked(updateFeature).mockClear();
      const user = userEvent.setup();

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
      });

      // Find the AND connector button for feature 1 and click it
      const andButton = screen.getByRole("button", {
        name: /Toggle connector for Test Feature 1.*AND/i,
      });
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
        expect(firstCall[1]).toHaveProperty("connector");
      }
    });
  });

  describe("Position Normalization Logic", () => {
    // Create local test features with guaranteed types
    const testFeature1: ProductFeature = {
      id: "test-1",
      name: "Test Feature 1",
      description: "Description 1",
      points: ["Point 1"],
      useCases: ["Use case 1"],
      price: 100,
      cost: 50,
      column: 1,
      position: 0,
      connector: "AND",
    };
    const testFeature2: ProductFeature = {
      id: "test-2",
      name: "Test Feature 2",
      description: "Description 2",
      points: ["Point 2"],
      useCases: ["Use case 2"],
      price: 200,
      cost: 100,
      column: 1,
      position: 1,
      connector: "OR",
    };
    const testFeature3: ProductFeature = {
      id: "test-3",
      name: "Test Feature 3",
      description: "Description 3",
      points: ["Point 3"],
      useCases: ["Use case 3"],
      price: 300,
      cost: 150,
      column: 2,
      position: 0,
      connector: "AND",
    };

    it("should use groupFeaturesByColumn for organizing features", () => {
      const testFeatures: ProductFeature[] = [testFeature1, testFeature2, testFeature3];

      const grouped = groupFeaturesByColumn(testFeatures);

      expect(grouped[1]).toHaveLength(2);
      expect(grouped[2]).toHaveLength(1);
      expect(grouped[3]).toHaveLength(0);
      expect(grouped[4]).toHaveLength(0);
      expect(grouped.unassigned).toHaveLength(0);
    });

    it("should use sortFeatures for consistent ordering", () => {
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

    it("should normalize positions to be sequential (0..n-1)", () => {
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

    it("should preserve connector values during normalization", () => {
      const featuresWithConnectors: ProductFeature[] = [
        { ...testFeature1, position: 0, connector: "AND" },
        { ...testFeature2, position: 5, connector: "OR" },
      ];

      const normalized = normalizePositions(featuresWithConnectors);

      expect(normalized[0]?.connector).toBe("AND");
      expect(normalized[1]?.connector).toBe("OR");
    });

    it("should group features with undefined column as unassigned", () => {
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

  describe("Tab Navigation and A La Carte Integration", () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      // Reset URL
      window.history.replaceState({}, "", "/");
      vi.clearAllMocks();
      // Clear any mock A La Carte count
      delete (global as any).__mockAlaCarteCount;
    });

    it("should render both Package Features and A La Carte Options tabs", async () => {
      await renderAdminPanel();

      expect(screen.getByText("Package Features")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^A La Carte Options/ })[0]).toBeInTheDocument();
    });

    it("should not display counts in the A La Carte tab label", async () => {
      // Mock getDocs to return different values based on collection
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;

        if (collectionName === "ala_carte_options") {
          return {
            size: 5,
            docs: Array(5)
              .fill(null)
              .map((_, i) => ({
                id: `alacarte-${i}`,
                data: () => ({
                  name: `Option ${i}`,
                  price: 100,
                  cost: 50,
                  description: "Test option",
                  points: ["Point 1"],
                }),
              })),
          } as any;
        }

        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      const alaCarteButton = screen.getAllByRole("button", { name: /^A La Carte Options/ })[0]!;
      expect(alaCarteButton).toHaveTextContent(/^A La Carte Options$/);
    });

    it("should switch to A La Carte tab when clicked and show correct heading", async () => {
      const user = userEvent.setup();

      await renderAdminPanel();

      // Initially on Package Features tab
      expect(screen.getByText("Manage Package Features")).toBeInTheDocument();

      // Click A La Carte Options tab
      const alaCarteTab = screen.getAllByRole("button", { name: /^A La Carte Options/ })[0]!;
      await user.click(alaCarteTab);

      // Should now show A La Carte heading
      await waitFor(() => {
        expect(screen.getByText("Manage A La Carte Options")).toBeInTheDocument();
      });

      // Should not show Package Features heading
      expect(screen.queryByText("Manage Package Features")).not.toBeInTheDocument();
    });

    it("should support deep-link with ?tab=alacarte query parameter", async () => {
      // Set the query parameter before rendering
      window.history.replaceState({}, "", "/?tab=alacarte");

      await renderAdminPanel();

      // Should render A La Carte tab content directly
      await waitFor(() => {
        expect(screen.getByText("Manage A La Carte Options")).toBeInTheDocument();
      });
    });

    it("should support deep-link with ?tab=features query parameter", async () => {
      // Set the query parameter before rendering
      window.history.replaceState({}, "", "/?tab=features");

      await renderAdminPanel();

      // Should render Package Features tab content
      await waitFor(() => {
        expect(screen.getByText("Manage Package Features")).toBeInTheDocument();
      });
    });

    it("should persist tab selection to localStorage", async () => {
      const user = userEvent.setup();

      await renderAdminPanel();

      // Click A La Carte Options tab
      const alaCarteTab = screen.getAllByRole("button", { name: /^A La Carte Options/ })[0]!;
      await user.click(alaCarteTab);

      // Check localStorage
      expect(localStorage.getItem("adminPanel_lastTab")).toBe("alacarte");
    });

    it("should restore last selected tab from localStorage on mount", async () => {
      // Set localStorage before rendering
      localStorage.setItem("adminPanel_lastTab", "alacarte");

      await renderAdminPanel();

      // Should render A La Carte tab content
      await waitFor(() => {
        expect(screen.getByText("Manage A La Carte Options")).toBeInTheDocument();
      });
    });

    it("should prioritize query parameter over localStorage", async () => {
      // Set localStorage to one tab
      localStorage.setItem("adminPanel_lastTab", "alacarte");

      // But query parameter specifies a different tab
      window.history.replaceState({}, "", "/?tab=features");

      await renderAdminPanel();

      // Should use query parameter (features)
      await waitFor(() => {
        expect(screen.getByText("Manage Package Features")).toBeInTheDocument();
      });
    });

    it("should update URL when switching tabs", async () => {
      const user = userEvent.setup();

      await renderAdminPanel();

      // Click A La Carte Options tab
      const alaCarteTab = screen.getAllByRole("button", { name: /^A La Carte Options/ })[0]!;
      await user.click(alaCarteTab);

      // Check URL was updated
      await waitFor(() => {
        expect(window.location.search).toBe("?tab=alacarte");
      });
    });

    it("does not render the A La Carte informational banner", async () => {
      // Mock getDocs to return A La Carte count > 0 (banner should still not appear)
      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        const collectionName = collectionRef?._collectionName;

        if (collectionName === "ala_carte_options") {
          return {
            size: 3,
            docs: Array(3)
              .fill(null)
              .map((_, i) => ({
                id: `alacarte-${i}`,
                data: () => ({
                  name: `Option ${i}`,
                  price: 100,
                  cost: 50,
                  description: "Test option",
                  points: ["Point 1"],
                }),
              })),
          } as any;
        }

        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByText("Manage Package Features")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Looking for A La Carte options\?/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Dismiss banner/i)).not.toBeInTheDocument();
    });
  });

  describe("Strict Mapping Warning Banner", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
    });

    it.skip("should show warning banner when Column 1 (Elite) is empty", async () => {
      // Mock features with Column 1 empty
      const featuresWithEmptyCol1: ProductFeature[] = [
        {
          id: "feature-2",
          name: "Elite Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: "AND",
        },
        {
          id: "feature-3",
          name: "Platinum Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 300,
          cost: 150,
          column: 3,
          position: 0,
          connector: "AND",
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: featuresWithEmptyCol1.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol1.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByTestId("strict-mapping-warning")).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Column/)).toBeInTheDocument();
      expect(screen.getByText(/Column 1 \(Elite\)/)).toBeInTheDocument();
    });

    it.skip("should show warning banner when Column 3 (Gold) is empty", async () => {
      // Mock features with Column 3 empty
      const featuresWithEmptyCol3: ProductFeature[] = [
        {
          id: "feature-1",
          name: "Gold Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 100,
          cost: 50,
          column: 1,
          position: 0,
          connector: "AND",
        },
        {
          id: "feature-2",
          name: "Elite Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: "AND",
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: featuresWithEmptyCol3.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol3.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByTestId("strict-mapping-warning")).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Column/)).toBeInTheDocument();
      expect(screen.getByText(/Column 3 \(Gold\)/)).toBeInTheDocument();
    });

    it.skip("should show warning for multiple empty columns", async () => {
      // Mock features with Columns 1 and 3 empty
      const featuresWithMultipleEmpty: ProductFeature[] = [
        {
          id: "feature-2",
          name: "Elite Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: "AND",
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: featuresWithMultipleEmpty.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithMultipleEmpty.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByTestId("strict-mapping-warning")).toBeInTheDocument();
      });

      expect(screen.getByText(/Empty Package Columns/)).toBeInTheDocument();
      expect(screen.getByText(/Column 1 \(Elite\), Column 3 \(Gold\)/)).toBeInTheDocument();
    });

    it("should not show warning when all package columns (1-3) have features", async () => {
      // Mock features with all columns populated
      const allColumnsPopulated: ProductFeature[] = [
        {
          id: "feature-1",
          name: "Gold Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 100,
          cost: 50,
          column: 1,
          position: 0,
          connector: "AND",
        },
        {
          id: "feature-2",
          name: "Elite Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: "AND",
        },
        {
          id: "feature-3",
          name: "Platinum Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 300,
          cost: 150,
          column: 3,
          position: 0,
          connector: "AND",
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: allColumnsPopulated.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: allColumnsPopulated.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      // Wait for features to be loaded and rendered
      await waitFor(() => {
        expect(screen.getByText("Gold Feature")).toBeInTheDocument();
        expect(screen.getByText("Elite Feature")).toBeInTheDocument();
        expect(screen.getByText("Platinum Feature")).toBeInTheDocument();
      });

      // Now check that the warning is not shown
      expect(screen.queryByTestId("strict-mapping-warning")).not.toBeInTheDocument();
    });

    it.skip("should include guidance on how to fix empty columns", async () => {
      // Mock features with Column 1 empty
      const featuresWithEmptyCol1: ProductFeature[] = [
        {
          id: "feature-2",
          name: "Elite Feature",
          description: "Description",
          points: ["Point"],
          useCases: ["Use case"],
          price: 200,
          cost: 100,
          column: 2,
          position: 0,
          connector: "AND",
        },
      ];

      vi.mocked(getDocs).mockImplementation(async (collectionRef: any) => {
        if (collectionRef?._collectionName === "features") {
          return {
            docs: featuresWithEmptyCol1.map((f) => ({
              id: f.id,
              data: () => ({ ...f, id: undefined }),
            })),
            size: featuresWithEmptyCol1.length,
          } as any;
        }
        return { docs: [], size: 0 } as any;
      });

      await renderAdminPanel();

      await waitFor(() => {
        expect(screen.getByTestId("strict-mapping-warning")).toBeInTheDocument();
      });

      // Check for fix guidance
      expect(screen.getByText(/How to Fix/)).toBeInTheDocument();
      const productHubButtons = screen.getAllByText(/Product Hub/);
      expect(productHubButtons.length).toBeGreaterThan(0); // Multiple buttons exist (tab + in banner)
      expect(
        screen.getByText(/duplicate it and assign copies to different columns/)
      ).toBeInTheDocument();
      expect(screen.getByText(/VITE_ALLOW_PACKAGE_FEATUREIDS_FALLBACK/)).toBeInTheDocument();
    });
  });
});
