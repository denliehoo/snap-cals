import Purchases from "react-native-purchases";
import { initPurchases, identifyUser, logoutPurchases } from "./use-purchases";

// The hook reads API_KEY at module load from Platform.select + env vars.
// In test env these are empty, so SDK calls are no-ops (early return).
// We test the exported functions directly and verify they guard on empty key.

beforeEach(() => jest.clearAllMocks());

describe("use-purchases", () => {
  describe("initPurchases", () => {
    it("does not call configure when API key is empty", () => {
      initPurchases();
      expect(Purchases.configure).not.toHaveBeenCalled();
    });
  });

  describe("identifyUser", () => {
    it("does not call logIn when API key is empty", async () => {
      await identifyUser("user-123");
      expect(Purchases.logIn).not.toHaveBeenCalled();
    });
  });

  describe("logoutPurchases", () => {
    it("does not call logOut when API key is empty", async () => {
      await logoutPurchases();
      expect(Purchases.logOut).not.toHaveBeenCalled();
    });
  });
});
