const { withGradleProperties } = require('expo/config-plugins');

// The project lives under a non-ASCII path on some developers' machines
// (e.g. a localized "Documents" folder such as "ドキュメント"). The Android
// Gradle Plugin refuses to build from such a path by default on Windows.
// This has been safe to override in practice with modern AAPT2/NDK, so we
// set it on every prebuild instead of asking everyone to move the project.
const KEY = 'android.overridePathCheck';

module.exports = function withAndroidOverridePathCheck(config) {
  return withGradleProperties(config, (config) => {
    const existing = config.modResults.find(
      (item) => item.type === 'property' && item.key === KEY
    );
    if (existing && existing.type === 'property') {
      existing.value = 'true';
    } else {
      config.modResults.push({ type: 'property', key: KEY, value: 'true' });
    }
    return config;
  });
};
