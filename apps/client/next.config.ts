import withPWA from "next-pwa";

const nextConfig = {
	reactStrictMode: true,

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
	},
};

export default withPWA({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
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
})(nextConfig);
