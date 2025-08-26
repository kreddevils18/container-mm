import { describe, it, expect, beforeEach } from "vitest";
import { StyleRegistry, defaultStyles } from "../core/style-registry.js";

describe("StyleRegistry", () => {
  let registry: StyleRegistry;

  beforeEach(() => {
    registry = new StyleRegistry();
  });

  describe("registration and resolution", () => {
    it("should register and resolve named styles", () => {
      const style = { font: { bold: true }, alignment: { horizontal: "center" } };
      registry.register("test", style);

      const resolved = registry.resolve("test");
      expect(resolved).toEqual(style);
    });

    it("should return undefined for unregistered styles", () => {
      const resolved = registry.resolve("nonexistent");
      expect(resolved).toBeUndefined();
    });

    it("should resolve style objects directly", () => {
      const style = { font: { bold: true } };
      const resolved = registry.resolve(style);
      expect(resolved).toEqual(style);
    });

    it("should merge extra properties with named styles", () => {
      registry.register("base", { font: { bold: true } });
      
      const resolved = registry.resolve("base", { alignment: { horizontal: "right" } });
      
      expect(resolved).toEqual({
        font: { bold: true },
        alignment: { horizontal: "right" }
      });
    });

    it("should merge extra properties with style objects", () => {
      const baseStyle = { font: { bold: true } };
      const extra = { alignment: { horizontal: "right" } };
      
      const resolved = registry.resolve(baseStyle, extra);
      
      expect(resolved).toEqual({
        font: { bold: true },
        alignment: { horizontal: "right" }
      });
    });

    it("should deep merge nested style properties", () => {
      registry.register("base", { 
        font: { bold: true, size: 12 },
        border: { top: { style: "thin" } }
      });
      
      const resolved = registry.resolve("base", { 
        font: { italic: true },
        border: { bottom: { style: "thick" } }
      });
      
      expect(resolved).toEqual({
        font: { bold: true, size: 12, italic: true },
        border: { 
          top: { style: "thin" },
          bottom: { style: "thick" }
        }
      });
    });

    it("should override properties with extra values", () => {
      registry.register("money", { numFmt: "#,##0", alignment: { horizontal: "right" } });
      
      const resolved = registry.resolve("money", { numFmt: "0.00" });
      
      expect(resolved.numFmt).toBe("0.00");
      expect(resolved.alignment.horizontal).toBe("right");
    });
  });

  describe("utility methods", () => {
    it("should list registered styles", () => {
      registry.register("style1", {});
      registry.register("style2", {});
      
      const styles = registry.getRegisteredStyles();
      expect(styles).toContain("style1");
      expect(styles).toContain("style2");
    });

    it("should clear all styles", () => {
      registry.register("style1", {});
      registry.clear();
      
      expect(registry.getRegisteredStyles()).toHaveLength(0);
    });
  });

  describe("defaultStyles", () => {
    beforeEach(() => {
      defaultStyles(registry);
    });

    it("should register header style", () => {
      const headerStyle = registry.resolve("header");
      
      expect(headerStyle.font.bold).toBe(true);
      expect(headerStyle.fill.fgColor.argb).toBe("FFE6E6E6");
      expect(headerStyle.alignment.horizontal).toBe("center");
    });

    it("should register money style with number format", () => {
      const moneyStyle = registry.resolve("money");
      
      expect(moneyStyle.numFmt).toBe("#,##0.00");
      expect(moneyStyle.alignment.horizontal).toBe("right");
    });

    it("should register date style with ISO format", () => {
      const dateStyle = registry.resolve("date");
      
      expect(dateStyle.numFmt).toBe("yyyy-mm-dd");
      expect(dateStyle.alignment.horizontal).toBe("center");
    });

    it("should register text style with wrapping", () => {
      const textStyle = registry.resolve("text");
      
      expect(textStyle.alignment.wrapText).toBe(true);
      expect(textStyle.alignment.vertical).toBe("top");
    });

    it("should register all expected default styles", () => {
      const styles = registry.getRegisteredStyles();
      
      expect(styles).toContain("header");
      expect(styles).toContain("text");
      expect(styles).toContain("money");
      expect(styles).toContain("date");
      expect(styles).toContain("number");
      expect(styles).toContain("percent");
      expect(styles).toContain("bold");
      expect(styles).toContain("center");
    });
  });
});