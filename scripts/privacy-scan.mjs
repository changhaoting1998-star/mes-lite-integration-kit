import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const ignored = new Set([".git", "coverage", "dist", "node_modules", "private"]);
const forbiddenExtensions = new Set([".7z", ".bak", ".db", ".gz", ".key", ".log", ".p12", ".pem", ".pfx", ".rar", ".sqlite", ".sqlite3", ".sql", ".tar", ".zip"]);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const patterns = {
  privateKey: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  feishuAppId: /\bcli_[A-Za-z0-9]{12,}\b/g,
  privateIpv4: /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/g,
  chinaMobile: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
  chinaIdCandidate: /(?<!\d)\d{17}[0-9Xx](?!\d)/g,
  sensitiveOrganizationMarker: /益和|宠品汇|质量中心-质量安全系统/g,
};

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const findings = [];
const files = await walk(root);
for (const path of files) {
  const rel = relative(root, path).replaceAll("\\", "/");
  const name = rel.split("/").at(-1);
  const extension = extname(name).toLowerCase();
  if (name === ".env" || forbiddenExtensions.has(extension)) {
    findings.push({ category: "forbidden_file", file: rel });
    continue;
  }
  if (rel === "scripts/privacy-scan.mjs") continue;
  if (!textExtensions.has(extension) && !["LICENSE", ".gitignore", ".env.example"].includes(name)) continue;
  if ((await stat(path)).size > 2 * 1024 * 1024) {
    findings.push({ category: "oversized_text_file", file: rel });
    continue;
  }
  const text = await readFile(path, "utf8");
  for (const [category, pattern] of Object.entries(patterns)) {
    pattern.lastIndex = 0;
    const count = [...text.matchAll(pattern)].length;
    if (count) findings.push({ category, file: rel, count });
  }
}

if (findings.length) {
  console.error(JSON.stringify({ ok: false, findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, scannedFiles: files.length, findingCount: 0 }));
