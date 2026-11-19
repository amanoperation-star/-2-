import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almawaqeet.mihrab',
  appName: 'مواقيت الصلاة - محراب',
  webDir: 'dist-apk',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#03120f',
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
