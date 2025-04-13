const { defineConfig } = require('@vue/cli-service');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './', // Use a relative path for assets
  configureWebpack: {
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: 'public/index.html',
        filename: 'index.html', // Ensure the output file is named index.html
      }),
    ],
    optimization: {
      splitChunks: false, // Disable code splitting
    },
  },
  css: {
    extract: false, // Inline CSS into the HTML
  },
  chainWebpack: (config) => {
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');
  },
});
