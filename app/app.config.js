export default {
  expo: {
    name: "mindmend-expo",
    slug: "mindmend-expo",
    version: "1.0.0",
    ios: {
      bundleIdentifier: "com.yourcompany.mindmendexpo"
    },
    plugins: [
      "expo-web-browser", 
      "expo-secure-store"
    ],
    extra: {
      eas: {
        projectId: "4dd98909-37eb-4a2f-b1b8-8c5fa36e9cd3"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/4dd98909-37eb-4a2f-b1b8-8c5fa36e9cd3"
    }
  }
}; 