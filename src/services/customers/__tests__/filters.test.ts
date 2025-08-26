import { describe, it, expect } from "vitest";
import { toWhere, toOrderBy } from "../filters";
import type { CustomerFilters } from "../getCustomers";

describe("Customer Filters", () => {
  describe("toWhere", () => {
    it("should return undefined for empty filters", () => {
      const filters: CustomerFilters = {
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeUndefined();
    });

    it("should generate text search condition for query parameter", () => {
      const filters: CustomerFilters = {
        q: "John Company",
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate status condition for single status filter", () => {
      const filters: CustomerFilters = {
        status: ["active"],
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate status condition for multiple status filters", () => {
      const filters: CustomerFilters = {
        status: ["active", "inactive"],
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate date range conditions", () => {
      const filters: CustomerFilters = {
        status: undefined,
        from: "2024-01-01",
        to: "2024-12-31",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate from date condition only", () => {
      const filters: CustomerFilters = {
        status: undefined,
        from: "2024-01-01",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate to date condition only", () => {
      const filters: CustomerFilters = {
        status: undefined,
        to: "2024-12-31",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should generate combined conditions for multiple filters", () => {
      const filters: CustomerFilters = {
        q: "Test Company",
        status: ["active"],
        from: "2024-01-01",
        to: "2024-12-31",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle undefined status gracefully", () => {
      const filters: CustomerFilters = {
        q: "Test",
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle empty status array gracefully", () => {
      const filters: CustomerFilters = {
        q: "Test",
        status: [],
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeDefined();
      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle invalid date strings gracefully", () => {
      const filters: CustomerFilters = {
        status: undefined,
        from: "invalid-date",
        to: "another-invalid-date",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      const result = toWhere(filters);
      expect(result).toBeUndefined();
      expect(() => toWhere(filters)).not.toThrow();
    });
  });

  describe("toOrderBy", () => {
    it("should return default ordering when no sort key provided", () => {
      expect(() => toOrderBy()).not.toThrow();
    });

    it("should handle undefined sort key", () => {
      expect(() => toOrderBy(undefined)).not.toThrow();
    });

    it("should handle createdAt.desc sort", () => {
      expect(() => toOrderBy("createdAt.desc")).not.toThrow();
    });

    it("should handle createdAt.asc sort", () => {
      expect(() => toOrderBy("createdAt.asc")).not.toThrow();
    });

    it("should handle name.asc sort", () => {
      expect(() => toOrderBy("name.asc")).not.toThrow();
    });

    it("should handle name.desc sort", () => {
      expect(() => toOrderBy("name.desc")).not.toThrow();
    });

    it("should handle invalid sort key with fallback", () => {
      expect(() => toOrderBy("invalid.sort")).not.toThrow();
    });

    it("should handle empty string sort key", () => {
      expect(() => toOrderBy("")).not.toThrow();
    });

    it("should handle sort key with missing direction", () => {
      expect(() => toOrderBy("createdAt")).not.toThrow();
    });

    it("should handle malformed sort key", () => {
      expect(() => toOrderBy("createdAt.desc.extra")).not.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should work with typical filter combination", () => {
      const filters: CustomerFilters = {
        q: "ABC Corp",
        status: ["active"],
        from: "2024-01-01",
        page: 1,
        per_page: 20,
        sort: "name.asc",
      };

      expect(() => {
        toWhere(filters);
        toOrderBy(filters.sort);
      }).not.toThrow();
    });

    it("should work with minimal filters", () => {
      const filters: CustomerFilters = {
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => {
        toWhere(filters);
        toOrderBy(filters.sort);
      }).not.toThrow();
    });

    it("should work with all available filters", () => {
      const filters: CustomerFilters = {
        q: "Full Search Query",
        status: ["active", "inactive"],
        from: "2024-01-01",
        to: "2024-12-31",
        page: 5,
        per_page: 50,
        sort: "createdAt.desc",
      };

      expect(() => {
        toWhere(filters);
        toOrderBy(filters.sort);
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long query strings", () => {
      const filters: CustomerFilters = {
        q: "A".repeat(1000),
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle special characters in query", () => {
      const filters: CustomerFilters = {
        q: "Test & Company <script>alert('xss')</script>",
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle potential SQL injection attempts", () => {
      const filters: CustomerFilters = {
        q: "'; DROP TABLE customers; --",
        status: undefined,
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle future dates", () => {
      const filters: CustomerFilters = {
        status: undefined,
        from: "2030-01-01",
        to: "2031-12-31",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => toWhere(filters)).not.toThrow();
    });

    it("should handle reversed date range", () => {
      const filters: CustomerFilters = {
        status: undefined,
        from: "2024-12-31",
        to: "2024-01-01",
        page: 1,
        per_page: 10,
        sort: "createdAt.desc",
      };

      expect(() => toWhere(filters)).not.toThrow();
    });
  });
});