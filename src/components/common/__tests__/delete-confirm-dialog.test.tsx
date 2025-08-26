/**
 * @fileoverview Tests for DeleteConfirmDialog component
 * @module components/common/__tests__/delete-confirm-dialog.test
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteConfirmDialog } from "../delete-confirm-dialog";

/**
 * Test suite for DeleteConfirmDialog component.
 *
 * Tests user interactions, state management, loading states, and accessibility.
 * Mocks external dependencies to ensure isolated unit tests.
 */
describe("DeleteConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    description: "Test description",
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Tests that dialog renders with default props and content.
   */
  it("should render dialog with default title and content", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Xác nhận xóa")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Hành động này không thể hoàn tác.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hủy bỏ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /xóa/i })).toBeInTheDocument();
  });

  /**
   * Tests that dialog renders with custom props.
   */
  it("should render with custom title, description, and button texts", () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        title="Custom Title"
        description={<span>Custom description</span>}
        cancelText="Cancel"
        confirmText="Delete Item"
        itemName="Test Item"
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete item test item/i })).toBeInTheDocument();
  });

  /**
   * Tests that onConfirm is called when confirm button is clicked.
   */
  it("should call onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: /xóa/i });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  /**
   * Tests that onOpenChange is called when cancel button is clicked.
   */
  it("should call onOpenChange with false when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByRole("button", { name: /hủy bỏ/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /**
   * Tests loading state display and button disabling.
   */
  it("should show loading state and disable buttons when isLoading is true", () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        isLoading={true}
        loadingText="Deleting..."
      />
    );

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hủy bỏ/i })).toBeDisabled();
    // Find button by its accessible name (aria-label)
    const confirmButton = screen.getByRole("button", { name: /xóa/i });
    expect(confirmButton).toBeDisabled();
    
    // Check for loading spinner within the confirm button
    const spinner = confirmButton.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  /**
   * Tests that cancel is prevented during loading state.
   */
  it("should not call onOpenChange when cancel is clicked during loading", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <DeleteConfirmDialog
        {...defaultProps}
        isLoading={true}
        onOpenChange={onOpenChange}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /hủy bỏ/i });
    await user.click(cancelButton);

    // Should not be called because button is disabled
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  /**
   * Tests non-destructive styling option.
   */
  it("should not apply destructive styling when destructive is false", () => {
    render(<DeleteConfirmDialog {...defaultProps} destructive={false} />);

    const confirmButton = screen.getByRole("button", { name: /xóa/i });
    expect(confirmButton).not.toHaveClass("bg-destructive");
  });

  /**
   * Tests destructive styling (default behavior).
   */
  it("should apply destructive styling by default", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /xóa/i });
    expect(confirmButton).toHaveClass("bg-destructive");
  });

  /**
   * Tests custom CSS class application.
   */
  it("should apply custom className to dialog content", () => {
    render(<DeleteConfirmDialog {...defaultProps} className="custom-class" />);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveClass("custom-class");
  });

  /**
   * Tests that dialog doesn't render when open is false.
   */
  it("should not render dialog when open is false", () => {
    render(<DeleteConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  /**
   * Tests error handling in confirm action.
   */
  it("should handle errors in onConfirm gracefully", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onConfirm = vi.fn().mockRejectedValue(new Error("Delete failed"));

    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: /xóa/i });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Delete operation failed:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  /**
   * Tests accessibility with item name in aria-label.
   */
  it("should include item name in confirm button aria-label", () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        itemName="John Doe"
        confirmText="Delete"
      />
    );

    const confirmButton = screen.getByRole("button", { name: /delete john doe/i });
    expect(confirmButton).toBeInTheDocument();
  });

  /**
   * Tests JSX description rendering.
   */
  it("should render JSX description correctly", () => {
    const description = (
      <div>
        Delete user <strong>John Doe</strong>?
      </div>
    );

    render(<DeleteConfirmDialog {...defaultProps} description={description} />);

    expect(screen.getByText("Delete user", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    const strongElement = screen.getByText("John Doe");
    expect(strongElement.tagName).toBe("STRONG");
  });
});