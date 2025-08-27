import { nanoid } from "nanoid";
import type { NewCustomer, NewVehicle } from "../types";

export interface CustomerTestData {
  basic: NewCustomer[];
  vietnamese: NewCustomer[];
  edge_cases: NewCustomer[];
  large_dataset: NewCustomer[];
}

export namespace CustomerDataFactory {
  const vietnameseNames = [
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

  const vietnameseAddresses = [
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

  export function createBasicCustomers(): NewCustomer[] {
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

  export function createVietnameseCustomers(): NewCustomer[] {
    return vietnameseNames.slice(0, 5).map((name, index) => ({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".").replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a").replace(/[èéẹẻẽêềếệểễ]/g, "e").replace(/[ìíịỉĩ]/g, "i").replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o").replace(/[ùúụủũưừứựửữ]/g, "u").replace(/[ỳýỵỷỹ]/g, "y").replace(/đ/g, "d")}@gmail.com`,
      address: vietnameseAddresses[index],
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      taxId: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: "active",
    }));
  }

  export function createEdgeCaseCustomers(): NewCustomer[] {
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

  export function createLargeDataset(count: number = 1000): NewCustomer[] {
    const customers: NewCustomer[] = [];
    
    for (let i = 0; i < count; i++) {
      const nameIndex = i % vietnameseNames.length;
      const addressIndex = i % vietnameseAddresses.length;
      
      customers.push({
        name: `${vietnameseNames[nameIndex]} ${i}`,
        email: `customer${i}@test.com`,
        address: `${vietnameseAddresses[addressIndex]} - ${i}`,
        phone: `09${String(i).padStart(8, "0")}`,
        taxId: `TAX${String(i).padStart(10, "0")}`,
        status: i % 10 === 0 ? "inactive" : "active",
      });
    }
    
    return customers;
  }

  export function createSearchTestData(): NewCustomer[] {
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

  export function createConcurrentTestData(): NewCustomer[] {
    return Array.from({ length: 10 }, (_, index) => ({
      name: `Concurrent User ${index}`,
      email: `concurrent${index}@test.com`,
      address: `Address ${index}`,
      phone: `090${String(index).padStart(7, "0")}`,
      taxId: `TAX${String(index).padStart(3, "0")}`,
      status: "active",
    }));
  }

  export function createValidationTestData(): Partial<NewCustomer>[] {
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

  export function getAllTestData(): CustomerTestData {
    return {
      basic: createBasicCustomers(),
      vietnamese: createVietnameseCustomers(),
      edge_cases: createEdgeCaseCustomers(),
      large_dataset: createLargeDataset(100),
    };
  }

  export function createSingleCustomer(overrides: Partial<NewCustomer> = {}): NewCustomer {
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

  export function createCustomersWithStatus(status: "active" | "inactive", count: number = 5): NewCustomer[] {
    return Array.from({ length: count }, (_, index) => 
      createSingleCustomer({ 
        name: `${status} Customer ${index}`,
        status 
      })
    );
  }
}

export interface VehicleTestData {
  basic: NewVehicle[];
  vietnamese: NewVehicle[];
  edge_cases: NewVehicle[];
  large_dataset: NewVehicle[];
}

export namespace VehicleDataFactory {
  const vietnameseLicensePlates = [
    "29A-12345", // Ho Chi Minh City format
    "30G1-23456", // Ho Chi Minh City format
    "51F-67890", // Ho Chi Minh City format
    "30A-11111", // Hanoi format
    "29B-22222", // Hanoi format  
    "43A-33333", // Da Nang format
    "72A-44444", // Can Tho format
    "81A-55555", // Gia Lai format
    "92A-66666", // An Giang format
    "99A-77777", // Dong Thap format
  ];

  const vietnameseDriverNames = [
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

  const vietnamesePhoneNumbers = [
    "0901234567", "0912345678", "0923456789", "0934567890", "0945678901",
    "0356789012", "0367890123", "0378901234", "0389012345", "0390123456"
  ];

  const vietnameseIdCards = [
    "123456789", // CMND format (9 digits)
    "987654321",
    "456789123",
    "123456789012", // CCCD format (12 digits)
    "987654321098",
    "456789123456",
    "234567890123",
    "345678901234", 
    "567890123456",
    "678901234567",
  ];

  export function createBasicVehicles(): NewVehicle[] {
    return [
      {
        licensePlate: "ABC-1234",
        driverName: "John Driver",
        driverPhone: "0123456789",
        driverIdCard: "123456789",
        status: "available",
      },
      {
        licensePlate: "DEF-5678",
        driverName: "Jane Smith",
        driverPhone: "0987654321",
        driverIdCard: "987654321",
        status: "available",
      },
      {
        licensePlate: "GHI-9012", 
        driverName: "Bob Johnson",
        driverPhone: "0555123456",
        driverIdCard: "555123456",
        status: "maintenance",
      },
    ];
  }

  export function createVietnameseVehicles(): NewVehicle[] {
    return vietnameseDriverNames.slice(0, 5).map((driverName, index) => ({
      licensePlate: vietnameseLicensePlates[index],
      driverName,
      driverPhone: vietnamesePhoneNumbers[index],
      driverIdCard: vietnameseIdCards[index],
      status: index % 3 === 0 ? "maintenance" : index % 2 === 0 ? "unavailable" : "available",
    }));
  }

  export function createEdgeCaseVehicles(): NewVehicle[] {
    return [
      {
        licensePlate: "A".repeat(20), // Maximum length license plate
        driverName: "Very Long Driver Name That Tests Maximum Length Constraints",
        driverPhone: "01234567890123456789", // Maximum length phone
        driverIdCard: "12345678901234567890", // Maximum length ID card
        status: "available",
      },
      {
        licensePlate: "SPECIAL-!@#", // Special characters in license plate
        driverName: "Driver With Special Chars: àáạảãâầấậẩẫăằắặẳẵ",
        driverPhone: "0999888777",
        driverIdCard: "999888777666",
        status: "unavailable",
      },
      {
        licensePlate: "MIN-CASE",
        driverName: "Min Driver",
        driverPhone: "0900000000",
        driverIdCard: "123456789",
        status: "maintenance",
      },
    ];
  }

  export function createLargeFleet(count: number = 1000): NewVehicle[] {
    const vehicles: NewVehicle[] = [];
    
    for (let i = 0; i < count; i++) {
      const nameIndex = i % vietnameseDriverNames.length;
      const plateIndex = i % vietnameseLicensePlates.length;
      const phoneIndex = i % vietnamesePhoneNumbers.length;
      const idIndex = i % vietnameseIdCards.length;
      
      vehicles.push({
        licensePlate: `${vietnameseLicensePlates[plateIndex]}-${i}`,
        driverName: `${vietnameseDriverNames[nameIndex]} ${i}`,
        driverPhone: vietnamesePhoneNumbers[phoneIndex],
        driverIdCard: `${vietnameseIdCards[idIndex]}${i}`,
        status: i % 10 === 0 ? "maintenance" : i % 5 === 0 ? "unavailable" : "available",
      });
    }
    
    return vehicles;
  }

  export function createSearchTestData(): NewVehicle[] {
    return [
      {
        licensePlate: "29A-11111",
        driverName: "Nguyễn Văn Anh",
        driverPhone: "0901234567",
        driverIdCard: "123456789",
        status: "available",
      },
      {
        licensePlate: "30G1-22222",
        driverName: "Trần Thị Bình",
        driverPhone: "0912345678", 
        driverIdCard: "987654321",
        status: "available",
      },
      {
        licensePlate: "51F-33333",
        driverName: "Lê Hoàng Cường",
        driverPhone: "0923456789",
        driverIdCard: "456789123",
        status: "maintenance",
      },
      {
        licensePlate: "SEARCH-TEST",
        driverName: "Search Test Driver",
        driverPhone: "0934567890",
        driverIdCard: "111222333",
        status: "available",
      },
    ];
  }

  export function createConcurrentTestData(): NewVehicle[] {
    return Array.from({ length: 10 }, (_, index) => ({
      licensePlate: `CONCURRENT-${index}`,
      driverName: `Concurrent Driver ${index}`,
      driverPhone: `090${String(index).padStart(7, "0")}`,
      driverIdCard: `${String(index).padStart(9, "0")}`,
      status: index % 2 === 0 ? "available" : "unavailable",
    }));
  }

  export function createValidationTestData(): Partial<NewVehicle>[] {
    return [
      {}, // Empty object
      { licensePlate: "" }, // Empty license plate
      { licensePlate: "TEST", driverName: "" }, // Empty driver name
      { licensePlate: "TEST", driverName: "Driver", driverPhone: "invalid-phone" }, // Invalid phone
      { licensePlate: "TEST", driverName: "Driver", driverPhone: "0901234567", driverIdCard: "invalid-id-card-too-long-for-validation" }, // Invalid ID card
      { licensePlate: "A".repeat(21), driverName: "Driver" }, // License plate too long
      { licensePlate: "TEST", driverName: "A".repeat(101) }, // Driver name too long
    ];
  }

  export function createVehiclesWithStatus(status: "available" | "unavailable" | "maintenance", count: number = 5): NewVehicle[] {
    return Array.from({ length: count }, (_, index) => 
      createSingleVehicle({ 
        licensePlate: `${status.slice(0, 3).toUpperCase()}${index}`, // Shortened to fit 20 char limit
        driverName: `${status} Driver ${index}`,
        status 
      })
    );
  }

  export function getAllTestData(): VehicleTestData {
    return {
      basic: createBasicVehicles(),
      vietnamese: createVietnameseVehicles(),
      edge_cases: createEdgeCaseVehicles(),
      large_dataset: createLargeFleet(100),
    };
  }

  export function createSingleVehicle(overrides: Partial<NewVehicle> = {}): NewVehicle {
    const id = nanoid(6); // Reduced from 8 to fit database constraints
    const numericId = Math.floor(Math.random() * 1000000000).toString().slice(0, 9); // 9 digits for ID card
    return {
      licensePlate: `T${id}`, // Max 20 chars: "T" + 6 chars = 7 chars (well under limit)
      driverName: `Driver ${id.slice(0, 3)}`, // Max 100 chars, keeping it short
      driverPhone: `090${id.slice(0, 6)}`, // Valid 10-digit Vietnamese format
      driverIdCard: numericId, // 9 digits only, matching regex ^[0-9]{9,12}$
      status: "available",
      ...overrides,
    };
  }
}