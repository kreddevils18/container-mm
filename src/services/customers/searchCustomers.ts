import type { CustomerSearchResult } from "@/app/api/customers/search/route";

export async function searchCustomers(
  query: string,
  options: {
    limit?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{
  results: CustomerSearchResult[];
  query: string;
  count: number;
}> {
  const { limit = 20, signal } = options;

  // Allow empty query for recent customers
  if (query.length > 100) {
    throw new Error("Từ khóa tìm kiếm quá dài (tối đa 100 ký tự)");
  }

  const searchParams = new URLSearchParams({
    q: query.trim(),
    limit: limit.toString(),
  });

  const url = `/api/customers/search?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...(signal && { signal }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Tham số tìm kiếm không hợp lệ");
      }

      if (response.status === 500) {
        throw new Error("Lỗi hệ thống khi tìm kiếm khách hàng");
      }

      throw new Error(`Lỗi tìm kiếm: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== "object") {
      throw new Error("Phản hồi từ server không hợp lệ");
    }

    if (!Array.isArray(data.results)) {
      throw new Error("Dữ liệu kết quả tìm kiếm không hợp lệ");
    }

    return {
      results: data.results,
      query: data.query || query,
      count: data.count || data.results.length,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Yêu cầu tìm kiếm đã bị hủy");
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Lỗi kết nối mạng khi tìm kiếm khách hàng");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Có lỗi không xác định khi tìm kiếm khách hàng");
  }
}