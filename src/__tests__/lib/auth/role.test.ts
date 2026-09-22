import { roleFromMetadata } from "@/lib/auth/role";

describe("roleFromMetadata", () => {
  it("reconnaît une vendeuse", () => {
    expect(roleFromMetadata({ role: "seller" })).toBe("seller");
  });

  it("retombe sur cliente quand le rôle est absent ou inattendu", () => {
    expect(roleFromMetadata({})).toBe("client");
    expect(roleFromMetadata(null)).toBe("client");
    expect(roleFromMetadata(undefined)).toBe("client");
    expect(roleFromMetadata({ role: "admin" })).toBe("client");
  });
});
