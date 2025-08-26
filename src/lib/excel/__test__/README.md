# Excel Service Tests

This directory contains comprehensive unit tests for the ExcelService library.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Files

- `excel-service.spec.ts` - Core service functionality, plugin system, and data processing
- `style-registry.spec.ts` - Style management, registration, and merging
- `formatter-registry.spec.ts` - Data formatters including Vietnamese-specific formatters
- `exceljs-driver.memory.spec.ts` - Integration tests with real ExcelJS library

## Test Coverage

The test suite aims for 80%+ code coverage across all components:
- Core service orchestration
- Style and formatter registries  
- Driver implementations (fake and real)
- Plugin system
- Async iterable support
- Vietnamese localization features

## Key Test Scenarios

### ExcelService Tests
- Event sequence verification using FakeDriver
- Data transformation with formatters
- Style application and merging
- Plugin hook execution order
- AsyncIterable data source support
- Sheet features (autoFilter, freeze, footer)

### Registry Tests
- Style registration and resolution
- Deep merging of nested style properties
- Formatter registration and error handling
- Vietnamese-specific formatters (phone, currency)

### Integration Tests
- Real Excel file generation and validation
- Metadata preservation
- Style and formatting verification
- Feature compatibility (autoFilter, freeze panes)

## Vietnamese Support

The tests include specific scenarios for Vietnamese localization:
- Vietnamese phone number formatting
- Vietnamese currency formatting (VND)
- Boolean values in Vietnamese ("có"/"không")

## Architecture Validation

Tests verify SOLID principles implementation:
- Single Responsibility: Each component has focused tests
- Open/Closed: Plugin and formatter extensibility
- Liskov Substitution: Driver interface compliance
- Interface Segregation: Minimal, focused interfaces
- Dependency Inversion: Mock/fake implementations