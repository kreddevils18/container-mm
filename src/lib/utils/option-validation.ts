import type { ComboboxOption } from "@/components/ui/combobox";

export function validateComboboxOptions(
  options: ComboboxOption[],
  _context = "combobox"
): ComboboxOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  if (options.length === 0) {
    return [];
  }

  const validatedOptions: ComboboxOption[] = [];
  const seenValues = new Set<string>();
  let duplicateCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (!option || typeof option !== "object") {
      invalidCount++;
      continue;
    }

    if (!option.value || typeof option.value !== "string") {
      invalidCount++;
      continue;
    }

    if (!option.label || typeof option.label !== "string") {
      invalidCount++;
      continue;
    }

    if (seenValues.has(option.value)) {
      duplicateCount++;
      continue;
    }

    seenValues.add(option.value);
    validatedOptions.push({
      value: option.value,
      label: option.label,
      data: option.data,
    });
  }

  if (duplicateCount > 0 || invalidCount > 0) {
  }

  return validatedOptions;
}

export function hasValidKey(option: ComboboxOption): boolean {
  return Boolean(
    option &&
    typeof option === "object" &&
    option.value &&
    typeof option.value === "string" &&
    option.value.trim().length > 0
  );
}

export function generateFallbackKey(
  option: ComboboxOption,
  index: number
): string {
  if (option?.label && typeof option.label === "string") {
    return `fallback-${option.label.slice(0, 20)}-${index}`;
  }
  return `fallback-option-${index}`;
}

export function ensureValidKeys(
  options: ComboboxOption[],
  _context = "combobox"
): ComboboxOption[] {
  return options.map((option, index) => {
    if (hasValidKey(option)) {
      return option;
    }

    const fallbackKey = generateFallbackKey(option, index);

    return {
      ...option,
      value: fallbackKey,
      label: option?.label || `Option ${index + 1}`,
    };
  });
}
