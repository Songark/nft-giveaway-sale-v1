const path = require('path')

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  staticPageGenerationTimeout: 1000,
  
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  }
}

// const withCSS = require('@zeit/next-css')
// const withImages = require('next-images');
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// module.exports = withImages(
//   withCSS({
//     plugins: [new MiniCssExtractPlugin()],
//     trailingSlash: true,
//     exportPathMap: function() {
//       return {
//         '/': { page: '/' },
//       };
//     },
//     publicRuntimeConfig: {
//       localeSubpaths: typeof process.env.LOCALE_SUBPATHS === 'string'
//         ? process.env.LOCALE_SUBPATHS
//         : 'none',
//     },
//     webpack: (config, options) => {
//       cssModules: true,
//       config.node = {
//       }
//       return config;
//     },
//   })
// );
