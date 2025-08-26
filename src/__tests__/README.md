# Customer Integration Tests with Testcontainers

Comprehensive integration test suite for Customer functionality using PostgreSQL Testcontainers.

## 🚀 Overview

This test suite focuses on testing the complete data flow for Customers from API → Service → Database using real PostgreSQL through Testcontainers.

## 📁 Test Structure

```
src/__tests__/
├── setup/
│   ├── testcontainer-setup.ts     # PostgreSQL container configuration
│   ├── database-helper.ts         # Utilities for database operations
│   └── test-data-factory.ts       # Factory for creating test data
├── integration/
│   └── customer/
│       ├── customer-crud.test.ts           # CRUD operations
│       ├── customer-search.test.ts         # Search functionality
│       ├── customer-export.test.ts         # Export functionality
│       ├── customer-validation.test.ts     # Validation & error handling
│       └── customer-performance-security.test.ts # Performance & security
└── README.md
```

## 🧪 Test Categories

### 1. CRUD Operations (`customer-crud.test.ts`)
- ✅ Create customers with comprehensive validation
- ✅ Read operations with proper serialization
- ✅ Update operations with optimistic locking
- ✅ Delete operations with cascade effects
- ✅ Bulk operations and concurrent handling
- ✅ Data consistency across operations

### 2. Search Functionality (`customer-search.test.ts`)
- ✅ Basic search by name/email/phone
- ✅ Advanced filtering combinations
- ✅ Vietnamese text search with full-text indexing
- ✅ Pagination and sorting
- ✅ Performance with large datasets
- ✅ Search ranking and relevance

### 3. Export Functionality (`customer-export.test.ts`)
- ✅ CSV export with proper encoding
- ✅ Filtered export with complex queries
- ✅ Large dataset handling
- ✅ Memory usage validation
- ✅ Data transformation for export
- ✅ Vietnamese locale formatting

### 4. Validation & Error Handling (`customer-validation.test.ts`)
- ✅ Zod schema validation at all layers
- ✅ Database constraints validation
- ✅ Error propagation patterns
- ✅ Transaction rollback scenarios
- ✅ Input sanitization and special characters
- ✅ Edge cases and boundary values

### 5. Performance & Security (`customer-performance-security.test.ts`)
- ✅ Large dataset performance (5000+ records)
- ✅ Query optimization and index utilization
- ✅ Memory management and resource cleanup
- ✅ SQL injection prevention
- ✅ Data sanitization and validation
- ✅ Concurrent access safety
- ✅ Transaction isolation

## 🔧 Installation and Running Tests

### Install dependencies
```bash
pnpm install
```

### Run integration tests
```bash
# Run all integration tests
pnpm test:integration

# Run with watch mode
pnpm test:integration:watch

# Run with coverage
pnpm test:integration:coverage

# Run specific test file
pnpm vitest --config vitest.config.integration.ts customer-crud.test.ts
```

## 🐳 Testcontainer Setup

### PostgreSQL Configuration
- **Image**: `postgres:16-alpine`
- **Extensions**: `pg_trgm`, `unaccent`, `uuid-ossp`
- **Features**: Full-text search, Vietnamese text support
- **Performance**: Optimized for test execution

### Container Management
- **Single container** for the entire test suite
- **Automatic cleanup** after tests complete
- **Health checks** to ensure container readiness
- **Connection pooling** for optimal performance

## 📊 Test Data Strategy

### Test Data Factory
- **Vietnamese names/addresses** for realistic testing
- **Edge cases** (special characters, long text)
- **Large datasets** (1000+ records) for performance testing
- **Boundary values** for validation testing

### Data Types
```typescript
// Basic customers
const basicCustomers = CustomerDataFactory.createBasicCustomers();

// Vietnamese customers
const vietnameseCustomers = CustomerDataFactory.createVietnameseCustomers();

// Large dataset
const largeDataset = CustomerDataFactory.createLargeDataset(1000);

// Edge cases
const edgeCases = CustomerDataFactory.createEdgeCaseCustomers();
```

## 🎯 Coverage Goals

- **90%+ integration test coverage**
- **All customer APIs tested end-to-end**
- **Database operations validated**
- **Error scenarios covered**

### Coverage Areas
- ✅ API routes (`/api/customers/*`)
- ✅ Service layers (`getCustomers`, `getCustomersToExport`)
- ✅ Database operations (Drizzle ORM)
- ✅ Search functionality (PostgreSQL full-text search)
- ✅ Export functionality (Excel generation)

## 🚀 Performance Benchmarks

### Query Performance
- **Large dataset queries**: < 3 seconds (5000 records)
- **Search operations**: < 2 seconds
- **Pagination**: < 1 second
- **Bulk operations**: < 2 seconds (100 records)

### Memory Usage
- **Large operations**: < 200MB memory increase
- **Export operations**: < 100MB memory increase
- **Concurrent operations**: Stable memory usage

## 🔒 Security Testing

### SQL Injection Prevention
- Parameterized queries validation
- Malicious input sanitization
- Special character handling
- Unicode and international characters

### Data Protection
- Input validation at all layers
- Boundary value testing
- Buffer overflow prevention
- Transaction isolation

## 📝 Best Practices

### Test Structure
```typescript
describe("Feature Name", () => {
  let container: StartedPostgreSqlContainer;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    container = await setupTestContainer();
    const { db, sql } = await setupDatabase(container);
    dbHelper = new DatabaseTestHelper(db, sql);
  }, 30000);

  afterAll(async () => {
    await globalCleanup();
  });

  beforeEach(async () => {
    await dbHelper.clearAllData();
  });
});
```

### Database Operations
```typescript
// Use database helper for common operations
const customers = await dbHelper.insertTestCustomers(testData);
const retrieved = await dbHelper.getCustomerById(customerId);
const searchResults = await dbHelper.searchCustomers("query");
```

## 🐛 Troubleshooting

### Common Issues

1. **Container startup timeout**
   ```bash
   # Increase timeout in beforeAll hook
   beforeAll(async () => {
     // ...
   }, 60000); // Increase to 60 seconds
   ```

2. **Database connection errors**
   ```typescript
   // Check health before running tests
   const isHealthy = await healthCheck();
   expect(isHealthy).toBe(true);
   ```

3. **Memory issues with large datasets**
   ```typescript
   // Use smaller datasets for development
   const testData = CustomerDataFactory.createLargeDataset(100); // Instead of 5000
   ```

### Debug Mode
```bash
# Run with debug information
DEBUG=testcontainers* pnpm test:integration

# Run specific test with logs
pnpm vitest --config vitest.config.integration.ts customer-crud.test.ts --reporter=verbose
```

## 📈 Performance Monitoring

Test suite includes performance monitoring:
- Query execution time tracking
- Memory usage monitoring
- Connection pool utilization
- Index effectiveness validation

## 🔄 Continuous Integration

Integration with CI/CD pipeline:
```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: pnpm test:integration:coverage
  env:
    NODE_ENV: test
```

## 📚 Related Documentation

- [Database Schema](../../drizzle/schema/)
- [API Routes](../../app/api/customers/)
- [Services](../../services/customers/)
- [Schemas](../../schemas/customer.ts)

---

**Note**: The test suite is designed to run independently and does not affect the production database. Each test runs in a separate container with full data isolation.