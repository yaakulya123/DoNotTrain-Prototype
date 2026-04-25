/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // wagmi/RainbowKit pull in optional Node-only deps; mark them external on the client.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // @metamask/sdk references @react-native-async-storage; we never run in RN, so stub it.
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
