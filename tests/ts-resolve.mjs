/**
 * The app is bundled by Vite, so its relative imports are extensionless. Node's
 * ESM resolver needs the real filename, so retry those specifiers with `.ts`
 * (and `/index.ts`) before giving up. Keeps the test runner dependency-free.
 */
const CANDIDATES = ['.ts', '/index.ts']

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.(m|c)?(t|j)sx?$|\.json$/.test(specifier)) {
    for (const suffix of CANDIDATES) {
      try {
        return await next(specifier + suffix, context)
      } catch {
        // Fall through to the next candidate, then to Node's own resolution.
      }
    }
  }

  return next(specifier, context)
}
