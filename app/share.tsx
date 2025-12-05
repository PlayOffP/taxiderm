import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';

export default function ShareScreen() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Get the current URL
    if (Platform.OS === 'web') {
      setUrl(window.location.origin);
    }
  }, []);

  const qrCodeUrl = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share This App</Text>
      <Text style={styles.subtitle}>Scan this QR code to open on another device</Text>

      {qrCodeUrl ? (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: qrCodeUrl }}
            style={styles.qrCode}
            resizeMode="contain"
          />
        </View>
      ) : (
        <Text style={styles.loading}>Loading QR code...</Text>
      )}

      <Text style={styles.urlText}>{url}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCode: {
    width: 300,
    height: 300,
  },
  urlText: {
    marginTop: 24,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loading: {
    fontSize: 16,
    color: '#999',
  },
});
