import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useOTAUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAndApplyUpdate = async () => {
    // Disable check in Dev environment to prevent crash
    if (__DEV__) {
      console.log('OTA Updates are disabled in development mode.');
      return;
    }

    try {
      setIsChecking(true);
      setError(null);

      // Check if update is available on Expo server
      const updateCheck = await Updates.checkForUpdateAsync();

      if (updateCheck.isAvailable) {
        setIsChecking(false);
        setIsDownloading(true);

        console.log('New patch version detected, downloading in background...');
        // Fetch the update
        await Updates.fetchUpdateAsync();
        setIsDownloading(false);

        // Notify user and reload
        Alert.alert(
          'Cập nhật thành công',
          'Ứng dụng đã tải xong phiên bản mới. Bấm OK để khởi động lại ngay lập tức!',
          [
            {
              text: 'OK',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (e: any) {
      console.warn('Failed to fetch OTA update:', e);
      setError(e.message || 'Error checking for updates');
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    checkAndApplyUpdate();
  }, []);

  return {
    isChecking,
    isDownloading,
    error,
    checkAndApplyUpdate,
  };
}
