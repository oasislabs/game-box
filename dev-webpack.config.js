const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const pages = ['singleplayer'];

module.exports = {
  entry: pages.reduce((acc, page) => {
    acc[page] = `./src/pages/${page}/index.js`;
    return acc;
  }, {}),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader?retainLines=true']
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    ...pages.map(page => new HtmlWebpackPlugin({
      filename: `${page}.html`,
      chunks: [ page ],
      template: './src/template.html'
    })),
    new webpack.LoaderOptionsPlugin({
      debug: true
    }),
    new HtmlWebpackPlugin({
      title: 'Oasis Game'
    }),
    new webpack.NormalModuleReplacementPlugin(/env/, function(resource) {
      if (resource.request === 'env') {
        resource.request = '../wasm32-shim'
      }
    })
  ],
  devtool: 'cheap-eval-source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  }
}
