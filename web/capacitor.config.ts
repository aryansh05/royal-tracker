import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aryan.royaltracker',
  appName: 'Royal Tracker',
  webDir: 'www',
  server: {
    url: 'https://royal-tracker-mine.vercel.app',
    cleartext: true
  }
};

export default config;