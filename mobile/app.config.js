// Dynamic Expo config so production builds ship without dev-only settings.
//
// - `EAS_BUILD_PROFILE` is set by EAS Build.
// - For local `expo start`, this will behave like a non-production build.

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const isDevClient = profile === 'development';
  const isProduction = profile === 'production';

  const plugins = Array.isArray(config.plugins) ? config.plugins.slice() : [];
  const withoutDevClient = plugins.filter((plugin) => plugin !== 'expo-dev-client');
  const finalPlugins = isDevClient ? [...new Set([...withoutDevClient, 'expo-dev-client'])] : withoutDevClient;

  return {
    ...config,
    // Stability: some native deps lag new architecture support.
    newArchEnabled: false,
    plugins: finalPlugins,
    android: {
      ...(config.android ?? {}),
      // Allow http:// during development builds (local API), but enforce https-only in preview/prod.
      usesCleartextTraffic: isDevClient ? true : false,
    },
    // Keep whatever userInterfaceStyle is set, but enforce it is present in production.
    userInterfaceStyle: config.userInterfaceStyle ?? (isProduction ? 'automatic' : undefined),
  };
};

