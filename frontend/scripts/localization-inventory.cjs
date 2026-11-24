// Audit source text without changing canonical identifiers or agricultural data.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const entries = new Map();
function add(text, file, category) {
  text = text.replace(/\s+/g, ' ').trim();
  if (!/[a-zA-Z]{2}/.test(text)) return;
  const key = `${category}:${text}`;
  const value = entries.get(key) || { text, category, files: [] };
  if (!value.files.includes(file)) value.files.push(file);
  entries.set(key, value);
}
function walk(dir) {
  for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const file = `${dir}/${item.name}`;
    if (item.isDirectory()) { if (item.name !== 'i18n') walk(file); continue; }
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxText(node)) add(node.text, file, 'interface');
      if (ts.isStringLiteral(node) && !ts.isImportDeclaration(node.parent) && !ts.isLiteralTypeNode(node.parent)) {
        const text = node.text;
        if (text.length > 2 && !/^(https?:|\/|\.|#|bg-|text-|w-|h-|flex|grid|M\d)/.test(text) && !/(?:rounded-|border-|\bpx-\d|\bfont-)/.test(text)) {
          add(text, file, file.includes('/data/') ? 'agricultural-content' : file.includes('/validators/') ? 'validation' : file.startsWith('backend/') ? 'backend-content' : 'candidate');
        }
      }
      if (ts.isTemplateExpression(node) && ts.isJsxExpression(node.parent)) {
        add(node.head.text + node.templateSpans.map((span, index) => `{{v${index}}}` + span.literal.text).join(''), file, 'parameterized');
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
walk('frontend/src'); walk('backend/src');
const result = [...entries.values()].sort((a,b) => a.category.localeCompare(b.category) || a.text.localeCompare(b.text));
const target = path.join(root, 'backend/artifacts/phase4f');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'inventory.json'), JSON.stringify(result, null, 2));
console.log(Object.fromEntries([...new Set(result.map(e => e.category))].map(category => [category, result.filter(e => e.category === category).length])));
