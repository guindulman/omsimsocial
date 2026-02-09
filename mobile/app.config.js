// Dynamic Expo config so production builds ship without dev-only settings.
//
// - `EAS_BUILD_PROFILE` is set by EAS Build.
// - For local `expo start`, this will behave like a non-production build.

const { withAndroidManifest } = require('@expo/config-plugins');

function withDevCleartextTraffic(config, enabled) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest?.manifest?.application?.[0];
    if (!application?.$) {
      return config;
    }

    if (enabled) {
      application.$['android:usesCleartextTraffic'] = 'true';
    } else if (application.$['android:usesCleartextTraffic']) {
      // Keep production strict by default.
      delete application.$['android:usesCleartextTraffic'];
    }

    return config;
  });
}

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const isDevClient = profile === 'development';
  const isProduction = profile === 'production';

  const plugins = Array.isArray(config.plugins) ? config.plugins.slice() : [];
  const withoutDevClient = plugins.filter((plugin) => plugin !== 'expo-dev-client');
  const finalPlugins = isDevClient ? [...new Set([...withoutDevClient, 'expo-dev-client'])] : withoutDevClient;

  const result = {
    ...config,
    // Stability: some native deps lag new architecture support.
    newArchEnabled: false,
    plugins: finalPlugins,
    // Keep whatever userInterfaceStyle is set, but enforce it is present in production.
    userInterfaceStyle: config.userInterfaceStyle ?? (isProduction ? 'automatic' : undefined),
  };

  return withDevCleartextTraffic(result, isDevClient);
};
