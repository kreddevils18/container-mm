import { nanoid } from "nanoid";
import type { NewCustomer, Customer } from "@/drizzle/schema";

export interface CustomerTestData {
  basic: NewCustomer[];
  vietnamese: NewCustomer[];
  edge_cases: NewCustomer[];
  large_dataset: NewCustomer[];
}

export class CustomerDataFactory {
  private static vietnameseNames = [
    "Nguyễn Văn An",
    "Trần Thị Bình",
    "Lê Hoàng Cường",
    "Phạm Thị Dung",
    "Hoàng Văn Em",
    "Vũ Thị Phương",
    "Đặng Minh Quang",
    "Bùi Thị Hoa",
    "Đỗ Văn Tùng",
    "Ngô Thị Linh",
  ];

  private static vietnameseAddresses = [
    "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "456 Lê Lợi, Quận Hai Bà Trưng, Hà Nội",
    "789 Trần Hưng Đạo, Quận 5, TP.HCM",
    "321 Đinh Tiên Hoàng, Quận Hoàn Kiếm, Hà Nội",
    "654 Võ Thị Sáu, Quận 3, TP.HCM",
    "987 Lý Tự Trọng, Quận Ba Đình, Hà Nội",
    "147 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "258 Hoàng Diệu, Quận 4, TP.HCM",
    "369 Cao Thắng, Quận 3, TP.HCM",
    "741 Nguyễn Trãi, Quận 5, TP.HCM",
  ];

  static createBasicCustomers(): NewCustomer[] {
    return [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        address: "123 Main St, City, State",
        phone: "0123456789",
        taxId: "123456789",
        status: "active",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com", 
        address: "456 Oak Ave, City, State",
        phone: "0987654321",
        taxId: "987654321",
        status: "active",
      },
      {
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        address: "789 Pine St, City, State", 
        phone: "0555123456",
        taxId: null,
        status: "active",
      },
    ];
  }

  static createVietnameseCustomers(): NewCustomer[] {
    return this.vietnameseNames.slice(0, 5).map((name, index) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".").replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a").replace(/[èéẹẻẽêềếệểễ]/g, "e").replace(/[ìíịỉĩ]/g, "i").replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o").replace(/[ùúụủũưừứựửữ]/g, "u").replace(/[ỳýỵỷỹ]/g, "y").replace(/đ/g, "d")}@gmail.com`,
      address: this.vietnameseAddresses[index],
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      taxId: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: "active",
    }));
  }

  static createEdgeCaseCustomers(): NewCustomer[] {
    return [
      {
        name: "A".repeat(200),
        email: "very.long.email@example.com",
        address: "Long address ".repeat(20),
        phone: "0123456789012345",
        taxId: "EDGE-CASE-TAX-ID-123",
        status: "active",
      },
      {
        name: "Special Chars: @#$%^&*()",
        email: "special@example.com",
        address: "Address with !@#$%^&*() symbols",
        phone: "0999888777",
        taxId: null,
        status: "inactive",
      },
      {
        name: "Minimum Customer",
        email: null,
        address: "Min Addr",
        phone: null,
        taxId: null,
        status: "active",
      },
    ];
  }

  static createLargeDataset(count: number = 1000): NewCustomer[] {
    const customers: NewCustomer[] = [];
    
    for (let i = 0; i < count; i++) {
      const nameIndex = i % this.vietnameseNames.length;
      const addressIndex = i % this.vietnameseAddresses.length;
      
      customers.push({
        name: `${this.vietnameseNames[nameIndex]} ${i}`,
        email: `customer${i}@test.com`,
        address: `${this.vietnameseAddresses[addressIndex]} - ${i}`,
        phone: `09${String(i).padStart(8, "0")}`,
        taxId: `TAX${String(i).padStart(10, "0")}`,
        status: i % 10 === 0 ? "inactive" : "active",
      });
    }
    
    return customers;
  }

  static createSearchTestData(): NewCustomer[] {
    return [
      {
        name: "Nguyễn Văn Anh",
        email: "nguyen.anh@test.com",
        address: "123 Lê Duẩn, Hà Nội",
        phone: "0901234567",
        taxId: "TAX001",
        status: "active",
      },
      {
        name: "Trần Thị Bình",
        email: "tran.binh@test.com", 
        address: "456 Nguyễn Huệ, TP.HCM",
        phone: "0912345678",
        taxId: "TAX002",
        status: "active",
      },
      {
        name: "Lê Hoàng Cường",
        email: "le.cuong@test.com",
        address: "789 Trần Hưng Đạo, Đà Nẵng",
        phone: "0923456789",
        taxId: "TAX003",
        status: "active",
      },
      {
        name: "Search Test User",
        email: "search@example.com",
        address: "Search Address 123",
        phone: "0934567890",
        taxId: "TAX004",
        status: "active",
      },
    ];
  }

  static createConcurrentTestData(): NewCustomer[] {
    return Array.from({ length: 10 }, (_, index) => ({
      name: `Concurrent User ${index}`,
      email: `concurrent${index}@test.com`,
      address: `Address ${index}`,
      phone: `090${String(index).padStart(7, "0")}`,
      taxId: `TAX${String(index).padStart(3, "0")}`,
      status: "active",
    }));
  }

  static createValidationTestData(): Partial<NewCustomer>[] {
    return [
      {},
      { name: "" },
      { name: "Test", address: "" },
      { name: "Test", address: "Address", email: "invalid-email" },
      { name: "Test", address: "Address", phone: "invalid-phone-number-too-long" },
      { name: "A".repeat(201), address: "Address" },
      { name: "Test", address: "A".repeat(501) },
    ];
  }

  static getAllTestData(): CustomerTestData {
    return {
      basic: this.createBasicCustomers(),
      vietnamese: this.createVietnameseCustomers(),
      edge_cases: this.createEdgeCaseCustomers(),
      large_dataset: this.createLargeDataset(100),
    };
  }

  static createSingleCustomer(overrides: Partial<NewCustomer> = {}): NewCustomer {
    const id = nanoid(8);
    return {
      name: `Test Customer ${id}`,
      email: `test${id}@example.com`,
      address: `Address ${id}`,
      phone: `090${id.slice(0, 7)}`,
      taxId: `TAX${id}`,
      status: "active",
      ...overrides,
    };
  }

  static createCustomersWithStatus(status: "active" | "inactive", count: number = 5): NewCustomer[] {
    return Array.from({ length: count }, (_, index) => 
      this.createSingleCustomer({ 
        name: `${status} Customer ${index}`,
        status 
      })
    );
  }
}