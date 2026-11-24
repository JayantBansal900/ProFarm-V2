const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'..');
const artifactDirectory=path.join(root,'../backend/artifacts/phase4f');
fs.mkdirSync(artifactDirectory,{recursive:true});
function readUniqueJson(file) {
 const source=ts.parseJsonText(file,fs.readFileSync(file,'utf8'));
 if(source.parseDiagnostics.length)throw new Error(`Invalid JSON: ${file}`);
 function visit(node){if(ts.isObjectLiteralExpression(node)){const seen=new Set();for(const property of node.properties){const key=property.name?.text;if(seen.has(key))throw new Error(`Duplicate JSON key ${key} in ${file}`);seen.add(key);}}ts.forEachChild(node,visit);}visit(source);
 return JSON.parse(fs.readFileSync(file,'utf8'));
}
const codes=['en','hi','te','ta','kn','ml','mr','bn','gu','pa','or','as','ur'];
const catalogs=Object.fromEntries(codes.map(code=>[code,{}]));
const interfaceKeys=new Set();
const unwrappedInterfaceLiterals=[];
const directory=path.join(root,'src/i18n/locales');
const invariantsFile=path.join(directory,'invariants.json');
const invariants=fs.existsSync(invariantsFile)?readUniqueJson(invariantsFile):[];
if(new Set(invariants).size!==invariants.length)throw new Error('Duplicate invariant keys');
for(const file of fs.readdirSync(directory).filter(file=>file.endsWith('.tsv'))) {
  for(const [index,line] of fs.readFileSync(path.join(directory,file),'utf8').split(/\r?\n/).entries()) {
    if(!line.trim())continue;
    const values=line.split('|');
    if(values.length!==codes.length)throw new Error(`${file}:${index+1}: expected 13 columns, got ${values.length}`);
    const key=values[0];
    for(const [i,code] of codes.entries()) {
      if(Object.hasOwn(catalogs[code],key))throw new Error(`Duplicate ${code}:${key}`);
      if(!values[i].trim())throw new Error(`Empty ${code}:${key}`);
      catalogs[code][key]=values[i];
    }
  }
}
const aliasesFile=path.join(directory,'aliases.json');
if(fs.existsSync(aliasesFile))for(const [alias,key] of Object.entries(readUniqueJson(aliasesFile))) {
  for(const code of codes) {
    if(!catalogs[code][key]) throw new Error(`Unknown alias target ${key}`);
    if(!Object.hasOwn(catalogs[code],alias))catalogs[code][alias]=code==='en'?alias:catalogs[code][key];
  }
}
for(const code of codes)for(const key of invariants)catalogs[code][key]=key;
// Include all audited interface, content, and backend error strings in English.
function walk(directory) {
  for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
    if(item.name==='locales')continue;
    const file=path.join(directory,item.name);
    if(item.isDirectory()) { walk(file);continue; }
    if(!/\.(ts|tsx)$/.test(file))continue;
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    function visit(node) {
      if(ts.isJsxText(node)&&/[a-zA-Z]{2}/.test(node.text.trim()))unwrappedInterfaceLiterals.push({file:path.relative(root,file),text:node.text.trim()});
      if(ts.isJsxExpression(node)&&node.expression&&ts.isStringLiteral(node.expression)&&!ts.isJsxAttribute(node.parent)&&/[a-zA-Z]{2}/.test(node.expression.text)&&!invariants.includes(node.expression.text)&&!(ts.isJsxElement(node.parent)&&node.parent.openingElement.tagName.getText(source)==='style'))unwrappedInterfaceLiterals.push({file:path.relative(root,file),text:node.expression.text});
      if(ts.isCallExpression(node)&&node.expression.getText(source)==='tr'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){catalogs.en[node.arguments[0].text]=node.arguments[0].text;interfaceKeys.add(node.arguments[0].text);}
      if(ts.isPropertyAssignment(node)&&/^(label|title|description|subtitle|eyebrow|action|footnote|unit|detail)$/.test(node.name.getText(source))&&ts.isStringLiteral(node.initializer)&&/[a-zA-Z]{2}/.test(node.initializer.text)) {
        catalogs.en[node.initializer.text]=node.initializer.text;
        if(/[\\/](?:pages|components)[\\/]/.test(file))interfaceKeys.add(node.initializer.text);
      }
      if(ts.isCallExpression(node)&&/^(?:set\w*Error\w*|runAction|errorMessage)$/.test(node.expression.getText(source)))for(const arg of node.arguments)if(ts.isStringLiteral(arg)&&/[A-Z][a-z]+/.test(arg.text)){catalogs.en[arg.text]=arg.text;interfaceKeys.add(arg.text);}
      if(ts.isStringLiteral(node)&&(/[\\/]data[\\/]/.test(file)||/[\\/]validators[\\/]/.test(file)||file.includes('errorHandler')||file.includes('auth.service')||file.includes('weather.service')||file.includes('advisor.service'))&&/[A-Z][a-z]+/.test(node.text)&&!/^https?:/.test(node.text)&&node.text.length>3)catalogs.en[node.text]=node.text;
      ts.forEachChild(node,visit);
    }
    visit(source);
  }
}
walk(path.join(root,'src'));walk(path.join(root,'../backend/src'));
const sourceList=path.join(root,'../backend/artifacts/phase4f/interface-sources.json');
if(fs.existsSync(sourceList))for(const key of JSON.parse(fs.readFileSync(sourceList,'utf8')))catalogs.en[key]=key;
const pattern=text=>[...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(m=>m[1]).sort().join(',');
for(const code of codes)for(const [key,value] of Object.entries(catalogs[code])) {
  if(pattern(key)!==pattern(value))throw new Error(`Placeholder mismatch ${code}:${key}`);
}
fs.writeFileSync(path.join(directory,'catalogs.json'),JSON.stringify(catalogs,null,2)+'\n');
for(const code of codes){const folder=path.join(directory,code);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'translation.json'),JSON.stringify(catalogs[code],null,2)+'\n');}
const publicNames=new Set();
for(const file of ['src/data/crops.ts','src/data/soils.ts','../backend/src/data/crops.ts','../backend/src/data/soils.ts']) {
 const source=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
 function visit(node){if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='name'&&ts.isStringLiteral(node.initializer)&&codes.some(code=>code!=='en'&&catalogs[code][node.initializer.text]))publicNames.add(node.initializer.text);ts.forEachChild(node,visit);}visit(source);
}
fs.writeFileSync(path.join(directory,'search-names.json'),JSON.stringify(Object.fromEntries(codes.map(code=>[code,Object.fromEntries([...publicNames].map(name=>[name,catalogs[code][name]||name]))])),null,2)+'\n');
const report=codes.map(code=>({code,totalKeys:Object.keys(catalogs.en).length,translatedKeys:Object.keys(catalogs[code]).length-invariants.length,preservedInvariantKeys:invariants.length,availableKeys:Object.keys(catalogs[code]).length,missingKeys:Object.keys(catalogs.en).filter(key=>!Object.hasOwn(catalogs[code],key)),coveragePercent:+(100*Object.keys(catalogs[code]).length/Object.keys(catalogs.en).length).toFixed(2),interfaceTotalKeys:interfaceKeys.size,interfacePreservedInvariantKeys:[...interfaceKeys].filter(key=>invariants.includes(key)).length,interfaceMissingKeys:[...interfaceKeys].filter(key=>!Object.hasOwn(catalogs[code],key)),interfaceCoveragePercent:+(100*[...interfaceKeys].filter(key=>Object.hasOwn(catalogs[code],key)).length/interfaceKeys.size).toFixed(2),reviewedKeys:0,reviewStatus:code==='en'?'canonical English source; not independently certified':'draft; native-language and agricultural expert review pending'}));
fs.writeFileSync(path.join(root,'../backend/artifacts/phase4f/coverage.json'),JSON.stringify(report,null,2)+'\n');
console.table(report.map(({code,totalKeys,translatedKeys,coveragePercent})=>({code,totalKeys,translatedKeys,coveragePercent})));
console.log('Interface keys:',interfaceKeys.size,'; untranslated:',report.filter(item=>item.interfaceMissingKeys.length).map(item=>[item.code,item.interfaceMissingKeys]));
if(unwrappedInterfaceLiterals.length)console.error('Unlocalized interface literals:',unwrappedInterfaceLiterals);
if(process.argv.includes('--strict-ui')&&(report.some(item=>item.interfaceMissingKeys.length)||unwrappedInterfaceLiterals.length))process.exitCode=1;
