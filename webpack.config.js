const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DefinePlugin = require('webpack').DefinePlugin;

const version = process.env.NODE_ENV === 'development' ? 'DEV' : process.env.npm_package_version;

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    devtool: (process.env.NODE_ENV === 'development' ? 'inline-source-map' : false),
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['raw-loader', 'postcss-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.css'],
        fallback: {
            buffer: false,
            fs: false,
            path: false,
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Fog Painter',
            filename: 'frame.html',
        }),
        new DefinePlugin({
            URL_PREFIX: JSON.stringify(process.env.URL_PREFIX || ''),
            VERSION: JSON.stringify(version),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'static',
                },
                {
                    from: 'node_modules/canvaskit-wasm/bin/canvaskit.wasm'
                },
                {
                    from: 'static/manifest.json',
                    transform: (content, path) => {
                        let manifest = JSON.parse(content.toString());
                        manifest.version = version;
                        const url_prefix = process.env.URL_PREFIX || '';
                        manifest.background_url = url_prefix + manifest.background_url;
                        manifest.icon = url_prefix + manifest.icon;
                        return JSON.stringify(manifest, null, 4);
                    },
                },
            ]
        }),
    ],
    devServer: {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },

};
