/**
 * The app is bundled by Vite, so its relative imports are extensionless. Node's
 * ESM resolver needs the real filename, so retry those specifiers with `.ts`
 * (and `/index.ts`) before giving up. Keeps the test runner dependency-free.
 */
const CANDIDATES = ['.ts', '/index.ts']

/** Only a genuinely absent module justifies trying the next candidate. */
const MISSING = new Set([
  'ERR_MODULE_NOT_FOUND',
  'ERR_UNSUPPORTED_DIR_IMPORT',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
])

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.(m|c)?(t|j)sx?$|\.json$/.test(specifier)) {
    for (const suffix of CANDIDATES) {
      try {
        return await next(specifier + suffix, context)
      } catch (error) {
        // Anything else — a bad export map, a permission problem — is a real
        // failure worth surfacing rather than hiding behind the next attempt.
        if (!MISSING.has(error?.code)) throw error
      }
    }
  }

  return next(specifier, context)
}
