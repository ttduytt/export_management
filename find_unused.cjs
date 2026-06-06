const fs = require('fs');
const path = require('path');

const apiFile = 'D:/PROJECT/WEB/web_export_management/export_management/routes/api.js';
const apiContent = fs.readFileSync(apiFile, 'utf8');
const regex = /router\.(get|post|put|delete)\(\s*['"]([^'"]+)['"]/g;
let match;
const apis = [];
while ((match = regex.exec(apiContent)) !== null) {
  apis.push({ method: match[1].toUpperCase(), path: match[2] });
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles('D:/PROJECT/WEB/web_export_management/export_management');
const fileContents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const unusedApis = [];

apis.forEach(api => {
  // Convert express path params like :id or :factory to regex
  let basePath = api.path.replace(/\/:[^\/]+/g, '');
  if (basePath === '') basePath = api.path; // e.g. for /users it stays /users
  
  // Just check if the string (like "/users" or "users") appears in the codebase, excluding the api.js file itself.
  // We'll search for the basePath in the combined content.
  // Wait, let's just search for the specific route names.
  
  // If it's something like /delivery/:modelId/:factory, base is /delivery.
  // Wait, /delivery is used. So it will be false positive if we just check /delivery.
  
  // Let's do a smarter check: just output all APIs and we manually verify, or let the script do basic verification.
});
