import { describe, expect, it } from "vitest";
import { resolveBuildSha } from "./build-provenance";

const SHA = "654470fae2b659e8d50e454bb887513c1d6ee84f";
const OTHER_SHA = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

describe("build provenance", () => {
  it("uses the full checked-out SHA when no CI value is present", () => {
    expect(resolveBuildSha({ environment: {}, checkedOutSha: SHA })).toBe(SHA);
  });

  it("accepts a matching full GitHub SHA", () => {
    expect(resolveBuildSha({ environment: { GITHUB_SHA: SHA }, checkedOutSha: SHA })).toBe(SHA);
  });

  it("accepts a full Cloud Build commit SHA when Git metadata is absent", () => {
    expect(resolveBuildSha({ environment: { COMMIT_SHA: SHA }, checkedOutSha: null })).toBe(SHA);
  });

  it.each(["deadbee", "deadbeefbadc0ffee", ` ${SHA}`, `${SHA} `])(
    "rejects malformed environment provenance %s",
    (value) => {
      expect(() =>
        resolveBuildSha({ environment: { GITHUB_SHA: value }, checkedOutSha: SHA })
      ).toThrow();
    }
  );

  it("rejects a full forged SHA when Git metadata proves another commit", () => {
    expect(() =>
      resolveBuildSha({ environment: { GITHUB_SHA: OTHER_SHA }, checkedOutSha: SHA })
    ).toThrow("does not match");
  });

  it("rejects conflicting provider SHA variables", () => {
    expect(() =>
      resolveBuildSha({
        environment: { GITHUB_SHA: SHA, COMMIT_SHA: OTHER_SHA },
        checkedOutSha: SHA,
      })
    ).toThrow("disagree");
  });

  it("returns unknown when neither Git nor provider provenance exists", () => {
    expect(resolveBuildSha({ environment: {}, checkedOutSha: null })).toBe("unknown");
  });
});
