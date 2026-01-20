import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ProductHub } from "./ProductHub";
import {
  createMockAlaCarteOption,
  createMockFeature,
  render,
  screen,
  waitFor,
  within,
} from "../test/test-utils";
import type { AlaCarteOption, ProductFeature } from "../types";

const mockUpdateFeature = vi.fn().mockResolvedValue(undefined);
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockUnpublish = vi.fn().mockResolvedValue(undefined);
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();

vi.mock("../data", () => ({
  updateFeature: (...args: unknown[]) => mockUpdateFeature(...args),
  upsertAlaCarteFromFeature: (...args: unknown[]) => mockUpsert(...args),
  unpublishAlaCarteFromFeature: (...args: unknown[]) => mockUnpublish(...args),
  batchUpdateFeaturePositions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore/lite", () => ({
  collection: vi.fn(),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: (...args: unknown[]) => args,
  query: (...args: unknown[]) => args,
  deleteField: vi.fn(() => ({ _type: "deleteField" })),
}));

const renderHub = async (
  featureOverrides?: Partial<ProductFeature>,
  optionOverrides?: Partial<AlaCarteOption>,
  additionalFeatures: ProductFeature[] = []
) => {
  const feature = createMockFeature({
    id: "feature-1",
    publishToAlaCarte: false,
    alaCartePrice: undefined,
    column: undefined,
    ...featureOverrides,
  });
  const option = optionOverrides
    ? createMockAlaCarteOption({ id: feature.id, ...optionOverrides })
    : null;
  const features = [feature, ...additionalFeatures];

  render(
    <ProductHub
      onDataUpdate={vi.fn()}
      onAlaCarteChange={vi.fn()}
      initialFeatures={features}
      initialAlaCarteOptions={option ? [option] : []}
    />
  );
  
  // Wait for the component to render
  await waitFor(() => expect(screen.getByText("Product Hub")).toBeInTheDocument(), {
    timeout: 2000,
  });
  
  return { feature, option, features };
};

// Helper to find a product card by feature name
const findProductCard = (featureName: string, section?: "packages" | "alacarte"): HTMLElement => {
  const elements = screen.queryAllByText(featureName);
  
  if (elements.length === 0) {
    throw new Error(`Could not find any elements with text "${featureName}"`);
  }
  
  const cards: HTMLElement[] = [];
  for (const element of elements) {
    const card = element.closest('[class*="bg-gray-800"]');
    if (card) {
      cards.push(card as HTMLElement);
    }
  }
  
  if (cards.length === 0) {
    throw new Error(`Could not find product card for "${featureName}"`);
  }
  
  if (section) {
    const sectionHeading = section === "packages" ? "Packages Section" : "A La Carte Section";
    const sectionElement = screen.getByText(sectionHeading);
    const sectionContainer = sectionElement.closest('[class*="bg-gray-900/30"]');
    
    for (const card of cards) {
      if (sectionContainer?.contains(card)) {
        return card;
      }
    }
    
    throw new Error(`Could not find product card for "${featureName}" in ${section} section`);
  }
  
  // TypeScript: cards.length is guaranteed > 0 due to check above
  return cards[0]!;
};

describe("ProductHub drag-and-drop interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockReset();
    mockAddDoc.mockReset();
    mockAddDoc.mockResolvedValue({ id: "new-feature" });
  });

  it("renders two-column layout with Packages and A La Carte sections", async () => {
    await renderHub({ column: 2 });
    
    expect(screen.getByText("Packages Section")).toBeInTheDocument();
    expect(screen.getByText("A La Carte Section")).toBeInTheDocument();
  });

  it("displays product in Packages section when it has a column assignment", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    expect(card).toBeInTheDocument();
    expect(within(card).getByText(feature.name)).toBeInTheDocument();
  });

  it("displays product in A La Carte section when it's published", async () => {
    const { feature } = await renderHub(
      { publishToAlaCarte: true, alaCartePrice: 100 },
      { isPublished: true, column: undefined, price: 100 }
    );
    
    const card = findProductCard(feature.name, "alacarte");
    expect(card).toBeInTheDocument();
  });

  it("displays product in both sections when it's in a package AND published", async () => {
    const { feature } = await renderHub(
      { column: 2, publishToAlaCarte: true, alaCartePrice: 100 },
      { isPublished: true, column: undefined, price: 100 }
    );
    
    const packagesCard = findProductCard(feature.name, "packages");
    const alaCarteCard = findProductCard(feature.name, "alacarte");
    
    expect(packagesCard).toBeInTheDocument();
    expect(alaCarteCard).toBeInTheDocument();
  });

  it("shows Expand button for product cards", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    const expandButton = within(card).getByRole("button", { name: /Expand/i });
    
    expect(expandButton).toBeInTheDocument();
  });

  it("shows Edit details button", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    const editButton = within(card).getByRole("button", { name: /Edit details/i });
    
    expect(editButton).toBeInTheDocument();
  });

  it("shows Duplicate button with dropdown menu", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    const duplicateButton = within(card).getByRole("button", { name: /Duplicate/i });
    
    expect(duplicateButton).toBeInTheDocument();
  });

  it("duplicates product to selected package column", async () => {
    const extraFeature = createMockFeature({
      id: "existing",
      name: "Existing Feature",
      column: 1,
      position: 3,
    });
    mockAddDoc.mockResolvedValueOnce({ id: "duplicate-id" });
    
    const { feature } = await renderHub({ column: 2, position: 1 }, undefined, [extraFeature]);
    
    const card = findProductCard(feature.name, "packages");
    const duplicateButton = within(card).getByRole("button", { name: /Duplicate/i });
    
    await userEvent.click(duplicateButton);
    
    // Wait for dropdown menu to appear
    await waitFor(() => {
      expect(within(card).queryByText("→ Gold")).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Click "→ Gold" option in dropdown menu
    const goldOption = within(card).getByText("→ Gold");
    await userEvent.click(goldOption);
    
    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    const payload = mockAddDoc.mock.calls[0]?.[1] as ProductFeature;
    expect(payload.column).toBe(1);
    expect(payload.position).toBe(4); // next after existing position 3
    expect(payload.name).toBe(feature.name);
  });

  it("shows position badge on cards", async () => {
    const { feature } = await renderHub({ column: 2, position: 0 });
    
    const card = findProductCard(feature.name, "packages");
    // Position badge shows position + 1 (1-based for users)
    expect(within(card).getByText("1")).toBeInTheDocument();
  });

  it("displays package lane label on card", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    expect(within(card).getByText("Elite Package (Column 2)")).toBeInTheDocument();
  });

  it("displays published status on card", async () => {
    const { feature } = await renderHub({ column: 2, publishToAlaCarte: true },  { isPublished: true });
    
    const card = findProductCard(feature.name, "packages");
    expect(within(card).getByText("Published")).toBeInTheDocument();
  });

  it("displays unpublished status on card", async () => {
    const { feature } = await renderHub({ column: 2 });
    
    const card = findProductCard(feature.name, "packages");
    expect(within(card).getByText("Unpublished")).toBeInTheDocument();
  });
});
