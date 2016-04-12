'use strict';

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const gulp = require('gulp');
const babel = require('gulp-babel');

const serverDataFiles = ['src/graphql/widgets.json'];
const serverAppFiles = ['src/**/*.js','!src/www/**'];
const webAppHtmlFiles = ['src/www/**/*.html'];
const webAppJsFiles = ['src/www/js/**/*.js'];

const entryPoints = [
	'./src/www/js/index.js',
	'./src/www/js/widgets.js',
	'./src/www/js/widgets-redux.js'
];

gulp.task('process-data-files', function() {

	return gulp.src(serverDataFiles)
		.pipe(gulp.dest('dist/graphql'));

});

gulp.task('process-server-app', function() {

	return gulp.src(serverAppFiles)
		.pipe(babel({ presets: ['react','es2015'] }))
		.on('error', console.dir)
		.pipe(gulp.dest('dist'));

});

gulp.task('process-web-app-html', function() {

	gulp.src(webAppHtmlFiles)
		.pipe(gulp.dest('dist/www'));

});


gulp.task('process-web-app-js', function() {

	return Promise.all(entryPoints.map(function(entryPoint) {

		return new Promise((resolve, reject) => {

			return gulp.src(entryPoint)
				.pipe(webpackStream({
					output: {
						filename: path.basename(entryPoint)
					},
					module: {
						loaders: [{
							test: /\.json$/,
							loader: 'json'
						},{
							test: /\.jsx*$/,
							loader: 'babel-loader',
							exclude: /node_modules/,
							query: {
								presets: ['react', 'es2015']
							}
						}]
					},
					plugins: [
						new webpack.ProvidePlugin({
							'Promise': 'exports?global.Promise!es6-promise',
							'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch',
							'window.fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
						})
					]
				}))
				.on('error', reject)
				.pipe(gulp.dest('dist/www/js'))
				.on('end', resolve);

		});

	})).catch(err => console.dir(err));

});

gulp.task('start-web-server', function() {

	fs.readFile('./config.json', function(err, data) {

		if (err) {
			console.dir(err);
			return;
		}

		const config = JSON.parse(data);

		require('./dist/server.js').default(config.webServer).start().then(function() {
			console.log(`web server started on port ${config.webServer.port}`);
		});
	});

});

gulp.task('default', [
	'process-data-files',
	'process-server-app',
	'process-web-app-html',
	'process-web-app-js'
], () => {

	gulp.watch(serverDataFiles, ['process-data-files']);
	gulp.watch(serverAppFiles, ['process-server-app']);
	gulp.watch(webAppHtmlFiles, ['process-web-app-html']);
	gulp.watch(webAppJsFiles, ['process-web-app-js']);

});