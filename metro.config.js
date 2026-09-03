const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { resolveRequest: defaultResolveRequest } = config.resolver;

// zustand's package.json "exports" map has no "browser" condition, so on
// web Metro falls through to its "import" condition, which points at
// esm/*.mjs files containing a bare `import.meta.env` reference. Metro
// bundles those as plain scripts (not real ES modules), so `import.meta`
// throws at runtime and the app never mounts. Force zustand's "react-native"
// condition instead, which resolves to the same CommonJS files native
// already uses and has none of this.
config.resolver.resolveRequest = (context, moduleName, platform, ...rest) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['require', 'react-native'] },
      moduleName,
      platform
    );
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform, ...rest)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
