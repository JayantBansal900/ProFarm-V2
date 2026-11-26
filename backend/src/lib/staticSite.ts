import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

/** Where `vite build` puts the frontend, relative to both `src/` and the compiled `dist/`. */
export function defaultFrontendDir(): string {
  return path.resolve(__dirname, '../../../frontend/dist');
}

export function hasBuiltFrontend(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'index.html'));
}

const ONE_YEAR = 'public, max-age=31536000, immutable';

/**
 * Serves the built single-page app from the same server as the API, so the browser sees one
 * origin: sign-in cookies and the CSRF check keep working with no cross-site setup.
 *
 * - Hashed files under /assets are cached for a year; index.html is never cached.
 * - Any other GET page (e.g. /knowledge/crops/mustard) gets index.html so deep links and
 *   refreshes work. Missing files (anything with an extension) and /api paths still 404.
 */
export function mountFrontend(app: Express, dir: string): void {
  const root = path.resolve(dir);
  const indexFile = path.join(root, 'index.html');

  app.use(express.static(root, {
    index: 'index.html',
    setHeaders(res, filePath) {
      const relative = path.relative(root, filePath).split(path.sep).join('/');
      if (relative === 'index.html') res.setHeader('Cache-Control', 'no-cache');
      else if (relative.startsWith('assets/')) res.setHeader('Cache-Control', ONE_YEAR);
      else res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const readOnly = req.method === 'GET' || req.method === 'HEAD';
    if (!readOnly || req.path.startsWith('/api') || path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
}
