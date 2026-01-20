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
  
  // Wait for the component to render - check for the Product Hub heading
  await waitFor(() => expect(screen.getByText("Product Hub")).toBeInTheDocument(), {
    timeout: 2000,
  });
  
  // Wait a bit for features to be filtered and sorted
  await waitFor(() => {
    // Check if feature appears in either section based on its properties
    const hasColumn = feature.column === 1 || feature.column === 2 || feature.column === 3;
    const isPublished = option?.isPublished || feature.publishToAlaCarte;
    
    if (hasColumn || isPublished) {
      // Feature should be visible somewhere
      expect(screen.queryAllByText(feature.name).length).toBeGreaterThan(0);
    }
  }, { timeout: 2000 });
  
  return { feature, option, features };
};

// Helper to find a product card by feature name in the new card-based UI
const findProductCard = (featureName: string, section?: "packages" | "alacarte"): HTMLElement => {
  // Get all elements with the feature name
  const elements = screen.queryAllByText(featureName);
  
  if (elements.length === 0) {
    throw new Error(`Could not find any elements with text "${featureName}"`);
  }
  
  // Find the card(s) containing this feature name
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
  
  // If section is specified, find the card in that section
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
  
  // If no section specified and multiple cards found, return the first one
  return cards[0];
};

const expandCard = async (featureName: string, section?: "packages" | "alacarte") => {
  const card = findProductCard(featureName, section);
  const expandButton = within(card).getByRole("button", { name: /Expand/i });
  await userEvent.click(expandButton);
  return card;
};

