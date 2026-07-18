const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
    // Fix missing prefix on injected dark:bg-slate-... classes
    { 
        pattern: /([a-z-]+:)(bg-white(?:\/\d+)?|bg-slate-\d+)\s+dark:(bg-slate-\d+(?:\/\d+)?)/g, 
        replacement: '$1$2 dark:$1$3' 
    },
    // Fix missing prefix on injected dark:text-slate-... classes
    { 
        pattern: /([a-z-]+:)(text-slate-\d+)\s+dark:(text-slate-\d+)/g, 
        replacement: '$1$2 dark:$1$3' 
    },
    // Fix missing prefix on injected dark:border-slate-... classes
    { 
        pattern: /([a-z-]+:)(border-slate-\d+)\s+dark:(border-slate-\d+)/g, 
        replacement: '$1$2 dark:$1$3' 
    }
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
                console.log(`Fixed prefix issue in: ${fullPath}`);
            }
        }
    });
}

processDirectory(srcDir);
console.log("Fix done.");
