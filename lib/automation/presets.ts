export type AutomationSettings = {
  bookingConfirmation: {
    enabled: boolean;
    templateId: string | null;
    templateName: string | null;
    sendDelayMinutes: number;
  };
  bookingReminder: {
    enabled: boolean;
    templateId: string | null;
    templateName: string | null;
    hoursBefore: number;
  };
  visitFollowup: {
    enabled: boolean;
    templateId: string | null;
    templateName: string | null;
    delayHours: number;
  };
};

export type AutomationSettingsKey = keyof AutomationSettings;

export const defaultAutomationSettings: AutomationSettings = {
  bookingConfirmation: {
    enabled: false,
    templateId: null,
    templateName: null,
    sendDelayMinutes: 0,
  },
  bookingReminder: {
    enabled: false,
    templateId: null,
    templateName: null,
    hoursBefore: 24,
  },
  visitFollowup: {
    enabled: false,
    templateId: null,
    templateName: null,
    delayHours: 24,
  },
};

function cloneSettings<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function normalizeAutomationSettings(value: unknown): AutomationSettings {
  const base = cloneSettings(defaultAutomationSettings);
  if (!value || typeof value !== 'object') {
    return base;
  }

  for (const key of Object.keys(base) as AutomationSettingsKey[]) {
    const segment = (value as Record<string, unknown>)[key];
    if (segment && typeof segment === 'object') {
      Object.assign(base[key], segment);
    }
  }

  return base;
}

export function mergeAutomationSettings(
  base: AutomationSettings,
  overrides: Partial<AutomationSettings>,
): AutomationSettings {
  const clone = cloneSettings(base);

  for (const key of Object.keys(overrides ?? {}) as AutomationSettingsKey[]) {
    const override = overrides[key];
    if (!override) continue;
    switch (key) {
      case 'bookingConfirmation': {
        const overrideValue = override as AutomationSettings['bookingConfirmation'];
        clone.bookingConfirmation = {
          ...clone.bookingConfirmation,
          ...overrideValue,
          templateId: overrideValue.templateId ?? clone.bookingConfirmation.templateId,
          templateName: overrideValue.templateName ?? clone.bookingConfirmation.templateName,
        };
        break;
      }
      case 'bookingReminder': {
        const overrideValue = override as AutomationSettings['bookingReminder'];
        clone.bookingReminder = {
          ...clone.bookingReminder,
          ...overrideValue,
          templateId: overrideValue.templateId ?? clone.bookingReminder.templateId,
          templateName: overrideValue.templateName ?? clone.bookingReminder.templateName,
        };
        break;
      }
      case 'visitFollowup': {
        const overrideValue = override as AutomationSettings['visitFollowup'];
        clone.visitFollowup = {
          ...clone.visitFollowup,
          ...overrideValue,
          templateId: overrideValue.templateId ?? clone.visitFollowup.templateId,
          templateName: overrideValue.templateName ?? clone.visitFollowup.templateName,
        };
        break;
      }
      default:
        break;
    }
  }

  return clone;
}
