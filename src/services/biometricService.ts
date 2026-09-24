import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const biometricService = {
  /** Is there any biometric hardware on the device? */
  async hasHardware(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  },

  /** Has the user enrolled a fingerprint / face? */
  async isEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  },

  /**
   * Friendly name for the UI.
   * - Android → "Fingerprint" (regardless of what the OS reports,
   *   because Android's BiometricPrompt lumps face + fingerprint together)
   * - iOS → "Face ID" or "Touch ID"
   */
  async getLabel(): Promise<string> {
    if (Platform.OS === 'ios') {
      try {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          return 'Face ID';
        }
        return 'Touch ID';
      } catch {
        return 'Face ID';
      }
    }
    // Android
    return 'Fingerprint';
  },

  /** Combined check — can we actually use biometrics right now? */
  async isAvailable(): Promise<boolean> {
    const [hw, en] = await Promise.all([
      this.hasHardware(),
      this.isEnrolled(),
    ]);
    return hw && en;
  },

  /**
   * Prompt the user. Returns true on success.
   * `promptMessage` is what shows under the OS dialog.
   */
  async authenticate(promptMessage = 'Unlock to continue'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true, // don't allow passcode fallback
      });
      return result.success === true;
    } catch (e) {
      console.warn('[biometric] auth error', e);
      return false;
    }
  },
};