#!/usr/bin/env node
/**
 * CRM-AI PRO - Page Consistency Checker
 * 
 * This script checks for missing or disconnected pages in the CRM-AI PRO application.
 * It analyzes the codebase to find referenced pages that don't exist and ensures
 * all navigation is properly connected.
 */

const fs = require('fs');
const path = require('path');

// Define the project root directory
const PROJECT_ROOT = process.cwd();
const APP_DIR = path.join(PROJECT_ROOT, 'app');

// Define common page patterns that should exist
const COMMON_PAGES = [
  'page.tsx',
  'layout.tsx',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx'
];

// Define critical routes that should exist for each role
const CRITICAL_ROUTES = {
  mobile: [
    '/m/tech/dashboard',
    '/m/tech/jobs',
    '/m/tech/job/[id]',
    '/m/tech/map',
    '/m/tech/profile',
    '/m/sales/dashboard',
    '/m/sales/leads',
    '/m/sales/meetings',
    '/m/sales/meeting/[id]',
    '/m/sales/briefing/[contactId]',
    '/m/sales/profile',
    '/m/owner/dashboard',
    '/m/owner/reports',
    '/m/office/dashboard'
  ],
  desktop: [
    '/inbox',
    '/jobs',
    '/contacts',
    '/dispatch/map',
    '/analytics',
    '/finance/dashboard',
    '/admin/users',
    '/admin/settings',
    '/admin/automation',
    '/admin/llm-providers',
    '/admin/audit',
    '/tech/dashboard',
    '/tech/jobs',
    '/sales/dashboard',
    '/marketing/campaigns'
  ]
};

// Common patterns to look for in code that indicate page references
const PATTERN_INDICATORS = [
  'href="',
  'router.push(',
  'Link',
  'Navigate',
  'redirect(',
  'permanentRedirect('
];

// Pages that are known to be dynamically generated (with [id] parameters)
const DYNAMIC_PAGE_PATTERNS = [
  '[id]',
  '[jobId]',
  '[contactId]',
  '[meetingId]',
  '[leadId]',
  '[estimateId]'
];

console.log('🔍 CRM-AI PRO - Page Consistency Checker');
console.log('=====================================');

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to check if directory has required page files
function checkDirectoryForPages(dirPath) {
  const files = fs.readdirSync(dirPath);
  const pageFiles = files.filter(file => 
    COMMON_PAGES.some(page => file === page)
  );
  
  return {
    hasPage: pageFiles.includes('page.tsx'),
    hasLayout: pageFiles.includes('layout.tsx'),
    hasRequiredFiles: pageFiles.length > 0,
    files: pageFiles
  };
}

