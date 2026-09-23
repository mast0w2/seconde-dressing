import { readAccountState, sendPasswordSetupLink } from "@/lib/auth/account-state";

describe("readAccountState", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const answer = (status: unknown) =>
    fetchMock.mockResolvedValue({ json: async () => ({ status }) });

  it("tells apart the three states that branch the flow", async () => {
    answer("no_account");
    await expect(readAccountState("a@b.fr")).resolves.toBe("no_account");

    answer("no_password");
    await expect(readAccountState("a@b.fr")).resolves.toBe("no_password");

    answer("has_password");
    await expect(readAccountState("a@b.fr")).resolves.toBe("has_password");
  });

  it("treats any unexpected status as unavailable", async () => {
    // The login page must then show its complete form rather than leaving
    // someone in front of a closed door.
    answer("error");
    await expect(readAccountState("a@b.fr")).resolves.toBe("unavailable");

    answer(undefined);
    await expect(readAccountState("a@b.fr")).resolves.toBe("unavailable");
  });

  it("does not shut anyone out when the call fails either", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(readAccountState("a@b.fr")).resolves.toBe("unavailable");
  });

  it("leaves address normalisation to the server", async () => {
    answer("no_account");
    await readAccountState("A@B.fr");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/account-state",
      expect.objectContaining({ body: JSON.stringify({ email: "A@B.fr" }) })
    );
  });
});

describe("sendPasswordSetupLink", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("separates a successful send from the cap and from a failure", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ status: "sent" }) });
    await expect(sendPasswordSetupLink("a@b.fr")).resolves.toBe("sent");

    fetchMock.mockResolvedValue({ json: async () => ({ status: "rate_limited" }) });
    await expect(sendPasswordSetupLink("a@b.fr")).resolves.toBe("rate_limited");

    fetchMock.mockResolvedValue({ json: async () => ({ status: "error" }) });
    await expect(sendPasswordSetupLink("a@b.fr")).resolves.toBe("failed");
  });

  it("reports a failure when the call does not go through", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(sendPasswordSetupLink("a@b.fr")).resolves.toBe("failed");
  });
});
