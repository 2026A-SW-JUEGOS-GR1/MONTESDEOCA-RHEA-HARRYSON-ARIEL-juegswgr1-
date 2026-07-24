/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,

	transpilePackages: [
		"@babylonjs/core",
		"@babylonjs/loaders",
		"@babylonjs/materials",
		"@babylonjs/gui",
		"@babylonjs/addons",
	],

	turbopack: {
		rules: {
			"*.{fx}": {
				loaders: ["raw-loader"],
				as: "*.js",
			},
		},
	},
};

module.exports = nextConfig;
