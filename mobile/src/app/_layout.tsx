import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { initDatabase } from '../database/sqlite';
import { useOTAUpdate } from '../hooks/useOTAUpdate';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs dashboard if already logged in
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const { isDownloading } = useOTAUpdate();

  useEffect(() => {
    initDatabase().catch((err) => {
      console.error('Failed to initialize SQLite local DB:', err);
    });
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <RootLayoutNav />
        {isDownloading && (
          <View style={styles.otaOverlay}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.otaText}>Đang tải bản vá mới...</Text>
          </View>
        )}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  otaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 17, 23, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  otaText: {
    color: '#f1f3f5',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
