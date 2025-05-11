import { config } from 'dotenv';

// Load the environment variables from .env file
const env = config();

export default {
  expo: {
    name: "warranty-activation",
    slug: "warranty-activation",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.katym87tech.warrantyactivation',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: 'com.katym87tech.warrantyactivation',
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Add the environment variables here
      API_URL: process.env.API_URL || env?.parsed?.API_URL,
      ENVIRONMENT: process.env.ENVIRONMENT || env?.parsed?.ENVIRONMENT,
      eas: {
        projectId: "6374e342-f494-4413-880f-1841b42b892f"
      }
    },
    updates: {
      url: "https://u.expo.dev/6374e342-f494-4413-880f-1841b42b892f"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
}; 