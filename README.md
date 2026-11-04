# Brewpub Costing

Recipe costing for the Your Mates brewpub kitchen. It holds the master ingredient list with each item's supplier and agreed price, menu, function and sub-recipe costing, every supplier quote line, and a price review queue. It exports to Excel.

It's a static page plus one small Netlify function. Data is stored in Netlify Blobs, so there's no database to set up.

## What's in this folder

| Path | What it is |
|---|---|
| `public/index.html` | The app |
| `public/seed.json` | Starting data: 173 ingredients, 42 recipes, 7 suppliers' quotes. Loaded once, on the first visit |
| `public/favicon.svg` | Tab icon |
| `netlify/functions/db.mjs` | The data API at `/api/db`, stored in Netlify Blobs |
| `netlify.toml` | Tells Netlify where the page and the function are |
| `package.json` | Pulls in `@netlify/blobs` for the function |

## Deploy

1. **GitHub:** create a new repository (for example `brewpub-costing`). Choose *uploading an existing file* and drag in everything in this folder, keeping the `public` and `netlify` folders as they are. Commit.
2. **Netlify:** go to *Add new site → Import an existing project → GitHub* and pick the repository. Leave the build settings as Netlify reads them from `netlify.toml` (publish directory `public`, no build command). Deploy.
3. **Passphrase (recommended):** go to *Site configuration → Environment variables* and add `COSTING_KEY` with a passphrase for the kitchen team. Then redeploy (*Deploys → Trigger deploy*). Everyone enters it once per device. Delete the variable to switch the lock off.
4. Open the site. The first visit loads `seed.json` into the store, and from then on the data lives in Netlify Blobs.

## Things to know

- **Pushing a new `seed.json` does not replace live data.** The seed is only read when the store is empty. Edits made on the site are never overwritten by a deploy.
- **Updating the app:** upload a new `public/index.html` to GitHub and Netlify redeploys. The data is untouched.
- **Several people at once:** each save writes one ingredient, recipe or supplier. Open pages check for other people's changes every 20 seconds and whenever the tab comes back into view.
- **Backups:** *Export to Excel* downloads the ingredient list, recipe costs, recipe lines and all quote lines.
- **The claude.ai version** keeps its own copy of the data. Once this site is live, use this one only, so the two don't drift apart.

## The manual

The **Manual** tab is a full tutorial with annotated screenshots of every screen. It's built into `public/index.html`, with the screenshots embedded, so there are no extra files to upload. It is updated with every feature change, and the *What's new* section at the end lists each release.

## How costs are worked out

Same as the spreadsheet: line cost = price per measure ÷ contents × portion quantity. House-made sauces (ranch, napoli, aiolis and so on) take their cost from their sub-recipe batch, so supplier price changes flow through to every dish. Food cost % defaults to the ex-GST sell price, and there's a switch on the Menu screen to use inc-GST instead.
