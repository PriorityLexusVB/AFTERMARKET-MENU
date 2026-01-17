import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "../test/test-utils";
import { AlaCarteAdminPanel } from "./AlaCarteAdminPanel";

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore/lite", () => {
  return {
    collection: vi.fn((_db: any, name: string) => ({ _collectionName: name })),
    orderBy: vi.fn(() => ({})),
    query: vi.fn((collectionRef: any) => collectionRef),
    getDocs: vi.fn(async (collectionRef: any) => {
      if (collectionRef?._collectionName === "ala_carte_options") {
        return {
          docs: [
            {
              id: "published-1",
              data: () => ({
                name: "Published Item",
                price: 100,
                cost: 50,
                description: "Desc",
                points: ["Point"],
                isPublished: true,
                column: 1,
              }),
            },
            {
              id: "published-unplaced",
              data: () => ({
                name: "Published Unplaced",
                price: 110,
                cost: 55,
                description: "Unplaced published",
                points: ["Point"],
                isPublished: true,
              }),
            },
            {
              id: "unpublished-1",
              data: () => ({
                name: "Unpublished Item",
                price: 100,
                cost: 50,
                description: "Desc",
                points: ["Point"],
                isPublished: false,
                column: 2,
              }),
            },
            {
              id: "unpublished-unplaced",
              data: () => ({
                name: "Unpublished Unplaced",
                price: 90,
                cost: 45,
                description: "Unplaced unpublished",
                points: ["Point"],
                isPublished: false,
              }),
            },
            {
              id: "legacy-1",
              data: () => ({
                name: "Legacy Item",
                price: 150,
                cost: 75,
                description: "Legacy desc",
                points: ["Legacy point"],
                // isPublished is undefined (legacy doc)
                column: 3,
              }),
            },
            {
              id: "missing-name",
              data: () => ({
                price: 80,
                cost: 40,
                description: "Missing name doc",
                points: ["Point"],
                isPublished: true,
                column: 1,
              }),
            },
          ],
        };
      }
      return { docs: [] };
    }),
    deleteField: vi.fn(() => ({ _type: "deleteField" })),
  };
});

vi.mock("../data", () => ({
  batchUpdateAlaCartePositions: vi.fn().mockResolvedValue(undefined),
  updateAlaCarteOption: vi.fn().mockResolvedValue(undefined),
}));

describe("AlaCarteAdminPanel", () => {
  it("defaults to published-only view with published lane", async () => {
    render(<AlaCarteAdminPanel onDataUpdate={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Published Item")).toBeInTheDocument());
    expect(screen.getByText("Published Unplaced")).toBeInTheDocument();
    expect(screen.getByText("Published (Not featured)")).toBeInTheDocument();
    expect(screen.queryByText("Legacy Item")).not.toBeInTheDocument();
    expect(screen.queryByText("Unpublished Item")).not.toBeInTheDocument();
    expect(screen.queryByText(/Visible\s+\d+\s+\/\s+Total\s+\d+/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hidden items/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Show legacy/i })).not.toBeInTheDocument();
  });
