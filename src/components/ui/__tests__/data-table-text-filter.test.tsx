/**
 * @fileoverview Tests for DataTableTextFilter component
 * @module components/ui/__tests__/DataTableTextFilter.test
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { 
  DATA_TABLE_TEXT_FILTER_DEFAULTS,
  DataTableTextFilter, 
  type DataTableTextFilterProps, 
  getTextFilterConfig
} from "../data-table-text-filter";

/**
 * Test suite for DataTableTextFilter component.
 *
 * Tests user interactions, debouncing behavior, configuration options,
 * and accessibility features. Ensures the component works correctly
 * across different use cases and configurations.
 */
describe("DataTableTextFilter", () => {
  const mockOnChange = vi.fn();
  
  const defaultProps: DataTableTextFilterProps = {
    value: "",
    onChange: mockOnChange,
    config: DATA_TABLE_TEXT_FILTER_DEFAULTS.VIETNAMESE,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  /**
   * Tests basic rendering and initial state
   */
  describe("Rendering", () => {
    it("should render with default configuration", () => {
      render(<DataTableTextFilter {...defaultProps} />);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Tìm kiếm...");
      expect(input).toHaveValue("");
      
      const searchIcon = screen.getByRole("textbox").parentElement?.querySelector("svg");
      expect(searchIcon).toBeInTheDocument();
    });

    it("should render with custom placeholder", () => {
      const customConfig = {
        ...DATA_TABLE_TEXT_FILTER_DEFAULTS.VEHICLE,
      };
      
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          config={customConfig}
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveAttribute("placeholder", "Tìm kiếm mẫu xe, biển số...");
    });

    it("should render with initial value", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test search"
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveValue("test search");
    });

    it("should show clear button when there is text", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test"
        />
      );
      
      const clearButton = screen.getByTestId("data-table-text-filter-clear");
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute("aria-label", "Xóa tìm kiếm");
    });

    it("should not show clear button when showClearButton is false", () => {
      const configWithoutClear = {
        ...DATA_TABLE_TEXT_FILTER_DEFAULTS.VIETNAMESE,
        showClearButton: false,
      };
      
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test"
          config={configWithoutClear}
        />
      );
      
      const clearButton = screen.queryByTestId("data-table-text-filter-clear");
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  /**
   * Tests user interaction behavior
   */
  describe("User Interactions", () => {
    it("should update local state immediately on typing", async () => {
      const user = userEvent.setup();
      
      render(<DataTableTextFilter {...defaultProps} />);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      await user.type(input, "test");
      
      expect(input).toHaveValue("test");
    });

    it("should call onChange with debounced value", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<DataTableTextFilter {...defaultProps} />);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      await user.type(input, "test");
      
      // Should not call onChange immediately
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Advance timers past debounce delay
      vi.advanceTimersByTime(300);
      
      expect(mockOnChange).toHaveBeenCalledWith("test");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    it("should clear input when clear button is clicked", async () => {
      const user = userEvent.setup();
      
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test search"
        />
      );
      
      const clearButton = screen.getByTestId("data-table-text-filter-clear");
      await user.click(clearButton);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveValue("");
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("should clear input when Escape key is pressed", async () => {
      const user = userEvent.setup();
      
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test search"
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      await user.click(input);
      await user.keyboard("{Escape}");
      
      expect(input).toHaveValue("");
      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  /**
   * Tests debouncing behavior with different delays
   */
  describe("Debouncing", () => {
    it("should use custom debounce delay", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const customConfig = {
        ...DATA_TABLE_TEXT_FILTER_DEFAULTS.VIETNAMESE,
        debounceMs: 500,
      };
      
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          config={customConfig}
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      await user.type(input, "test");
      
      // Should not call onChange before custom delay
      vi.advanceTimersByTime(300);
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Should call onChange after custom delay
      vi.advanceTimersByTime(200);
      expect(mockOnChange).toHaveBeenCalledWith("test");
      
      vi.useRealTimers();
    });

    it("should cancel previous debounce when typing quickly", async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<DataTableTextFilter {...defaultProps} />);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      
      // Type first character
      await user.type(input, "t");
      vi.advanceTimersByTime(100);
      
      // Type second character before debounce completes
      await user.type(input, "e");
      vi.advanceTimersByTime(100);
      
      // Type third character before debounce completes
      await user.type(input, "s");
      
      // Complete the debounce delay
      vi.advanceTimersByTime(300);
      
      // Should only call onChange once with final value
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith("tes");
      
      vi.useRealTimers();
    });
  });

  /**
   * Tests disabled and loading states
   */
  describe("Disabled and Loading States", () => {
    it("should disable input when disabled prop is true", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          disabled={true}
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toBeDisabled();
    });

    it("should not show clear button when disabled", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test"
          disabled={true}
        />
      );
      
      const clearButton = screen.queryByTestId("data-table-text-filter-clear");
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should show loading animation when loading is true", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          loading={true}
        />
      );
      
      const searchIcon = screen.getByRole("textbox").parentElement?.querySelector("svg");
      expect(searchIcon).toHaveClass("animate-pulse");
    });
  });

  /**
   * Tests external value changes synchronization
   */
  describe("External Value Sync", () => {
    it("should sync local state when external value changes", () => {
      const { rerender } = render(
        <DataTableTextFilter 
          {...defaultProps} 
          value=""
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveValue("");
      
      rerender(
        <DataTableTextFilter 
          {...defaultProps} 
          value="external change"
        />
      );
      
      expect(input).toHaveValue("external change");
    });

    it("should not trigger onChange when external value changes", () => {
      vi.clearAllMocks(); // Clear any previous calls
      
      const { rerender } = render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="initial"
        />
      );
      
      // Clear mock calls after initial render
      mockOnChange.mockClear();
      
      rerender(
        <DataTableTextFilter 
          {...defaultProps} 
          value="external change"
        />
      );
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  /**
   * Tests configuration presets and helper functions
   */
  describe("Configuration Presets", () => {
    it("should provide correct vehicle configuration", () => {
      const vehicleConfig = DATA_TABLE_TEXT_FILTER_DEFAULTS.VEHICLE;
      
      expect(vehicleConfig.placeholder).toBe("Tìm kiếm mẫu xe, biển số...");
      expect(vehicleConfig.debounceMs).toBe(300);
      expect(vehicleConfig.maxWidth).toBe("max-w-sm");
      expect(vehicleConfig.showClearButton).toBe(true);
    });

    it("should merge configurations correctly with getTextFilterConfig", () => {
      const customConfig = getTextFilterConfig("VEHICLE", {
        debounceMs: 500,
        maxWidth: "max-w-lg",
      });
      
      expect(customConfig.placeholder).toBe("Tìm kiếm mẫu xe, biển số...");
      expect(customConfig.debounceMs).toBe(500);
      expect(customConfig.maxWidth).toBe("max-w-lg");
      expect(customConfig.showClearButton).toBe(true);
    });
  });

  /**
   * Tests accessibility features
   */
  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test"
        />
      );
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveAttribute("aria-label", "Tìm kiếm...");
      
      const clearButton = screen.getByTestId("data-table-text-filter-clear");
      expect(clearButton).toHaveAttribute("aria-label", "Xóa tìm kiếm");
    });

    it("should disable spell check and autocomplete", () => {
      render(<DataTableTextFilter {...defaultProps} />);
      
      const input = screen.getByTestId("data-table-text-filter-input");
      expect(input).toHaveAttribute("spellCheck", "false");
      expect(input).toHaveAttribute("autoComplete", "off");
    });

    it("should have proper tab index for clear button", () => {
      render(
        <DataTableTextFilter 
          {...defaultProps} 
          value="test"
        />
      );
      
      const clearButton = screen.getByTestId("data-table-text-filter-clear");
      expect(clearButton).toHaveAttribute("tabIndex", "-1");
    });
  });
});