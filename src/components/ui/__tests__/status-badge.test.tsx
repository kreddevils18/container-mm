/**
 * @fileoverview Tests for StatusBadge component
 * @module components/ui/__tests__/status-badge.test
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getStatusConfig, isValidStatus, StatusBadge } from "../status-badge";

/**
 * Test suite for StatusBadge component.
 *
 * Tests component rendering, accessibility, and utility functions.
 * Ensures consistent status display across the application.
 */
describe("StatusBadge", () => {
  /**
   * Tests that active status renders correctly with proper styling.
   */
  it("should render active status with correct styling", () => {
    render(<StatusBadge status="active" label="Hoạt động" />);

    const badge = screen.getByLabelText("Trạng thái hoạt động");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("Hoạt động")).toBeInTheDocument();
  });

  /**
   * Tests that inactive status renders correctly with proper styling.
   */
  it("should render inactive status with correct styling", () => {
    render(<StatusBadge status="inactive" label="Không hoạt động" />);

    const badge = screen.getByLabelText("Trạng thái không hoạt động");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("Không hoạt động")).toBeInTheDocument();
  });

  /**
   * Tests that status indicator dot is rendered by default.
   */
  it("should render status indicator dot by default", () => {
    render(<StatusBadge status="active" label="Hoạt động" />);

    const badge = screen.getByLabelText("Trạng thái hoạt động");
    const indicator = badge.querySelector("[aria-hidden='true']");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("h-2", "w-2", "rounded-full", "bg-green-400");
  });

  /**
   * Tests that status indicator can be hidden.
   */
  it("should hide status indicator when showIndicator is false", () => {
    render(<StatusBadge status="active" label="Hoạt động" showIndicator={false} />);

    const badge = screen.getByLabelText("Trạng thái hoạt động");
    const indicator = badge.querySelector("[aria-hidden='true']");
    expect(indicator).not.toBeInTheDocument();
  });

  /**
   * Tests that custom aria-label overrides default.
   */
  it("should use custom aria-label when provided", () => {
    render(
      <StatusBadge
        status="active"
        label="Hoạt động"
        ariaLabel="Custom accessibility label"
      />
    );

    const badge = screen.getByLabelText("Custom accessibility label");
    expect(badge).toBeInTheDocument();
  });

  /**
   * Tests that additional className is applied correctly.
   */
  it("should apply additional className", () => {
    render(
      <StatusBadge status="active" label="Hoạt động" className="custom-class" />
    );

    const badge = screen.getByLabelText("Trạng thái hoạt động");
    expect(badge).toHaveClass("custom-class");
  });
});

/**
 * Test suite for StatusBadge utility functions.
 */
describe("StatusBadge utilities", () => {
  /**
   * Tests getStatusConfig utility function.
   */
  describe("getStatusConfig", () => {
    it("should return correct config for active status", () => {
      const config = getStatusConfig("active");
      expect(config).toEqual({
        variant: "default",
        dotColor: "bg-green-400",
        ariaLabel: "Trạng thái hoạt động",
      });
    });

    it("should return correct config for inactive status", () => {
      const config = getStatusConfig("inactive");
      expect(config).toEqual({
        variant: "secondary",
        dotColor: "bg-gray-400",
        ariaLabel: "Trạng thái không hoạt động",
      });
    });

    it("should return correct config for vehicle available status", () => {
      const config = getStatusConfig("available");
      expect(config).toEqual({
        variant: "default",
        dotColor: "bg-green-400",
        ariaLabel: "Có sẵn",
      });
    });

    it("should return correct config for vehicle maintenance status", () => {
      const config = getStatusConfig("maintenance");
      expect(config).toEqual({
        variant: "outline",
        dotColor: "bg-yellow-400",
        ariaLabel: "Bảo trì",
      });
    });
  });

  /**
   * Tests isValidStatus utility function.
   */
  describe("isValidStatus", () => {
    it("should return true for valid status values", () => {
      expect(isValidStatus("active")).toBe(true);
      expect(isValidStatus("inactive")).toBe(true);
      expect(isValidStatus("available")).toBe(true);
      expect(isValidStatus("unavailable")).toBe(true);
      expect(isValidStatus("maintenance")).toBe(true);
      expect(isValidStatus("pending")).toBe(true);
      expect(isValidStatus("completed")).toBe(true);
    });

    it("should return false for invalid status values", () => {
      expect(isValidStatus("unknown")).toBe(false);
      expect(isValidStatus("")).toBe(false);
      expect(isValidStatus("invalid_status")).toBe(false);
    });
  });
});