import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerCombobox } from "../customer-combobox";

vi.mock("@/services/customers/searchCustomers", () => ({
  searchCustomers: vi.fn(),
}));

const mockSearchCustomers = vi.mocked(
  await import("@/services/customers/searchCustomers")
).searchCustomers;

describe("CustomerCombobox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with placeholder", () => {
    const onValueChange = vi.fn();

    render(
      <CustomerCombobox
        value=""
        onValueChange={onValueChange}
        placeholder="Chọn khách hàng..."
      />
    );

    expect(screen.getByText("Chọn khách hàng...")).toBeInTheDocument();
  });

  it("should open search when clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    mockSearchCustomers.mockResolvedValue({
      results: [
        {
          id: "1",
          name: "Nguyễn Văn A",
          email: "a@example.com",
          address: "Hà Nội",
          phone: "0123456789",
        },
      ],
      query: "",
      count: 1,
    });

    render(
      <CustomerCombobox
        value=""
        onValueChange={onValueChange}
        placeholder="Chọn khách hàng..."
      />
    );

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Tìm kiếm khách hàng...")).toBeInTheDocument();
    });
  });

  it("should call onValueChange when customer selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    mockSearchCustomers.mockResolvedValue({
      results: [
        {
          id: "1",
          name: "Nguyễn Văn A",
          email: "a@example.com",
          address: "Hà Nội",
          phone: "0123456789",
        },
      ],
      query: "",
      count: 1,
    });

    render(
      <CustomerCombobox
        value=""
        onValueChange={onValueChange}
        placeholder="Chọn khách hàng..."
      />
    );

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Nguyễn Văn A"));

    expect(onValueChange).toHaveBeenCalledWith("1");
  });

  it("should show loading message during search", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    mockSearchCustomers.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        results: [],
        query: "test",
        count: 0,
      }), 100))
    );

    render(
      <CustomerCombobox
        value=""
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole("combobox"));
    
    const searchInput = await screen.findByPlaceholderText("Tìm kiếm khách hàng...");
    await user.type(searchInput, "test");

    expect(screen.getByText("Đang tìm kiếm...")).toBeInTheDocument();
  });
});