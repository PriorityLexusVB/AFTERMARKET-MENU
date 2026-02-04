import { describe, expect, it } from "vitest";
import { PackageSelector } from "./PackageSelector";
import {
  createMockAlaCarteOption,
  createMockFeature,
  createMockPackageTier,
  render,
  screen,
} from "../test/test-utils";
import userEvent from "@testing-library/user-event";

describe("PackageSelector layout", () => {
  it("renders responsive 4-column grid with addon lane without crashing", () => {
    const packages = [
      createMockPackageTier({
        id: "elite",
        name: "Elite",
        features: [createMockFeature({ id: "f1" })],
      }),
      createMockPackageTier({
        id: "platinum",
        name: "Platinum",
        features: [createMockFeature({ id: "f2" })],
      }),
      createMockPackageTier({
        id: "gold",
        name: "Gold",
        features: [createMockFeature({ id: "f3" })],
      }),
    ];

    const addonItems = [createMockAlaCarteOption({ id: "addon-1", name: "Wheel Protection" })];

    render(
      <PackageSelector
        packages={packages}
        allFeaturesForDisplay={[]}
        selectedPackage={null}
        onSelectPackage={() => {}}
        onViewFeature={() => {}}
        addonItems={addonItems}
        selectedAddons={[]}
        onToggleAddon={() => {}}
        onViewAddon={() => {}}
      />
    );

    const grid = screen.getByTestId("package-grid");
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("md:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-4");
    expect(screen.getByText("Add-Ons")).toBeInTheDocument();
  });

  it("shows magnify control in iPad layout and opens a magnified modal", async () => {
    const user = userEvent.setup();
    const packages = [
      createMockPackageTier({
        id: "elite",
        name: "Elite",
        features: [createMockFeature({ id: "f1" })],
      }),
      createMockPackageTier({
        id: "platinum",
        name: "Platinum",
        features: [createMockFeature({ id: "f2" })],
      }),
      createMockPackageTier({
        id: "gold",
        name: "Gold",
        features: [createMockFeature({ id: "f3" })],
      }),
    ];

    const addonItems = [createMockAlaCarteOption({ id: "addon-1", name: "Wheel Protection" })];

    render(
      <PackageSelector
        packages={packages}
        allFeaturesForDisplay={[]}
        selectedPackage={null}
        onSelectPackage={() => {}}
        onViewFeature={() => {}}
        addonItems={addonItems}
        selectedAddons={[]}
        onToggleAddon={() => {}}
        onViewAddon={() => {}}
        isIpadLandscape={true}
      />
    );

    const magnifyButton = screen.getByRole("button", { name: /magnify elite package/i });
    await user.click(magnifyButton);

    expect(screen.getByRole("dialog", { name: /magnified elite package/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close magnified package/i }));

    expect(
      screen.queryByRole("dialog", { name: /magnified elite package/i })
    ).not.toBeInTheDocument();
  });
});
