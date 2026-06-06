const fs = require('fs');
const content = fs.readFileSync('D:/PROJECT/WEB/web_export_management/export_management/routes/api.js', 'utf8');
const regex = /router\.(get|post|put|delete)\(['"]([^'"]+)['"]/g;
let match;
const apis = [];
while ((match = regex.exec(content)) !== null) {
  apis.push({ method: match[1].toUpperCase(), path: match[2] });
}
console.log(JSON.stringify(apis, null, 2));
