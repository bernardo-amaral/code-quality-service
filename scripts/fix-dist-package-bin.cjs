const fs = require('node:fs');
const path = require('node:path');

const pkgPath = path.join(__dirname, '..', 'dist', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.bin = {
    batmanuel: './src/bin/cli.js',
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Updated dist/package.json bin to ./src/bin/cli.js');
