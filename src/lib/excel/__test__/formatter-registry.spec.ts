import { describe, it, expect, beforeEach } from "vitest";
import { FormatterRegistry, defaultFormatters } from "../core/formatter-registry";

describe("FormatterRegistry", () => {
  let registry: FormatterRegistry;

  beforeEach(() => {
    registry = new FormatterRegistry();
  });

  describe("registration and application", () => {
    it("should register and apply formatters", () => {
      registry.register("double", (value: number) => value * 2);
      
      const result = registry.apply("double", 5);
      expect(result).toBe(10);
    });

    it("should return original value for unregistered formatters", () => {
      const result = registry.apply("nonexistent", "test");
      expect(result).toBe("test");
    });

    it("should handle formatter errors gracefully", () => {
      registry.register("error", () => { throw new Error("Test error"); });
      
      const result = registry.apply("error", "test");
      expect(result).toBe("test");
    });

    it("should check if formatter exists", () => {
      registry.register("test", (x) => x);
      
      expect(registry.has("test")).toBe(true);
      expect(registry.has("nonexistent")).toBe(false);
    });
  });

  describe("utility methods", () => {
    it("should list registered formatters", () => {
      registry.register("formatter1", (x) => x);
      registry.register("formatter2", (x) => x);
      
      const formatters = registry.getRegisteredFormatters();
      expect(formatters).toContain("formatter1");
      expect(formatters).toContain("formatter2");
    });

    it("should clear all formatters", () => {
      registry.register("formatter1", (x) => x);
      registry.clear();
      
      expect(registry.getRegisteredFormatters()).toHaveLength(0);
    });
  });

  describe("defaultFormatters", () => {
    beforeEach(() => {
      defaultFormatters(registry);
    });

    describe("currency formatter", () => {
      it("should convert strings to numbers", () => {
        expect(registry.apply("currency", "12.5")).toBe(12.5);
        expect(registry.apply("currency", "100")).toBe(100);
      });

      it("should handle currency symbols", () => {
        expect(registry.apply("currency", "$12.50")).toBe(12.5);
        expect(registry.apply("currency", "1,234.56")).toBe(1234.56);
      });

      it("should preserve numbers", () => {
        expect(registry.apply("currency", 42.5)).toBe(42.5);
      });

      it("should return null for null/undefined/empty", () => {
        expect(registry.apply("currency", null)).toBe(null);
        expect(registry.apply("currency", undefined)).toBe(null);
        expect(registry.apply("currency", "")).toBe(null);
      });

      it("should return null for invalid numbers", () => {
        expect(registry.apply("currency", "not a number")).toBe(null);
        expect(registry.apply("currency", NaN)).toBe(null);
      });
    });

    describe("isoDate formatter", () => {
      it("should convert ISO date strings to Date objects", () => {
        const result = registry.apply("isoDate", "2024-01-02");
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(0); // January is 0
        expect(result.getDate()).toBe(2);
      });

      it("should preserve existing Date objects", () => {
        const date = new Date("2024-05-01");
        const result = registry.apply("isoDate", date);
        expect(result).toBe(date);
      });

      it("should handle timestamps", () => {
        const timestamp = new Date("2024-01-01").getTime();
        const result = registry.apply("isoDate", timestamp);
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
      });

      it("should return null for null/undefined/empty", () => {
        expect(registry.apply("isoDate", null)).toBe(null);
        expect(registry.apply("isoDate", undefined)).toBe(null);
        expect(registry.apply("isoDate", "")).toBe(null);
      });

      it("should return null for invalid dates", () => {
        expect(registry.apply("isoDate", "not a date")).toBe(null);
        expect(registry.apply("isoDate", "invalid")).toBe(null);
      });
    });

    describe("boolean formatter", () => {
      it("should handle boolean values", () => {
        expect(registry.apply("boolean", true)).toBe(true);
        expect(registry.apply("boolean", false)).toBe(false);
      });

      it("should convert string representations", () => {
        expect(registry.apply("boolean", "true")).toBe(true);
        expect(registry.apply("boolean", "yes")).toBe(true);
        expect(registry.apply("boolean", "1")).toBe(true);
        expect(registry.apply("boolean", "có")).toBe(true);
        
        expect(registry.apply("boolean", "false")).toBe(false);
        expect(registry.apply("boolean", "no")).toBe(false);
        expect(registry.apply("boolean", "0")).toBe(false);
        expect(registry.apply("boolean", "không")).toBe(false);
      });

      it("should handle numbers", () => {
        expect(registry.apply("boolean", 1)).toBe(true);
        expect(registry.apply("boolean", 0)).toBe(false);
        expect(registry.apply("boolean", 42)).toBe(true);
      });

      it("should return null for null/undefined", () => {
        expect(registry.apply("boolean", null)).toBe(null);
        expect(registry.apply("boolean", undefined)).toBe(null);
      });
    });

    describe("Vietnamese specific formatters", () => {
      it("should format Vietnamese phone numbers", () => {
        expect(registry.apply("vietnamesePhone", "0123456789")).toBe("0123 456 789");
        expect(registry.apply("vietnamesePhone", "123456789")).toBe("0123 456 789");
      });

      it("should format Vietnamese currency", () => {
        const result = registry.apply("vietnameseCurrency", 1000000);
        expect(result).toContain("₫");
        expect(result).toContain("1.000.000");
      });
    });

    it("should register all expected default formatters", () => {
      const formatters = registry.getRegisteredFormatters();
      
      expect(formatters).toContain("currency");
      expect(formatters).toContain("isoDate");
      expect(formatters).toContain("boolean");
      expect(formatters).toContain("string");
      expect(formatters).toContain("integer");
      expect(formatters).toContain("percentage");
      expect(formatters).toContain("vietnamesePhone");
      expect(formatters).toContain("vietnameseCurrency");
    });
  });
});