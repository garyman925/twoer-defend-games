const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/core/Game.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      // 使用相對路徑，確保在 XAMPP 上可以正常訪問
      publicPath: './',
      clean: true
    },
    mode: argv.mode || 'development',
    devtool: isProduction ? false : 'source-map',
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'assets'),
          publicPath: '/assets'
        },
        {
          directory: path.join(__dirname),
          publicPath: '/'
        }
      ],
      hot: true,
      port: 3000,
      open: true
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav|ogg|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[path][name][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]'
          }
        },
        {
          test: /\.(json)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/data/[name][ext]'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        title: 'Tower Defense Game',
        inject: 'body',
        scriptLoading: 'defer'
      }),
      // 複製靜態資源到 dist 目錄
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'assets',
            to: 'assets',
            noErrorOnMissing: true,
            globOptions: {
              ignore: ['**/*.DS_Store']
            }
          },
          // 複製獨立的 HTML 頁面
          {
            from: 'my-ship.html',
            to: 'my-ship.html',
            noErrorOnMissing: true
          },
          {
            from: 'shop.html',
            to: 'shop.html',
            noErrorOnMissing: true
          },
          {
            from: 'leaderboard.html',
            to: 'leaderboard.html',
            noErrorOnMissing: true
          },
          {
            from: 'quiz.html',
            to: 'quiz.html',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@assets': path.resolve(__dirname, 'assets'),
        '@config': path.resolve(__dirname, 'config')
      }
    }
  };
};