// Function to find page references in code files
function findPageReferences() {
  const allFiles = getAllFiles(PROJECT_ROOT);
  const codeFiles = allFiles.filter(file => 
    file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')
  );
  
  const references = [];
  
  codeFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for href attributes
      const hrefMatches = content.match(/href\s*=\s*["']([^"']+)["']/g);
      if (hrefMatches) {
        hrefMatches.forEach(match => {
          const url = match.match(/["']([^"']+)["']/)[1];
          if (url.startsWith('/') && !url.includes('http')) {
            references.push({
              file: path.relative(PROJECT_ROOT, file),
              url: url,
              type: 'href'
            });
          }
        });
      }
      
      // Look for router.push calls
      const pushMatches = content.match(/router\.push\s*\(\s*["']([^"']+)["']\s*\)/g);
      if (pushMatches) {
        pushMatches.forEach(match => {
          const url = match.match(/["']([^"']+)["']/)[1];
          if (url.startsWith('/') && !url.includes('http')) {
            references.push({
              file: path.relative(PROJECT_ROOT, file),
              url: url,
              type: 'router.push'
            });
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not read file: ${file}`);
    }
  });
  
  return references;
}

// Function to check if a path exists in the app directory
function doesPathExist(urlPath) {
  // Convert URL path to file system path
  let fsPath = urlPath.replace(/^\//, ''); // Remove leading slash

  // Handle dynamic routes by replacing [param] with [param]
  // (keeping the brackets)
  fsPath = fsPath.replace(/\[([^[\]]*)\]/g, '[$1]');

  // Special handling for index routes and nested directories
  if (!fsPath) {
    fsPath = 'page';
  } else if (!fsPath.includes('.')) {
    // For routes like /inbox, check for both /inbox/page.tsx and /inbox.tsx
    // Also handle nested routes like /admin/users -> /admin/users/page.tsx
    const directPagePath = path.join(APP_DIR, fsPath, 'page.tsx');
    const directPagePathJS = path.join(APP_DIR, fsPath, 'page.js');
    if (fs.existsSync(directPagePath) || fs.existsSync(directPagePathJS)) {
      return true;
    }

    // Handle root-level pages like /page.tsx for the homepage
    const rootPagePath = path.join(APP_DIR, `${fsPath}.tsx`);
    const rootPagePathJS = path.join(APP_DIR, `${fsPath}.js`);
    if (fs.existsSync(rootPagePath) || fs.existsSync(rootPagePathJS)) {
      return true;
    }

    // For routes like /admin/users, check if /admin/users/page.tsx exists
    fsPath = path.join(fsPath, 'page');
  }

  // Check if the page file exists
  const fullPagePath = path.join(APP_DIR, `${fsPath}.tsx`);
  const fullPagePathJS = path.join(APP_DIR, `${fsPath}.js`);
  const directoryPath = path.join(APP_DIR, urlPath.replace(/^\//, ''));

  // Handle nested routes like /admin/users
  if (urlPath.includes('/') && !urlPath.endsWith('.tsx') && !urlPath.endsWith('.js')) {
    const pathParts = urlPath.split('/').filter(part => part);
    let currentPath = APP_DIR;

    for (const part of pathParts) {
      currentPath = path.join(currentPath, part);
      if (fs.existsSync(path.join(currentPath, 'page.tsx')) ||
          fs.existsSync(path.join(currentPath, 'page.js'))) {
        return true;
      }
    }
  }

  return fs.existsSync(fullPagePath) ||
         fs.existsSync(fullPagePathJS) ||
         fs.existsSync(path.join(APP_DIR, urlPath.replace(/^\//, ''), 'page.tsx')) ||
         fs.existsSync(path.join(APP_DIR, urlPath.replace(/^\//, ''), 'page.js'));
}

// Function to validate critical routes
function validateCriticalRoutes() {
  const missingRoutes = [];
  
  [...CRITICAL_ROUTES.mobile, ...CRITICAL_ROUTES.desktop].forEach(route => {
    if (!doesPathExist(route)) {
      missingRoutes.push(route);
    }
  });
  
  return missingRoutes;
}

// Function to validate found references
function validateReferences(references) {
  const missingRefs = [];
  const existingRefs = [];
  
  references.forEach(ref => {
    if (!doesPathExist(ref.url) && !DYNAMIC_PAGE_PATTERNS.some(pattern => ref.url.includes(pattern))) {
      missingRefs.push(ref);
    } else {
      existingRefs.push(ref);
    }
  });
  
  return { missingRefs, existingRefs };
}

// Main execution
try {
  console.log('\n📋 Checking critical routes...');
  const missingCriticalRoutes = validateCriticalRoutes();
  
  if (missingCriticalRoutes.length > 0) {
    console.log('❌ Missing critical routes:');
    missingCriticalRoutes.forEach(route => {
      console.log(`   • ${route}`);
    });
  } else {
    console.log('✅ All critical routes exist');
  }

  console.log('\n🔍 Analyzing page references in code...');
  const references = findPageReferences();
  console.log(`Found ${references.length} page references in code`);
  
  console.log('\n🔍 Validating page references...');
  const { missingRefs, existingRefs } = validateReferences(references);
  
  if (missingRefs.length > 0) {
    console.log('❌ Missing pages referenced in code:');
    missingRefs.forEach(ref => {
      console.log(`   • ${ref.url} (referenced in ${ref.file} via ${ref.type})`);
    });
  } else {
    console.log('✅ All referenced pages exist');
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total critical routes: ${CRITICAL_ROUTES.mobile.length + CRITICAL_ROUTES.desktop.length}`);
  console.log(`   Missing critical routes: ${missingCriticalRoutes.length}`);
  console.log(`   Total page references found: ${references.length}`);
  console.log(`   Validated references: ${existingRefs.length}`);
  console.log(`   Missing referenced pages: ${missingRefs.length}`);
  
  // Check for potential orphaned pages (pages that exist but aren't referenced anywhere)
  console.log('\n🔍 Checking for orphaned pages...');
  const allAppFiles = getAllFiles(APP_DIR);
  const pageFiles = allAppFiles.filter(file => 
    file.endsWith('page.tsx') || file.endsWith('page.js')
  );
  
  // Convert page file paths to URL paths for comparison
  const pagePaths = pageFiles.map(file => {
    const relPath = path.relative(APP_DIR, file);
    let urlPath = '/' + relPath
      .replace(/\\/g, '/')  // Normalize path separators
      .replace(/\/page\.(tsx|js)/, '')  // Remove page.tsx/js
      .replace(/\[([^[\]]*)\]/g, ':$1');  // Convert [id] to :id for comparison
    
    if (urlPath === '/') urlPath = '';
    return { file: relPath, url: urlPath };
  });
  
  // Check if page paths are referenced in code
  const orphanedPages = [];
  pagePaths.forEach(page => {
    const isReferenced = references.some(ref => 
      ref.url.includes(page.url.replace(':', '[').replace(':', ']')) || 
      page.url.includes(ref.url.replace(':', '[').replace(':', ']'))
    );
    
    if (!isReferenced) {
      orphanedPages.push(page);
    }
  });
  
  if (orphanedPages.length > 0) {
    console.log('💡 Potential orphaned pages (exist but not referenced):');
    orphanedPages.forEach(page => {
      console.log(`   • ${page.url} (${page.file})`);
    });
  } else {
    console.log('✅ No obvious orphaned pages found');
  }

  // Final status
  console.log('\n🎯 Final Status:');
  if (missingCriticalRoutes.length === 0 && missingRefs.length === 0) {
    console.log('✅ All pages are properly connected!');
    process.exit(0);
  } else {
    console.log('⚠️ Some issues were found that should be addressed');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error running page consistency checker:', error.message);
  process.exit(1);
}