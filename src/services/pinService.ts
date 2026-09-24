import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'et.pin';

export const pinService = {
  async setPin(pin: string) {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  },
  async getPin(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_KEY);
  },
  async clearPin() {
    await SecureStore.deleteItemAsync(PIN_KEY);
  },
  async verify(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored === pin;
  },
};