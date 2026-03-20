/**
 * validate-all.mjs
 *
 * Local validation script — same checks as the CI workflow.
 * Run with:  npm run validate
 */

import Ajv from "ajv"
import addFormats from "ajv-formats"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..")

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)

const schemaPath = path.join(REPO_ROOT, "vendors", "_schema.json")
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"))
const validate = ajv.compile(schema)

const vendorsDir = path.join(REPO_ROOT, "vendors")
const logosDir = path.join(REPO_ROOT, "logos")
const allVendorEntries = fs.readdirSync(vendorsDir)
const files = allVendorEntries
  .filter((f) => f.endsWith(".json") && !f.startsWith("_")) // skip _schema.json, _example.json, etc.

let errors = 0
const LOGO_EXTENSIONS = ["png", "jpg", "webp"]

function findLogoMatches(slug) {
  return LOGO_EXTENSIONS
    .map((ext) => `${slug}.${ext}`)
    .filter((name) => fs.existsSync(path.join(logosDir, name)))
}

// Guardrail: reject unexpected non-JSON vendor files (e.g. missing .json extension)
for (const file of allVendorEntries) {
  if (file.startsWith("_")) continue
  if (!file.endsWith(".json")) {
    console.error(`❌ ${file} — Invalid vendor filename. Vendor files must end with .json`)
    errors++
    continue
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(file)) {
    console.error(`❌ ${file} — Invalid vendor filename. Use lowercase letters, numbers, and hyphens only`) // no spaces, underscores, uppercase, or extra dots
    errors++
  }
}

for (const file of files) {
  const filePath = path.join(vendorsDir, file)
  let data
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  } catch (err) {
    console.error(`❌ ${file} — Invalid JSON: ${err.message}`)
    errors++
    continue
  }

  const valid = validate(data)
  if (!valid) {
    console.error(`\n❌ ${file} — Schema errors:`)
    validate.errors.forEach((e) => console.error(`   ${e.instancePath} ${e.message}`))
    errors++
    continue
  }

  // Slug must match filename
  const expectedSlug = path.basename(file, ".json")
  if (data.slug !== expectedSlug) {
    console.error(`❌ ${file} — Slug '${data.slug}' does not match filename '${expectedSlug}'`)
    errors++
    continue
  }

  // Logo is inferred from slug: exactly one matching file must exist
  const logoMatches = findLogoMatches(data.slug)
  if (logoMatches.length === 0) {
    console.error(`❌ ${file} — Logo not found. Add one file in logos/: ${data.slug}.png, ${data.slug}.jpg, or ${data.slug}.webp`)
    errors++
    continue
  }

  if (logoMatches.length > 1) {
    console.error(`❌ ${file} — Multiple logo files found for slug '${data.slug}': ${logoMatches.join(", ")}`)
    errors++
    continue
  }

  const logoPath = path.join(logosDir, logoMatches[0])
  const size = fs.statSync(logoPath).size
  if (size > 204800) {
    console.error(`❌ ${file} — Logo exceeds 200 KB (${size} bytes)`)
    errors++
    continue
  }

  console.log(`✅ ${file}`)
}

console.log(`\n${errors === 0 ? "🎉 All valid!" : `❌ ${errors} error(s) found`}`)
if (errors > 0) process.exit(1)
