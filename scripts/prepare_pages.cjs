const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(distDir)) {
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(docsDir, { recursive: true });
  copyRecursiveSync(distDir, docsDir);

  // Add .nojekyll so GitHub Pages doesn't filter files
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

  // Add 404.html fallback
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    fs.copyFileSync(path.join(distDir, 'index.html'), path.join(docsDir, '404.html'));
  }

  console.log('✅ Successfully prepared GitHub Pages build in /docs and /dist (with .nojekyll & 404.html)');
} else {
  console.error('❌ dist directory does not exist. Run build first.');
}
