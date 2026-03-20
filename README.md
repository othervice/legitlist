# ⛏️ legitlist

### The community-verified list of trusted Bitaxe vendors.

Open-source hardware deserves open-source trust. **legitlist** is how the Bitaxe community tracks who's selling genuine hardware — transparently, on the record, and powered by the people who actually use it.

No backroom deals. No paid placements. Just miners vouching for miners.

---

## 🛒 For Vendors

Mining got centralized. Bitaxe helps bring it back to individuals — but only if buyers can trust who they’re buying from.

The legitlist is not a pay-to-play directory. It’s a public trust signal: community-reviewed, maintainer-approved.

Final inclusion is always at maintainer discretion and based on community trust, listing quality, and alignment with the Bitaxe open-source ecosystem.

**→ Read the [Vendor Guide](VENDOR_GUIDE.md) and open your PR.**

---

## 🔍 For the Community

See a vendor that shouldn't be listed? Something off?

**→ [Report a vendor](../../issues/new/choose)**

Every report is reviewed. Every removal is transparent.

---

## 🤝 How It Works

```
Vendor submits PR → Community reviews → Maintainers merge → Listed on site
```

That's it. No forms, no emails, no waiting in a queue. Fork the repo, add your files, open a PR. The conversation happens right there.

Only vendors marked as active should be displayed on the site.

---

## 📁 Vendor Files

Each vendor is two files:

| File | What |
|---|---|
| `vendors/{slug}.json` | Your shop info — name, website, region, socials (logo is inferred from `slug`) |
| `logos/{slug}.{ext}` | Your logo — square 400×400px recommended, max 200 KB (png, jpg, webp) |

For the easiest step-by-step path, follow the [Vendor Guide](VENDOR_GUIDE.md). `vendors/_example.json` is the raw template.

Supported social fields: `x`, `instagram`, `youtube`, `tiktok`, `nostr`.

---

## 🌍 Regions

Vendors are tagged by region so miners can find local sellers:

`Europe` · `North America` · `South America` · `Asia Pacific` · `Middle East` · `Africa` · `India`

---

## 💬 Questions?

Jump into the [OSMU Discord](https://discord.gg/osmu) — we're in the Bitaxe channels.

---

## ⚡ About Bitaxe

Bitaxe is open-source Bitcoin mining hardware designed for solo miners. Built by the community, for the community. Mining doesn't have to be industrial — one miner, one block, one chance.

**[bitaxe.org](https://bitaxe.org)** · **[GitHub](https://github.com/bitaxeorg)** · **[Discord](https://discord.gg/osmu)**

---

<sub>MIT License</sub>
