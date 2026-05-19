import fs from "fs/promises";
import path from "path";

const root = path.resolve(".");
const outputDir = path.join(root, "data");
const outputFile = path.join(outputDir, "folders.js");
const excludedNames = new Set(["assets", "data", "scripts", ".git"]);

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function normalizeFolderName(relPath) {
  const segments = relPath.split("/").filter(Boolean);
  return segments.join(" / ");
}

function pageTitleFromPath(folderPath) {
  const segments = folderPath.split("/").filter(Boolean);
  return segments[segments.length - 1] || "首頁";
}

function getDirectChildren(folderPath, folders) {
  return folders.filter((item) => {
    if (item.path === folderPath) return false;
    if (!item.path.startsWith(folderPath)) return false;

    const remainder = item.path.slice(folderPath.length);
    return remainder.split("/").filter(Boolean).length === 1;
  });
}

function folderDetail(folderPath, folders) {
  const children = getDirectChildren(folderPath, folders);
  return children.length > 0 ? `${children.length} 個子資料夾` : "目前沒有項目";
}

async function collectFolders(relPath = "") {
  const dirPath = path.join(root, relPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (excludedNames.has(entry.name)) continue;

    const childRelPath = path.posix.join(relPath, entry.name, "/");
    const item = {
      name: relPath ? `${normalizeFolderName(relPath)} / ${entry.name}` : entry.name,
      path: childRelPath,
      detail: relPath ? "細部資料夾" : "主要資料夾",
    };

    folders.push(item);
    folders = folders.concat(await collectFolders(childRelPath));
  }

  return folders;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function childTone(index) {
  const toneClasses = ["tone-gold", "tone-blue", "tone-green", "tone-cyan", "tone-magenta"];
  return toneClasses[index % toneClasses.length];
}

function renderFolderCard(folder, currentPath, tone) {
  const icon = folder.name.charAt(0);
  const relativeHref = currentPath ? folder.path.slice(currentPath.length) : folder.path;
  return `
    <a class="feature-card ${tone}" href="${relativeHref}">
      <span class="card-icon" aria-hidden="true">${icon}</span>
      <span class="card-body">
        <span class="card-title">${folder.name}</span>
        <span class="card-meta">${folder.detail}</span>
      </span>
      <span class="card-arrow" aria-hidden="true">›</span>
    </a>
  `;
}

function generateFolderPageContent(folderPath, folders) {
  const title = pageTitleFromPath(folderPath);
  const children = getDirectChildren(folderPath, folders);
  const childCount = children.length;
  const childSummary = childCount > 0 ? `${childCount} 個子資料夾` : "目前沒有項目";
  const cards = children
    .map((child, index) => renderFolderCard(child, folderPath, childTone(index)))
    .join("\n");

  const childrenSection = childCount > 0
    ? `
      <section class="card-grid" aria-label="${title} 資料夾列表">
        ${cards}
      </section>
    `
    : `
      <div class="empty">這個分類目前還沒有放資料。</div>
    `;

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>
  <header class="topbar">
    <div class="wrap">
      <a class="back" href="../">‹ 回上一層</a>
      <h1 class="page-title">${title}</h1>
      <p class="subtext">${childSummary}</p>
    </div>
  </header>

  <main class="wrap page">
    ${childrenSection}
  </main>

  <script src="/assets/site.js"></script>
</body>
</html>`;
}

async function writeFolderPage(folderPath, folders) {
  const pageDir = path.join(root, folderPath);
  const pageFile = path.join(pageDir, "index.html");
  await ensureDir(pageDir);
  await fs.writeFile(pageFile, generateFolderPageContent(folderPath, folders), "utf8");
}

async function main() {
  const folders = await collectFolders();
  await ensureDir(outputDir);
  await fs.writeFile(outputFile, `const folders = ${JSON.stringify(folders, null, 2)};\n`, "utf8");

  console.log(`Generated ${folders.length} folders to ${toPosixPath(path.relative(root, outputFile))}`);

  for (const folder of folders) {
    await writeFolderPage(folder.path, folders);
    console.log(`Wrote page: ${toPosixPath(folder.path)}index.html`);
  }

  console.log("Folder pages generated. Add a new folder and rerun this script to keep pages synchronized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
