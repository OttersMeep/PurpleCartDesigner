// build.js
const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'purplecart_designer.js',
    format: 'iife', // Wrap everything in a function for Blockbench
    globalName: 'plugin', // This isn't used by Blockbench, but avoids polluting global scope
    platform: 'browser',
    target: ['chrome58', 'firefox57'], // Blockbench runs in Electron
    minify: false,
}).then(() => {
    console.log('✅ Plugin bundled as purplecart_designer.js');
}).catch(() => process.exit(1));
