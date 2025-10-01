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

  // Enhanced regex to handle different route definition patterns
  // This covers: router.method('route', middleware, handler) and router.method('route', middleware1, middleware2, handler)
  const methodRegex = /router\.(get|post|put|patch|delete)\s*\(\s*(['"])([^'"\)]+)\2\s*,([\s\S]*?)\)\s*;/g;
  let match: RegExpExecArray | null;
  
  while ((match = methodRegex.exec(fileContent)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[3];
    const middlewareChain = match[4] || '';

    // Find hasPermission('x') anywhere in the middleware chain
    const permRegex = /hasPermission\s*\(\s*['"]([^'"\)]+)['"]\s*\)/g;
    let p: RegExpExecArray | null;
    const perms = new Set<string>();
    
    while ((p = permRegex.exec(middlewareChain)) !== null) {
      perms.add(p[1]);
    }

    // Also check for hasPermissionHelper usage
    const helperRegex = /hasPermissionHelper\s*\(\s*['"]([^'"\)]+)['"]\s*\)/g;
    while ((p = helperRegex.exec(middlewareChain)) !== null) {
      perms.add(p[1]);
    }

    if (perms.size > 0) {
      for (const permission of perms) {
        results.push({ method, route, permission });
      }
    } else {
      // Check if route has authentication but no explicit permissions
      if (middlewareChain.includes('authenticateJWT') || middlewareChain.includes('authenticateWebhook')) {
        results.push({ method, route, permission: 'authenticated_only' });
      } else {
        // Route with no authentication at all
        results.push({ method, route, permission: 'public' });
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
    const findings: Array<{ file: string; method: string; route: string; permission: string; fullPath: string }> = [];
    const routeMap = new Map<string, Set<string>>(); // route -> permissions
    const permissionMap = new Map<string, Set<string>>(); // permission -> routes

    for (const file of files) {
      // Skip this util route to avoid self-report cycles
      if (file.endsWith(path.join('utils', 'v1', 'index.ts'))) continue;
      const content = readFileSafe(file);
      if (!content) continue;
      const perms = scanRoutesForPermissions(content);
      
      for (const item of perms) {
        const relativeFile = path.relative(routesRoot, file);
        const fullPath = `/api/v1${item.route}`;
        
        findings.push({ 
          file: relativeFile, 
          method: item.method, 
          route: item.route, 
          permission: item.permission,
          fullPath 
        });

        // Build route map
        if (!routeMap.has(fullPath)) {
          routeMap.set(fullPath, new Set());
        }
        routeMap.get(fullPath)!.add(item.permission);

        // Build permission map
        if (!permissionMap.has(item.permission)) {
          permissionMap.set(item.permission, new Set());
        }
        permissionMap.get(item.permission)!.add(fullPath);
      }
    }

    // Generate summary statistics
    const summary = {
      totalRoutes: routeMap.size,
      totalPermissions: permissionMap.size,
      totalFindings: findings.length,
      routesWithoutPermissions: Array.from(routeMap.entries())
        .filter(([_, perms]) => perms.has('authenticated_only'))
        .map(([route, _]) => route),
      publicRoutes: Array.from(routeMap.entries())
        .filter(([_, perms]) => perms.has('public'))
        .map(([route, _]) => route),
      mostUsedPermissions: Array.from(permissionMap.entries())
        .map(([perm, routes]) => ({ permission: perm, routeCount: routes.size }))
        .sort((a, b) => b.routeCount - a.routeCount)
        .slice(0, 10),
      permissionBreakdown: {
        withSpecificPermissions: Array.from(permissionMap.entries())
          .filter(([perm, _]) => !['authenticated_only', 'public'].includes(perm))
          .length,
        authenticatedOnly: permissionMap.get('authenticated_only')?.size || 0,
        public: permissionMap.get('public')?.size || 0
      }
    };

    res.status(200).json({
      status: 200,
      summary,
      count: findings.length,
      routes: findings,
    });
  } catch (error: any) {
    console.error('Error scanning routes for permissions:', error);
    res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

// Additional route to check coverage against server.ts registered routes
router.get('/routes/coverage', authenticateJWT, hasPermission('roles:read'), async (req: Request, res: Response) => {
  try {
    const serverTsPath = path.resolve(__dirname, '..', '..', '..', 'server.ts');
    const serverContent = readFileSafe(serverTsPath);
    
    if (!serverContent) {
      return res.status(500).json({ status: 500, error: 'Could not read server.ts' });
    }

    // Extract registered routes from server.ts
    const routeRegex = /this\.app\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)RoutesV1\s*\)/g;
    const registeredRoutes: string[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = routeRegex.exec(serverContent)) !== null) {
      registeredRoutes.push(match[1]);
    }

    // Get current scanned routes
    const routesRoot = path.resolve(__dirname, '..', '..');
    const files = walkDir(routesRoot);
    const scannedRoutes = new Set<string>();
    
    for (const file of files) {
      if (file.endsWith(path.join('utils', 'v1', 'index.ts'))) continue;
      const content = readFileSafe(file);
      if (!content) continue;
      const perms = scanRoutesForPermissions(content);
      perms.forEach(item => {
        scannedRoutes.add(`/api/v1${item.route}`);
      });
    }

    // Check coverage
    const coverage = {
      registeredRoutesInServerTs: registeredRoutes,
      totalRegisteredRoutes: registeredRoutes.length,
      scannedRouteFiles: files.length - 1, // -1 for utils route
      coverageAnalysis: {
        routesWithPermissions: Array.from(scannedRoutes).filter(route => 
          !route.includes('authenticated_only') && !route.includes('public')
        ).length,
        routesAuthenticatedOnly: Array.from(scannedRoutes).filter(route => 
          route.includes('authenticated_only')
        ).length,
        publicRoutes: Array.from(scannedRoutes).filter(route => 
          route.includes('public')
        ).length
      }
    };

    res.status(200).json({
      status: 200,
      coverage
    });
  } catch (error: any) {
    console.error('Error checking route coverage:', error);
    res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

export default router;


