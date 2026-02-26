import { join } from "path";
import withPWA from "next-pwa";

const remotePatterns: { protocol: "http" | "https"; hostname: string; port?: string; pathname: string }[] = [
	{ protocol: "http", hostname: "localhost", port: "3001", pathname: "/**" },
	{ protocol: "http", hostname: "172.20.10.9", port: "3001", pathname: "/**" },
];

if (process.env.NEXT_PUBLIC_SERVER_URL) {
	try {
		const url = new URL(process.env.NEXT_PUBLIC_SERVER_URL);
		remotePatterns.push({
			protocol: url.protocol.replace(":", "") as "http" | "https",
			hostname: url.hostname,
			...(url.port ? { port: url.port } : {}),
			pathname: "/**",
		});
	} catch {}
}

const nextConfig = {
	output: "standalone" as const,
	outputFileTracingRoot: join(__dirname, "../../"),
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
		remotePatterns,
		dangerouslyAllowSVG: true,
		unoptimized: process.env.NODE_ENV !== "production",
	},
};

export default withPWA({
	dest: "public",
	disable: process.env.NODE_ENV !== "production",
	skipWaiting: true,
	register: false,
	importScripts: ["/push-sw.js"],
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
	publicExcludes: [
		"!assets/**/*",
		"!assets_new/**/*",
		"!backgrounds/**/*",
		"!pets/**/*",
		"!valentine/**/*",
		"!fonts/**/*",
	],
	dynamicStartUrlRedirect: "/auth",
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
