const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
    { pattern: /(?<!dark:)border-slate-100(?!\s+dark:border-)/g, replacement: 'border-slate-100 dark:border-slate-700/50' },
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
                console.log(`Updated border: ${fullPath}`);
            }
        }
    });
}

processDirectory(srcDir);
