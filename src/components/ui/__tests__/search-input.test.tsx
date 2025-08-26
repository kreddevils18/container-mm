/**
 * @fileoverview Tests for SearchInput component
 * @module components/ui/__tests__/search-input.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@testing-library/react";
import { Search, Filter } from "lucide-react";
import { SearchInput, useSearchInputConfig } from "../search-input";

// Mock the useDebounce hook
vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string, _delay: number) => value,
}));

/**
 * Test suite for SearchInput component.
 * 
 * Tests user interactions, debouncing, state management, accessibility,
 * and various configuration options for data table toolbar usage.
 */
describe("SearchInput", () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  /**
   * Tests basic rendering and default props
   */
  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<SearchInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Tìm kiếm...");
      expect(input).toHaveValue("");
      
      const searchIcon = screen.getByRole("img", { hidden: true });
      expect(searchIcon).toBeInTheDocument();
    });
    
    it("should render with custom placeholder", () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          placeholder="Tìm kiếm khách hàng..."
        />
      );
      
      const input = screen.getByPlaceholderText("Tìm kiếm khách hàng...");
      expect(input).toBeInTheDocument();
    });
    
    it("should render with initial value", () => {
      render(
        <SearchInput
          value="test search"
          onChange={mockOnChange}
        />
      );
      
      const input = screen.getByDisplayValue("test search");
      expect(input).toBeInTheDocument();
    });
    
    it("should render with custom icon", () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          icon={Filter}
        />
      );
      
      // Icon should be present (Filter icon instead of Search)
      const input = screen.getByTestId("search-input");
      expect(input).toBeInTheDocument();
    });
  });
  
  /**
   * Tests user interactions and input handling
   */
  describe("User Interactions", () => {
    it("should handle text input changes", async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "test query");
      
      expect(input).toHaveValue("test query");
    });
    
    it("should call onChange when input value changes", async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "search");
      
      // With mocked debounce, onChange should be called immediately
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("search");
      });
    });
    
    it("should show clear button when input has value", async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "test");
      
      const clearButton = screen.getByTestId("search-input-clear");
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute("aria-label", "Xóa tìm kiếm");
    });
    
    it("should clear input when clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchInput value="initial" onChange={mockOnChange} />);
      
      const clearButton = screen.getByTestId("search-input-clear");
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("");
      });
    });
    
    it("should clear input when Escape key is pressed", async () => {
      const user = userEvent.setup();
      render(<SearchInput value="test" onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "{Escape}");
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("");
      });
    });
    
    it("should not clear empty input when Escape is pressed", async () => {
      const user = userEvent.setup();
      render(<SearchInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "{Escape}");
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
  
  /**
   * Tests configuration options
   */
  describe("Configuration", () => {
    it("should hide clear button when showClearButton is false", async () => {
      const user = userEvent.setup();
      render(
        <SearchInput
          onChange={mockOnChange}
          showClearButton={false}
        />
      );
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "test");
      
      const clearButton = screen.queryByTestId("search-input-clear");
      expect(clearButton).not.toBeInTheDocument();
    });
    
    it("should apply custom className", () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      
      const input = screen.getByTestId("search-input");
      expect(input).toHaveClass("custom-class");
    });
    
    it("should apply custom container className", () => {
      const { container } = render(
        <SearchInput
          onChange={mockOnChange}
          containerClassName="custom-container"
        />
      );
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-container");
    });
    
    it("should apply custom maxWidth", () => {
      const { container } = render(
        <SearchInput
          onChange={mockOnChange}
          maxWidth="max-w-lg"
        />
      );
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("max-w-lg");
    });
  });
  
  /**
   * Tests loading and disabled states
   */
  describe("States", () => {
    it("should show loading state", () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          loading={true}
        />
      );
      
      // Loading state should add animate-pulse to icon
      const input = screen.getByTestId("search-input");
      expect(input).toBeInTheDocument();
      
      // Check screen reader status
      expect(screen.getByText("Đang tìm kiếm...")).toBeInTheDocument();
    });
    
    it("should handle disabled state", async () => {
      const user = userEvent.setup();
      render(
        <SearchInput
          onChange={mockOnChange}
          disabled={true}
        />
      );
      
      const input = screen.getByTestId("search-input");
      expect(input).toBeDisabled();
      
      // Should not show clear button when disabled
      await user.type(input, "test");
      const clearButton = screen.queryByTestId("search-input-clear");
      expect(clearButton).not.toBeInTheDocument();
    });
  });
  
  /**
   * Tests accessibility features
   */
  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          placeholder="Search customers"
        />
      );
      
      const input = screen.getByTestId("search-input");
      expect(input).toHaveAttribute("aria-label", "Search customers");
      expect(input).toHaveAttribute("autoComplete", "off");
      expect(input).toHaveAttribute("spellCheck", "false");
    });
    
    it("should have screen reader status updates", async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId("search-input");
      await user.type(input, "test");
      
      expect(screen.getByText("Đã nhập: test")).toBeInTheDocument();
    });
    
    it("should have proper focus management", async () => {
      const user = userEvent.setup();
      render(<SearchInput value="test" onChange={mockOnChange} />);
      
      const clearButton = screen.getByTestId("search-input-clear");
      await user.click(clearButton);
      
      const input = screen.getByTestId("search-input");
      expect(input).toHaveFocus();
    });
  });
  
  /**
   * Tests the useSearchInputConfig hook
   */
  describe("useSearchInputConfig hook", () => {
    it("should return correct configuration object", () => {
      const { result } = renderHook(() =>
        useSearchInputConfig("Test placeholder", 500)
      );
      
      expect(result.current).toEqual({
        placeholder: "Test placeholder",
        debounceMs: 500,
        showClearButton: true,
        maxWidth: "max-w-sm",
        icon: Search,
      });
    });
    
    it("should use default debounce when not provided", () => {
      const { result } = renderHook(() =>
        useSearchInputConfig("Test placeholder")
      );
      
      expect(result.current.debounceMs).toBe(300);
    });
  });
});

// Helper function for hook testing
function renderHook<T>(hook: () => T) {
  let result: { current: T };
  
  function TestComponent() {
    result = { current: hook() };
    return null;
  }
  
  render(<TestComponent />);
  if (!result) {
    throw new Error("Hook not rendered");
  }
  return { result };
}