/**
 * sync-to-framer.mjs
 *
 * Reads all active vendor JSON files from ./vendors/ and syncs them
 * to the Framer CMS Managed Collection via the Framer Server API.
 *
 * Required environment variables:
 *   FRAMER_PROJECT_URL  — found in Framer > Project Settings > API
 *   FRAMER_API_KEY      — generated in Framer > Project Settings > API
 *
 * Run manually:  node scripts/sync-to-framer.mjs
 * Run in CI:     triggered by .github/workflows/sync-vendors.yml
 */

import { connect } from "framer-api"
import fs from "node:fs"
import path from "node:path"

// ─── Config ──────────────────────────────────────────────────────────────────

const LOGO_BASE =
  "https://cdn.jsdelivr.net/gh/bitaxeorg/legitlist@main/"

const COLLECTION_NAME = "Vendors"

// CMS field schema — edit with care; removing fields will lose CMS data
const FIELDS = [
  { id: "vendorName",   type: "string", name: "Vendor Name" },
  { id: "website",      type: "link",   name: "Website" },
  { id: "region",       type: "string", name: "Region" },
  { id: "country",      type: "string", name: "Country" },
  { id: "logoUrl",      type: "image",  name: "Logo" },
  { id: "description",  type: "string", name: "Description" },
  { id: "socialX",      type: "link",   name: "X / Twitter" },
  { id: "socialIg",     type: "link",   name: "Instagram" },
  { id: "socialYt",     type: "link",   name: "YouTube" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadVendors() {
  const vendorsDir = path.resolve("./vendors")
  const files = fs
    .readdirSync(vendorsDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_")) // skip _schema.json, _example.json, etc.

  const vendors = files
    .map((f) => {
      const raw = fs.readFileSync(path.join(vendorsDir, f), "utf-8")
      return JSON.parse(raw)
    })
    .filter((v) => v.active === true)

  console.log(`📦 Loaded ${vendors.length} active vendor(s) from ${files.length} total file(s)`)
  return vendors
}

function vendorToItem(v) {
  return {
    id: v.slug,
    slug: v.slug,
    fieldData: {
      vendorName:  v.name,
      website:     v.website,
      region:      v.region,
      country:     v.country,
      logoUrl:     `${LOGO_BASE}${v.logo}`,
      description: v.description ?? "",
      socialX:     v.social?.x         ?? "",
      socialIg:    v.social?.instagram  ?? "",
      socialYt:    v.social?.youtube    ?? "",
    },
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { FRAMER_PROJECT_URL, FRAMER_API_KEY } = process.env

  if (!FRAMER_PROJECT_URL || !FRAMER_API_KEY) {
    console.error("❌  Missing FRAMER_PROJECT_URL or FRAMER_API_KEY env vars")
    process.exit(1)
  }

  console.log("🔌 Connecting to Framer…")
  const framer = await connect(FRAMER_PROJECT_URL, FRAMER_API_KEY)

  try {
    // ── Get or create the Managed Collection ──────────────────────────────
    let collection
    try {
      collection = await framer.getManagedCollection()
      console.log(`✅ Found existing collection: "${COLLECTION_NAME}"`)
    } catch {
      try {
        console.log(`🆕 Collection not found — creating "${COLLECTION_NAME}"…`)
        collection = await framer.createManagedCollection(COLLECTION_NAME)
      } catch (createErr) {
        if (createErr.message?.includes("already exists")) {
          // Collection was created by a previous run but getManagedCollection()
          // lost the association — re-fetch it
          console.log(`✅ Collection already exists — re-fetching…`)
          collection = await framer.getManagedCollection()
        } else {
          throw createErr
        }
      }
    }

    // ── Sync field schema ──────────────────────────────────────────────────
    console.log("🔧 Syncing field schema…")
    await collection.setFields(FIELDS)

    // ── Diff: figure out what to add / remove ─────────────────────────────
    const vendors    = loadVendors()
    const newSlugs   = new Set(vendors.map((v) => v.slug))
    const existingIds = await collection.getItemIds()
    const toRemove   = existingIds.filter((id) => !newSlugs.has(id))

    if (toRemove.length > 0) {
      console.log(`🗑  Removing ${toRemove.length} stale item(s): ${toRemove.join(", ")}`)
      await collection.removeItems(toRemove)
    } else {
      console.log("✔  No stale items to remove")
    }

    // ── Upsert active vendors ─────────────────────────────────────────────
    const items = vendors.map(vendorToItem)
    console.log(`📤 Upserting ${items.length} vendor(s)…`)
    await collection.addItems(items) // addItems performs an upsert by id

    // ── Publish & deploy ──────────────────────────────────────────────────
    console.log("🚀 Publishing & deploying…")
    await framer.publish()
    await framer.deploy()

    console.log("🎉 Sync complete!")
  } finally {
    // Always disconnect — without this the script hangs indefinitely
    await framer.disconnect()
  }
}

main().catch((err) => {
  console.error("❌ Sync failed:", err)
  process.exit(1)
})
