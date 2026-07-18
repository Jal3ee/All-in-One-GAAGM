const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
    { pattern: /(?<!dark:)text-slate-800(?!\s+dark:text-slate)/g, replacement: 'text-slate-800 dark:text-slate-100' },
    { pattern: /(?<!dark:)text-slate-700(?!\s+dark:text-slate)/g, replacement: 'text-slate-700 dark:text-slate-200' },
    { pattern: /(?<!dark:)text-slate-600(?!\s+dark:text-slate)/g, replacement: 'text-slate-600 dark:text-slate-300' },
    { pattern: /(?<!dark:)text-slate-500(?!\s+dark:text-slate)/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { pattern: /(?<!dark:)bg-white(?!(\/|(?:\s+dark:bg-)))/g, replacement: 'bg-white dark:bg-slate-800' },
    { pattern: /(?<!dark:)bg-white\/(\d+)(?!\s+dark:bg-)/g, replacement: 'bg-white/$1 dark:bg-slate-800/$1' },
    { pattern: /(?<!dark:)bg-slate-50(?!\s+dark:bg-)/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
    { pattern: /(?<!dark:)bg-slate-100(?!\s+dark:bg-)/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
    { pattern: /(?<!dark:)border-slate-200(?!\s+dark:border-)/g, replacement: 'border-slate-200 dark:border-slate-700' },
    { pattern: /(?<!dark:)border-slate-300(?!\s+dark:border-)/g, replacement: 'border-slate-300 dark:border-slate-600' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            replacements.forEach(({ pattern, replacement }) => {
                content = content.replace(pattern, replacement);
            });
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(srcDir);
console.log("Done.");
