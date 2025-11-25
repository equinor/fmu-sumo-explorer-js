import path from 'path';

const pkgRoot = path.resolve('.');
const entry = path.join(pkgRoot, 'src', 'index.js');

try {
  const mod = await import(`file://${entry}`);
  console.log('Imported entry:', Object.keys(mod));
} catch (e) {
  console.error('Failed to import entry:', e);
  process.exit(1);
}
