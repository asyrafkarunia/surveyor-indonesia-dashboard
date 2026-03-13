const fs = require('fs');
const path = require('path');

const targetDirs = ['components', '.'];
const targetExts = ['.tsx', '.tsx']; // App.tsx is in the root

const replacements = [
  // Patterns to match: className="... {class} ..." or '... {class} ...' or `{class} `
  // We use regex to ensure we grab complete token words and not partial matches
  // However, simple string replaces for the specific prefixes are safer if done carefully
  
  // Only replace if they don't already have dark: counterparts nearby. 
  // We will do a generic regex replace using boundaries \b
  
  { find: /\bbg-white\b(?! dark:bg-slate-800| dark:bg-slate-900)/g, replace: 'bg-white dark:bg-slate-800' },
  { find: /\bbg-slate-50\b(?! dark:bg-slate-900| dark:bg-slate-800)/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { find: /\btext-slate-900\b(?! dark:text-white| dark:text-slate-100)/g, replace: 'text-slate-900 dark:text-white' },
  { find: /\btext-slate-800\b(?! dark:text-slate-200| dark:text-white)/g, replace: 'text-slate-800 dark:text-slate-200' },
  { find: /\btext-slate-600\b(?! dark:text-slate-300)/g, replace: 'text-slate-600 dark:text-slate-300' },
  { find: /\btext-slate-500\b(?! dark:text-slate-400)/g, replace: 'text-slate-500 dark:text-slate-400' },
  { find: /\bborder-slate-200\b(?! dark:border-slate-700)/g, replace: 'border-slate-200 dark:border-slate-700' },
  { find: /\bborder-slate-300\b(?! dark:border-slate-600)/g, replace: 'border-slate-300 dark:border-slate-600' },
  { find: /\bborder-slate-100\b(?! dark:border-slate-700)/g, replace: 'border-slate-100 dark:border-slate-700' },
  { find: /\btext-slate-700\b(?! dark:text-slate-200)/g, replace: 'text-slate-700 dark:text-slate-200' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach(({ find, replace }) => {
    content = content.replace(find, replace);
  });

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    return 1;
  }
  return 0;
}

function walkDir(dir) {
  let updatedCount = 0;
  if (!fs.existsSync(dir)) return 0;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
        if(file === 'node_modules' || file === 'dist' || file === '.git' || file === 'scripts' || file === 'contexts' || file === 'services') continue;
        if(dir === '.' && file !== 'components') continue;
        updatedCount += walkDir(fullPath);
    } else {
      if (fullPath.endsWith('.tsx')) {
        updatedCount += processFile(fullPath);
      }
    }
  }
  return updatedCount;
}

function main() {
  console.log('Starting dark mode classes injection...');
  let total = 0;
  total += walkDir('components');
  
  // Check App.tsx
  if (fs.existsSync('App.tsx')) {
      total += processFile('App.tsx');
  }

  console.log(`Finished! Updated ${total} files.`);
}

main();
