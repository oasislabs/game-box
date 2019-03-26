const webpack = require('webpack')
const minimist = require('minimist')

let args = minimist(process.argv.slice(2), {
  boolean: ['confidential'],
  default: {
    confidential: true
  }
})
let network = args.network || 'development'

module.exports = function (cb) {
  console.log('Building the webpack bundle...')
  webpack(require('../webpack.config.js')(web3, network, artifacts, args.confidential), (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error('Webpack build errors:', err || stats.compilation.errors)
      cb(err)
    } else {
      console.log('Webpack build finished.')
    }
    cb()
  })
}