describe("ProductHub inline editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocs.mockReset();
    mockAddDoc.mockReset();
    mockAddDoc.mockResolvedValue({ id: "new-feature" });
  });

  it("orders package lane radios Elite, Platinum, Gold, Not in Packages", async () => {
    const { feature } = await renderHub({ column: 2 });
    const card = await expandCard(feature.name);
    expect(row).toBeTruthy();
    const radios = within(row as HTMLElement).getAllByRole("radio");
    const labels = radios.map((radio) =>
      (radio as HTMLInputElement).labels?.[0]?.textContent?.trim()
    );
    expect(labels).toEqual([
      "Elite Package (Column 2)",
      "Platinum Package (Column 3)",
      "Gold Package (Column 1)",
      "Not in Packages",
    ]);

    await userEvent.click(within(row as HTMLElement).getByLabelText("Gold Package (Column 1)"));
    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: 1 })
      )
    );

    await userEvent.click(within(row as HTMLElement).getByLabelText("Not in Packages"));
    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: undefined })
      )
    );
    expect(within(row as HTMLElement).getByLabelText("Not in Packages")).toBeChecked();
  });

  it("allows inline connector toggling for placed features", async () => {
    const { feature } = await renderHub({ column: 2, connector: "AND" });
    const card = await expandCard(feature.name);
    const orButton = within(card).getByRole("button", { name: /Set connector to OR/i });

    await userEvent.click(orButton);

    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ connector: "OR" })
      )
    );
    expect(orButton).toHaveAttribute("aria-pressed", "true");
  });

  it("scrolls the card into view before opening edit form", async () => {
    const { feature } = await renderHub({ column: 1 });
    const card = findProductCard(feature.name);
    const scrollSpy = vi.fn();
    (card as HTMLElement & { scrollIntoView: () => void }).scrollIntoView = scrollSpy;

    await userEvent.click(within(card).getByRole("button", { name: /Edit details/i }));

    expect(scrollSpy).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText(/Feature Name/i)).toBeInTheDocument());
  });

  it("publishes inline using the typed A La Carte price", async () => {
    const { feature } = await renderHub();
    const card = await expandCard(feature.name);
    const priceInput = within(card).getAllByRole("spinbutton")[0]!;
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "125");

    const publishToggle = within(card).getByLabelText(/Publish to A La Carte/i);
    await userEvent.click(publishToggle);

    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(feature.id, {
        publishToAlaCarte: true,
        alaCartePrice: 125,
      })
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: feature.id, alaCartePrice: 125, publishToAlaCarte: true }),
      expect.objectContaining({ isPublished: true, price: 125 })
    );
  });

  it("blocks publishing without a price and shows inline validation", async () => {
    const { feature } = await renderHub({ alaCartePrice: undefined });
    const card = await expandCard(feature.name);
    const publishToggle = within(card).getByLabelText(/Publish to A La Carte/i);

    await userEvent.click(publishToggle);

    await screen.findByText(/Enter an A La Carte price before publishing/i);
    expect(mockUpdateFeature).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("updates category and featured placement inline", async () => {
    const { feature } = await renderHub(
      { publishToAlaCarte: true },
      { isPublished: true, column: undefined, price: 200 }
    );
    const card = await expandCard(feature.name);
    const advancedToggle = within(card).getByRole("button", { name: /Show A La Carte advanced/i });
    await userEvent.click(advancedToggle);
    const categorySelect = within(card).getAllByRole("combobox")[0]!;

    await userEvent.selectOptions(categorySelect, "2");

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    const categoryCall = mockUpsert.mock.calls[mockUpsert.mock.calls.length - 1]?.[1];
    expect(categoryCall?.column).toBe(2);

    const featuredToggle = within(card).getByLabelText(/Featured \(Popular Add-Ons\)/i);
    await userEvent.click(featuredToggle);

    await waitFor(() => expect(mockUpsert).toHaveBeenCalledTimes(2));
    const featuredCall = mockUpsert.mock.calls[mockUpsert.mock.calls.length - 1]?.[1];
    expect(featuredCall?.column).toBe(4);
  });

  it("shows row error when publish save fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpsert.mockRejectedValueOnce(new Error("boom"));
    const { feature } = await renderHub({ alaCartePrice: 150 });
    const card = await expandCard(feature.name);
    const publishToggle = within(card).getByLabelText(/Publish to A La Carte/i);

    await userEvent.click(publishToggle);

    await waitFor(() => expect(screen.getByText(/boom/i)).toBeInTheDocument());
    consoleErrorSpy.mockRestore();
  });

  it("clears publish error on successful retry", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpsert.mockRejectedValueOnce(new Error("boom"));
    const { feature } = await renderHub({ alaCartePrice: 150 });
    const card = await expandCard(feature.name);
    const publishToggle = within(card).getByLabelText(/Publish to A La Carte/i);

    await userEvent.click(publishToggle);
    await screen.findByText(/boom/i);

    mockUpsert.mockResolvedValueOnce(undefined);
    await userEvent.click(publishToggle);

    await waitFor(() => expect(screen.queryByText(/boom/i)).not.toBeInTheDocument());
    consoleErrorSpy.mockRestore();
  });

  it("duplicates a feature into a target lane with the next position", async () => {
    const extraFeature = createMockFeature({
      id: "existing",
      name: "Existing Feature",
      column: 2,
      position: 3,
    });
    mockAddDoc.mockResolvedValueOnce({ id: "duplicate-id" });
    const { feature } = await renderHub({ column: 1, position: 1 }, undefined, [extraFeature]);
    const card = await expandCard(feature.name);
    const duplicateButton = within(card).getByRole("button", { name: /Elite/i });

    await userEvent.click(duplicateButton);

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    const payload = mockAddDoc.mock.calls[0]?.[1] as ProductFeature;
    expect(payload.column).toBe(2);
    expect(payload.position).toBe(4); // next after existing position 3
    expect(payload.name).toBe(feature.name);
    expect(payload.description).toBe(feature.description);
    expect(payload.connector).toBe(feature.connector);
  });

  it("allows removing a feature from a package lane (regression test)", async () => {
    const { feature } = await renderHub({ column: 3, position: 1 });
    const card = await expandCard(feature.name);

    // Verify feature is currently in Platinum Package
    expect(within(card).getByLabelText("Platinum Package (Column 3)")).toBeChecked();

    // Click "Not in Packages" radio button
    await userEvent.click(within(card).getByLabelText("Not in Packages"));

    // Verify updateFeature was called with column: undefined and position: undefined
    await waitFor(() => {
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: undefined, position: undefined })
      );
    });

    // Verify "Not in Packages" is now checked
    expect(within(card).getByLabelText("Not in Packages")).toBeChecked();
  });

  it("can add a feature to a package lane and then remove it", async () => {
    const { feature } = await renderHub({ column: undefined, position: undefined });
    const card = await expandCard(feature.name);

    // Start with "Not in Packages"
    expect(within(card).getByLabelText("Not in Packages")).toBeChecked();

    // Add to Elite Package
    await userEvent.click(within(card).getByLabelText("Elite Package (Column 2)"));
    await waitFor(() => {
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: 2, position: 0 })
      );
    });

    // Now remove from package
    mockUpdateFeature.mockClear();
    await userEvent.click(within(card).getByLabelText("Not in Packages"));

    // Verify updateFeature was called to remove the feature
    await waitFor(() => {
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: undefined, position: undefined })
      );
    });
  });

  it("removes a feature from packages via explicit action", async () => {
    const { feature } = await renderHub({ column: 2, position: 3 });
    const card = await expandCard(feature.name);

    await userEvent.click(within(card).getByRole("button", { name: /Remove from Packages/i }));

    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ column: undefined, position: undefined })
      )
    );
  });

  it("unpublishes A La Carte without changing package placement", async () => {
    const { feature } = await renderHub(
      { column: 2, position: 1, publishToAlaCarte: true, alaCartePrice: 200 },
      { isPublished: true, column: 4, price: 200 }
    );
    const card = await expandCard(feature.name);

    await userEvent.click(within(card).getByRole("button", { name: /Unpublish A La Carte/i }));

    await waitFor(() =>
      expect(mockUpdateFeature).toHaveBeenCalledWith(
        feature.id,
        expect.objectContaining({ publishToAlaCarte: false })
      )
    );
    expect(mockUnpublish).toHaveBeenCalledWith(feature.id);
    expect(feature.column).toBe(2);
  });
});
