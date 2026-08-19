const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable .wasm resolution for expo-sqlite
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./global.css" });
