// Brewpub Costing data API, stored in Netlify Blobs.
//
//   GET    /api/db            -> every collection at once: { rev, ingredients, recipes, suppliers, meta }
//   GET    /api/db?since=REV  -> { rev, unchanged: true } when nothing has changed (cheap polling)
//   GET    /api/db/ping       -> { ok, needsKey }
//   PUT    /api/db/:collection/:id   (JSON body) -> saves one ingredient / recipe / supplier / setting
//   DELETE /api/db/:collection/:id
//
// Starting data comes in "packs" (see PACKS below). Each pack is imported once:
//   - on a brand-new store every pack is loaded;
//   - on a store already in use, a new pack only ADDS documents whose ids don't exist yet.
//     Nothing already saved on the site is ever overwritten or brought back after being deleted.
// Passphrase: set COSTING_KEY in Netlify (Site configuration -> Environment variables).
// Every request must then send it in the x-costing-key header. Delete the variable to switch it off.

import { getStore } from "@netlify/blobs";

const COLLECTIONS = ["ingredients", "recipes", "suppliers", "meta", "locations"];
const PACKS = [
  { id: "brewpub-initial", file: "/seed.json" },               // Brewpub, Warana (first release)
  { id: "crackerjack-initial", file: "/seed-crackerjack.json" }, // Crackerjack, Cooroy (added 13 Nov 2026)
];
const ID_RE = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const MAX_DOC_BYTES = 256 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const newRev = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function passphrase() {
  return (globalThis.Netlify?.env?.get?.("COSTING_KEY") ?? process.env.COSTING_KEY ?? "").trim();
}

async function readCollection(store, col) {
  return (await store.get("col/" + col, { type: "json" })) || {};
}

// Imports any pack this store hasn't had yet. Returns true if anything changed.
async function importPacks(store, reqUrl) {
  const fresh = !(await store.get("rev"));
  const done = (await store.get("packs", { type: "json" })) || [];
  // Stores created before packs existed already hold the brewpub data from seed.json
  if (!fresh && !done.length && (await store.get("seed-info"))) done.push("brewpub-initial");
  let changed = false;
  for (const pack of PACKS) {
    if (done.includes(pack.id)) continue;
    const res = await fetch(new URL(pack.file, reqUrl));
    if (!res.ok) throw new Error(pack.file + " not found (" + res.status + ")");
    const seed = await res.json();
    for (const col of COLLECTIONS) {
      const incoming = seed[col] || {};
      if (!Object.keys(incoming).length) continue;
      const docs = await readCollection(store, col);
      for (const [id, doc] of Object.entries(incoming)) if (!(id in docs)) docs[id] = doc;
      await store.setJSON("col/" + col, docs);
    }
    done.push(pack.id);
    changed = true;
  }
  if (changed || fresh) {
    await store.setJSON("packs", done);
    await store.setJSON("seed-info", { importedAt: new Date().toISOString(), packs: done });
    await store.set("rev", newRev());
  }
  return changed;
}

export default async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/db\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const key = passphrase();

  if (parts[0] === "ping") return json({ ok: true, needsKey: !!key });
  if (key && (req.headers.get("x-costing-key") || "").trim() !== key) return json({ error: "passphrase required" }, 401);

  const store = getStore({ name: "brewpub-costing", consistency: "strong" });

  if (req.method === "GET" && parts.length === 0) {
    await importPacks(store, req.url);
    const rev = await store.get("rev");
    if (url.searchParams.get("since") === rev) return json({ rev, unchanged: true });
    const out = { rev };
    for (const col of COLLECTIONS) out[col] = await readCollection(store, col);
    return json(out);
  }

  const [col, id] = parts;
  if (parts.length !== 2 || !COLLECTIONS.includes(col) || !ID_RE.test(id)) return json({ error: "bad path" }, 400);

  const docs = await readCollection(store, col);
  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > MAX_DOC_BYTES) return json({ error: "document too large" }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: "body must be JSON" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "body must be a JSON object" }, 400);
    docs[id] = { ...body, id };
  } else if (req.method === "DELETE") {
    delete docs[id];
  } else {
    return json({ error: "method not allowed" }, 405);
  }
  await store.setJSON("col/" + col, docs);
  const rev = newRev();
  await store.set("rev", rev);
  return json({ ok: true, rev });
};

export const config = { path: ["/api/db", "/api/db/*"] };
