type ShoelaceValueTarget = EventTarget & {
  value?: string | string[];
};

type ShoelaceCheckedTarget = EventTarget & {
  checked?: boolean;
};

export const readShoelaceSingleValue = (event: Event): string => {
  const target = event.target as ShoelaceValueTarget | null;
  const value = target?.value ?? '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
};

export const readShoelaceMultiValue = (event: Event): string[] => {
  const target = event.target as ShoelaceValueTarget | null;
  const value = target?.value ?? [];
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
};

export const readShoelaceChecked = (event: Event): boolean => {
  const target = event.target as ShoelaceCheckedTarget | null;
  return Boolean(target?.checked);
};

