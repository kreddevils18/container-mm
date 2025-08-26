/**
 * Formatter registry for data transformation before Excel export
 * 
 * Implements Single Responsibility Principle - focused only on data formatting.
 * Provides type-safe value transformation with null-safe operations.
 */

import type { Formatter, FormatterRegistry as IFormatterRegistry } from "../types.js";
import { logger } from "@/lib/logger";

/**
 * Implementation of formatter registry for data transformation
 * 
 * Manages a collection of named formatter functions and provides
 * safe application of transformations to data values.
 */
export class FormatterRegistry implements IFormatterRegistry {
  private readonly formatters: Map<string, Formatter> = new Map();

  /**
   * Register a named formatter function
   * 
   * @param name - Unique identifier for the formatter
   * @param fn - Formatter function that transforms values
   */
  register(name: string, fn: Formatter): void {
    this.formatters.set(name, fn);
  }

  /**
   * Apply formatter by name to a value
   * 
   * @param name - Name of registered formatter
   * @param value - Value to transform
   * @returns Transformed value or original value if formatter not found
   */
  apply(name: string, value: unknown): unknown {
    const formatter = this.formatters.get(name);
    
    if (!formatter) {
      logger.warn("Formatter not found in registry", { formatterName: name });
      return value;
    }

    try {
      return formatter(value);
    } catch (error) {
      logger.error("Error applying formatter", { formatterName: name, error });
      return value;
    }
  }

  /**
   * Check if a formatter exists
   * 
   * @param name - Formatter name to check
   * @returns True if formatter is registered
   */
  has(name: string): boolean {
    return this.formatters.has(name);
  }

  /**
   * Get all registered formatter names for debugging
   */
  getRegisteredFormatters(): string[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Clear all registered formatters
   */
  clear(): void {
    this.formatters.clear();
  }
}

/**
 * Register default formatter functions
 * 
 * Provides commonly used data transformations:
 * - currency: Convert strings/numbers to numbers (null-safe)
 * - isoDate: Convert strings to Date objects or preserve existing Dates
 * - boolean: Convert various values to boolean representation
 * - string: Ensure string representation of values
 * - integer: Convert to integer numbers
 * 
 * @param registry - FormatterRegistry instance to populate
 */
export function defaultFormatters(registry: FormatterRegistry): void {
  
  /**
   * Currency formatter - converts values to numbers
   * Handles null/undefined values safely and parses string numbers
   */
  registry.register("currency", (value: unknown): number | null => {
    if (value == null || value === "") {
      return null;
    }
    
    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }
    
    if (typeof value === "string") {
      // Remove common currency symbols and whitespace
      const cleaned = value.replace(/[$,\s]/g, "");
      const parsed = Number.parseFloat(cleaned);
      return Number.isNaN(parsed) ? null : parsed;
    }
    
    // Try to convert other types
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  });

  /**
   * ISO Date formatter - converts strings to Date objects
   * Preserves existing Date objects and handles invalid dates
   */
  registry.register("isoDate", (value: unknown): Date | null => {
    if (value == null || value === "") {
      return null;
    }
    
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    
    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    
    if (typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  });

  /**
   * Boolean formatter - converts values to boolean representation
   */
  registry.register("boolean", (value: unknown): boolean | null => {
    if (value == null) {
      return null;
    }
    
    if (typeof value === "boolean") {
      return value;
    }
    
    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      if (lower === "true" || lower === "yes" || lower === "1" || lower === "có") {
        return true;
      }
      if (lower === "false" || lower === "no" || lower === "0" || lower === "không") {
        return false;
      }
    }
    
    if (typeof value === "number") {
      return value !== 0;
    }
    
    return Boolean(value);
  });

  /**
   * String formatter - ensures string representation
   */
  registry.register("string", (value: unknown): string => {
    if (value == null) {
      return "";
    }
    
    if (typeof value === "string") {
      return value;
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    return String(value);
  });

  /**
   * Integer formatter - converts values to integers
   */
  registry.register("integer", (value: unknown): number | null => {
    if (value == null || value === "") {
      return null;
    }
    
    if (typeof value === "number") {
      return Number.isNaN(value) ? null : Math.round(value);
    }
    
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : Math.round(parsed);
  });

  /**
   * Percentage formatter - converts decimal to percentage (0.15 -> 15)
   */
  registry.register("percentage", (value: unknown): number | null => {
    if (value == null || value === "") {
      return null;
    }
    
    const num = Number(value);
    if (Number.isNaN(num)) {
      return null;
    }
    
    // If value is already in percentage form (>1), return as-is
    if (num > 1) {
      return num;
    }
    
    // Convert decimal to percentage
    return num * 100;
  });

  /**
   * Vietnamese phone formatter - formats Vietnamese phone numbers
   */
  registry.register("vietnamesePhone", (value: unknown): string | null => {
    if (value == null || value === "") {
      return null;
    }
    
    const phoneStr = String(value).replace(/\D/g, ""); // Remove non-digits
    
    if (phoneStr.length === 10 && phoneStr.startsWith("0")) {
      // Format: 0xxx xxx xxx
      return `${phoneStr.slice(0, 4)} ${phoneStr.slice(4, 7)} ${phoneStr.slice(7)}`;
    }
    
    if (phoneStr.length === 9 && !phoneStr.startsWith("0")) {
      // Add leading 0 and format
      return `0${phoneStr.slice(0, 3)} ${phoneStr.slice(3, 6)} ${phoneStr.slice(6)}`;
    }
    
    return String(value); // Return original if doesn't match expected pattern
  });

  /**
   * Vietnamese currency formatter - formats as VND
   */
  registry.register("vietnameseCurrency", (value: unknown): string | null => {
    if (value == null || value === "") {
      return null;
    }
    
    const num = Number(value);
    if (Number.isNaN(num)) {
      return null;
    }
    
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(num);
  });
}