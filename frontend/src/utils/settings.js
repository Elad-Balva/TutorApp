const KEY = "tutortally_settings";

export const DEFAULT_SETTINGS = {
  defaultHourlyPrice: 150,
  defaultDurationMinutes: 60,
  monthlyGoal: 18000,
  preferredPayment: "Bit / PayBox", // must match an id in paymentMethods.js
  notificationsEnabled: true,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
