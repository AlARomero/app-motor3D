const path = require('path')
const { ProvidePlugin } = require('webpack')

module.exports = {
    entry: {
        bundle: './src/client/index.js', 
        items: './src/client/items.js',
        bootstrap: './src/client/bootstrap.js',
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        sourceType: 'unambiguous',
                    }
                }
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../../dist/client'),
    },
    plugins: [
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        })
    ]
}