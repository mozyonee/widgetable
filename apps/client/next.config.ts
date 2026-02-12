import withPWA from "next-pwa";

const nextConfig = {
	reactStrictMode: true,
	onDemandEntries: {
		maxInactiveAge: 1000 * 60 * 60, // keep pages compiled for 1 hour
	},

	allowedDevOrigins: [
		"localhost",
		"127.0.0.1",
		"172.20.10.9",

		// optional, for desktop browsers
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://172.20.10.9:3000",
	],
	images: {
		remotePatterns: [
			{
				protocol: "http" as const,
				hostname: "localhost",
				port: "3001",
				pathname: "/**",
			},
			{
				protocol: "http" as const,
				hostname: "172.20.10.9",
				port: "3001",
				pathname: "/**",
			}
		],
		dangerouslyAllowSVG: true,
		unoptimized: process.env.NODE_ENV !== "production",
	},
};

export default withPWA({
	dest: "public",
	disable: process.env.NODE_ENV !== "production",
	skipWaiting: true,
	register: true,
	buildExcludes: [
		/middleware-manifest\.json$/,
		/app-build-manifest\.json$/,
		/_buildManifest\.js$/,
		/_ssgManifest\.js$/,
		/\.map$/,
		/manifest\.json$/,
		/^manifest.*\.js$/,
		/\.well-known\//,
	],
	dynamicStartUrlRedirect: "/offline",
	runtimeCaching: [
		{
			// Static images: sprites, backgrounds, assets
			urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)$/i,
			handler: "CacheFirst",
			options: {
				cacheName: "images",
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
				},
			},
		},
		{
			// Profile pictures from API
			urlPattern: /\/users\/.*\/picture/,
			handler: "StaleWhileRevalidate",
			options: {
				cacheName: "profile-pictures",
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
				},
			},
		},
	],
})(nextConfig);
