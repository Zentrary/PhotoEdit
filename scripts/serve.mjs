import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root + sep) || pathname.split('/').some(part => part.startsWith('.') || ['node_modules', 'tests', 'test-results'].includes(part))) { response.writeHead(403); response.end('Forbidden'); return; }
    const info = await stat(path);
    if (!info.isFile()) throw new Error('Not a file');
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found');
  }
});
server.listen(port, '0.0.0.0', () => console.log(`PhotoEdit is ready on port ${port}`));
