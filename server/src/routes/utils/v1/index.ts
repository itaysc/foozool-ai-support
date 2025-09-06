import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';

const router = express.Router();

function isTypescriptFile(filePath: string): boolean {
  return filePath.endsWith('.ts');
}

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return '';
  }
}

function scanRoutesForPermissions(fileContent: string) {
  const results: Array<{ method: string; route: string; permission: string }> = [];

  const methodRegex = /router\.(get|post|put|patch|delete)\s*\(\s*(['"])([^'"\)]+)\2([\s\S]*?)\)\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = methodRegex.exec(fileContent)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[3];
    const body = match[4] || '';

    // Find hasPermission('x') anywhere inside this route definition body
    const permRegex = /hasPermission\s*\(\s*['"]([^'"\)]+)['"]\s*\)/g;
    let p: RegExpExecArray | null;
    const perms = new Set<string>();
    while ((p = permRegex.exec(body)) !== null) {
      perms.add(p[1]);
    }

    if (perms.size > 0) {
      for (const permission of perms) {
        results.push({ method, route, permission });
      }
    }
  }

  return results;
}

function walkDir(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (isTypescriptFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

router.get('/routes/permissions', authenticateJWT, hasPermission('roles:read'), async (req: Request, res: Response) => {
  try {
    const routesRoot = path.resolve(__dirname, '..', '..');
    const files = walkDir(routesRoot);
    const findings: Array<{ file: string; method: string; route: string; permission: string }> = [];

    for (const file of files) {
      // Skip this util route to avoid self-report cycles
      if (file.endsWith(path.join('utils', 'v1', 'index.ts'))) continue;
      const content = readFileSafe(file);
      if (!content) continue;
      const perms = scanRoutesForPermissions(content);
      for (const item of perms) {
        findings.push({ file: path.relative(routesRoot, file), ...item });
      }
    }

    res.status(200).json({
      status: 200,
      count: findings.length,
      routes: findings,
    });
  } catch (error: any) {
    console.error('Error scanning routes for permissions:', error);
    res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

export default router;


