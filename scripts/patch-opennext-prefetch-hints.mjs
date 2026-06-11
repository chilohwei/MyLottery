import { readFile, writeFile } from "node:fs/promises";

const handlerPath = ".open-next/server-functions/default/handler.mjs";
const serverDir = ".open-next/server-functions/default/.next/server";
const manifests = [
  {
    runtimePath: "/server/prefetch-hints.json",
    filePath: `${serverDir}/prefetch-hints.json`,
    fallback: {},
  },
  {
    runtimePath: "/server/subresource-integrity-manifest.json",
    filePath: `${serverDir}/subresource-integrity-manifest.json`,
    fallback: {},
  },
  {
    runtimePath: "/dynamic-css-manifest",
    filePath: ".open-next/server-functions/default/.next/dynamic-css-manifest",
    fallback: {},
  },
];

let handler = await readFile(handlerPath, "utf8");
const marker =
  "throw new Error(`Unexpected loadManifest(${path2}) call!`)}function evalManifest";

if (!handler.includes(marker)) {
  throw new Error("Could not locate OpenNext loadManifest fallback.");
}

const patches = [];

for (const manifest of manifests) {
  if (handler.includes(`path2.endsWith("${manifest.runtimePath}")`)) {
    continue;
  }

  let value = manifest.fallback;
  try {
    value = JSON.parse(await readFile(manifest.filePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  patches.push(
    `if(path2.endsWith("${manifest.runtimePath}"))return ${JSON.stringify(
      value,
    )};`,
  );
}

if (patches.length === 0) {
  console.log("OpenNext runtime manifest patches already present.");
  process.exit(0);
}

handler = handler.replace(marker, `${patches.join("")}${marker}`);
await writeFile(handlerPath, handler);
console.log(`Patched ${patches.length} OpenNext runtime manifest(s).`);
