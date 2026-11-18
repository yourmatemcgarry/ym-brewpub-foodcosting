# Brewpub Costing

Recipe costing for the Your Mates kitchens: the **Brewpub** (Warana) and **Crackerjack** (Cooroy). Each location has its own ingredients, recipes, suppliers and food cost target, picked with the switcher at the top.

For each location it holds the master ingredient list with each item's supplier and agreed price, menu, function and sub-recipe costing, every supplier quote line, and a price review queue. It exports to Excel.

It's a static page plus one small Netlify function. Data is stored in Netlify Blobs, so there's no database to set up.

## What's in this folder

| Path | What it is |
|---|---|
| `public/index.html` | The app |
| `public/seed.json` | Brewpub starting data: 173 ingredients, 42 recipes, 7 suppliers' quotes |
| `public/seed-crackerjack.json` | Crackerjack starting data: 191 ingredients, 59 recipes, 11 suppliers (prices from invoices, updated 22 Oct 2026) |
| `public/favicon.svg` | Tab icon |
| `netlify/functions/db.mjs` | The data API at `/api/db`, stored in Netlify Blobs |
| `netlify.toml` | Tells Netlify where the page and the function are |
| `package.json` | Pulls in `@netlify/blobs` for the function |

## Deploy

1. **GitHub:** create a new repository (for example `brewpub-costing`). Choose *uploading an existing file* and drag in everything in this folder, keeping the `public` and `netlify` folders as they are. Commit.
2. **Netlify:** go to *Add new site → Import an existing project → GitHub* and pick the repository. Leave the build settings as Netlify reads them from `netlify.toml` (publish directory `public`, no build command). Deploy.
3. **Passphrase (recommended):** go to *Site configuration → Environment variables* and add `COSTING_KEY` with a passphrase for the kitchen team. Then redeploy (*Deploys → Trigger deploy*). Everyone enters it once per device. Delete the variable to switch the lock off.
4. Open the site. The first visit loads the starting data into the store, and from then on the data lives in Netlify Blobs.

**Already deployed?** Upload this folder over the existing repository (it replaces `public/index.html` and `netlify/functions/db.mjs`, and adds `public/seed-crackerjack.json`). The first visit after Netlify redeploys adds Crackerjack. Brewpub data saved on the site stays as it is.

## Things to know

- **Starting data is loaded once per pack.** `db.mjs` lists the packs (`seed.json`, `seed-crackerjack.json`). A brand-new site loads them all. On a site already in use, a new pack only *adds* documents that aren't there yet, so edits made on the site are never overwritten and deleted items don't come back. Uploading a changed seed file later does nothing: to load more data, add a new pack.
- **Updating the app:** upload a new `public/index.html` to GitHub and Netlify redeploys. The data is untouched.
- **Several people at once:** each save writes one ingredient, recipe or supplier. Open pages check for other people's changes every 20 seconds and whenever the tab comes back into view.
- **Menu drafts** are saved with the rest of the data (in the `meta` collection, one document per draft, plus draft copies of dishes in `recipes`). Publishing a draft archives dishes that come off the menu; nothing is deleted.
- **Backups:** *Export to Excel* downloads the ingredient list, recipe costs, recipe lines and all quote lines.
- **The claude.ai version** keeps its own copy of the data. Once this site is live, use this one only, so the two don't drift apart.

## The manual

The **Manual** tab is a full tutorial with annotated screenshots of every screen. It's built into `public/index.html`, with the screenshots embedded, so there are no extra files to upload. It is updated with every feature change, and the *What's new* section at the end lists each release.

## How costs are worked out

Same as the spreadsheet: line cost = price per measure ÷ contents × portion quantity. House-made sauces (ranch, napoli, aiolis and so on) take their cost from their sub-recipe batch, so supplier price changes flow through to every dish. Food cost % defaults to the ex-GST sell price, and there's a switch on the Menu screen to use inc-GST instead.
