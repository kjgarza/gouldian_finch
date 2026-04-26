import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

function readInstalledVersion(packageName) {
  const entryPath = require.resolve(packageName);
  let currentDir = dirname(entryPath);

  while (true) {
    const packageJsonPath = join(currentDir, "package.json");

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      if (packageJson.name === packageName) {
        return packageJson.version;
      }
    } catch {
      // Keep walking upwards until we find the owning package.json.
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Unable to locate package.json for ${packageName}`);
    }
    currentDir = parentDir;
  }
}

const platformArchToPackage = {
  "android-arm": "@rollup/rollup-android-arm-eabi",
  "android-arm64": "@rollup/rollup-android-arm64",
  "darwin-arm64": "@rollup/rollup-darwin-arm64",
  "darwin-x64": "@rollup/rollup-darwin-x64",
  "freebsd-arm64": "@rollup/rollup-freebsd-arm64",
  "freebsd-x64": "@rollup/rollup-freebsd-x64",
  "linux-arm": "@rollup/rollup-linux-arm-gnueabihf",
  "linux-arm64": "@rollup/rollup-linux-arm64-gnu",
  "linux-loong64": "@rollup/rollup-linux-loongarch64-gnu",
  "linux-ppc64": "@rollup/rollup-linux-ppc64-gnu",
  "linux-riscv64": "@rollup/rollup-linux-riscv64-gnu",
  "linux-s390x": "@rollup/rollup-linux-s390x-gnu",
  "linux-x64": "@rollup/rollup-linux-x64-gnu",
  "win32-arm64": "@rollup/rollup-win32-arm64-msvc",
  "win32-ia32": "@rollup/rollup-win32-ia32-msvc",
  "win32-x64": "@rollup/rollup-win32-x64-msvc"
};

const targetPackage = platformArchToPackage[`${process.platform}-${process.arch}`];

const lockfile = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const versionMismatches = [];

for (const packageName of ["vite", "rollup", "@tailwindcss/vite"]) {
  const lockfileVersion = lockfile.packages?.[`node_modules/${packageName}`]?.version;

  if (!lockfileVersion) {
    continue;
  }

  try {
    const installedVersion = readInstalledVersion(packageName);

    if (installedVersion !== lockfileVersion) {
      versionMismatches.push(`${packageName}@${installedVersion} != lockfile ${lockfileVersion}`);
    }
  } catch {
    versionMismatches.push(`${packageName} is missing`);
  }
}

if (versionMismatches.length > 0) {
  console.warn("Dependency install is out of sync with package-lock.json:");
  for (const mismatch of versionMismatches) {
    console.warn(`- ${mismatch}`);
  }

  const reinstall = spawnSync("npm", ["install"], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (reinstall.status !== 0) {
    process.exit(reinstall.status ?? 1);
  }
}

if (!targetPackage) {
  process.exit(0);
}

let missingNativePackage = false;

try {
  require.resolve(targetPackage);
} catch {
  missingNativePackage = true;
}

let rollupPackage;

try {
  rollupPackage = require("rollup/package.json");
} catch {
  process.exit(0);
}

const expectedVersion = rollupPackage.optionalDependencies?.[targetPackage];

if (!expectedVersion) {
  console.error(`Unable to determine the expected version for ${targetPackage}.`);
  process.exit(1);
}

if (!missingNativePackage) {
  process.exit(0);
}

console.warn(`Missing ${targetPackage}; installing ${targetPackage}@${expectedVersion} to repair Rollup's native dependency.`);

const install = spawnSync(
  "npm",
  ["install", "--no-save", `${targetPackage}@${expectedVersion}`],
  {
    stdio: "inherit",
    shell: process.platform === "win32"
  }
);

if (install.status !== 0) {
  process.exit(install.status ?? 1);
}
