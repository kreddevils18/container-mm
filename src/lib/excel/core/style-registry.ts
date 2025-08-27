import type { StyleRegistry as IStyleRegistry } from "../types";
import { logger } from "@/lib/logger";

export class StyleRegistry implements IStyleRegistry {
  private readonly styles: Map<string, Record<string, unknown>> = new Map();

  register(name: string, style: Record<string, unknown>): void {
    this.styles.set(name, { ...style });
  }

  resolve(style?: string | Record<string, unknown>, extra?: Record<string, unknown>): unknown | undefined {
    let resolvedStyle: Record<string, unknown> | undefined;

    if (typeof style === "string") {
      resolvedStyle = this.styles.get(style);
      if (!resolvedStyle) {
        logger.warn("Style not found in registry", { styleName: style });
        return extra;
      }
      resolvedStyle = { ...resolvedStyle };
    } else if (style && typeof style === "object") {
      resolvedStyle = { ...style };
    }

    if (extra && typeof extra === "object") {
      if (resolvedStyle) {
        resolvedStyle = this.deepMerge(resolvedStyle, extra);
      } else {
        resolvedStyle = { ...extra };
      }
    }

    return resolvedStyle;
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === "object" && !Array.isArray(value) && key !== "richText") {
        result[key] = this.deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  getRegisteredStyles(): string[] {
    return Array.from(this.styles.keys());
  }

  clear(): void {
    this.styles.clear();
  }
}

export function defaultStyles(registry: StyleRegistry): void {
  registry.register("header", {
    font: {
      bold: true,
      size: 11,
      name: "Calibri"
    },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6E6" }
    },
    alignment: {
      vertical: "middle",
      horizontal: "center",
      wrapText: true
    },
    border: {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } }
    }
  });

  registry.register("text", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      vertical: "top",
      wrapText: true
    }
  });

  registry.register("money", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      horizontal: "right",
      vertical: "middle"
    },
    numFmt: "#,##0.00"
  });

  registry.register("date", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      horizontal: "center",
      vertical: "middle"
    },
    numFmt: "yyyy-mm-dd"
  });

  registry.register("number", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      horizontal: "right",
      vertical: "middle"
    },
    numFmt: "#,##0"
  });

  registry.register("percent", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      horizontal: "right",
      vertical: "middle"
    },
    numFmt: "0.00%"
  });

  registry.register("bold", {
    font: {
      bold: true,
      size: 10,
      name: "Calibri"
    },
    alignment: {
      vertical: "middle"
    }
  });

  registry.register("center", {
    font: {
      size: 10,
      name: "Calibri"
    },
    alignment: {
      horizontal: "center",
      vertical: "middle"
    }
  });
}
