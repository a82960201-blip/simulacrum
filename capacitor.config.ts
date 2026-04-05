import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simulacrum.game',
  appName: 'SIMULACRUM',
  webDir: '.',           // our HTML/JS/CSS lives at root
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0a0a08',
    },
  },
};

export default config;
