# How to Release a GitFast Update

Every time you want to push an update to users, follow these 3 steps.
That's it — GitHub Actions builds the .exe and electron-updater delivers it automatically.

---

## Step 1 — Bump the version in package.json

Open `package.json` and change the version number:

```json
{
  "version": "1.2.2"   ← change this
}
```

Use semantic versioning:
- Bug fix → bump patch:  1.2.1 → 1.2.2
- New feature → bump minor: 1.2.1 → 1.3.0
- Big rewrite → bump major: 1.2.1 → 2.0.0

---

## Step 2 — Commit and tag

```bash
git add package.json
git commit -m "chore: release v1.2.2"
git tag v1.2.2
git push origin main
git push origin v1.2.2
```

The `git push origin v1.2.2` is what triggers the GitHub Actions build.

---

## Step 3 — Wait ~5 minutes

GitHub Actions will:
1. Spin up a Windows runner
2. Run `npm ci` to install dependencies
3. Run `npm run dist` to build the .exe
4. Create a GitHub Release automatically
5. Upload `GitFast-Setup-1.2.2.exe` + `latest.yml` to the release

Once published, every installed copy of GitFast will detect the update
on next launch (or within 15 minutes) and show the banner:

  "GitFast v1.2.2 is downloading in the background…"
  then
  "✅ GitFast v1.2.2 is ready — Restart & Install"

---

## One-time setup (do this once)

### 1. Make sure your GitHub repo is public OR you have a paid plan
electron-updater downloads from GitHub Releases. Public repos work with
no extra config. Private repos need a GitHub token in the updater config.

### 2. Check package.json has the right repo info
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "ndengafranck",    ← your GitHub username
    "repo": "gitfast"           ← your repo name
  }
}
```
These are already set correctly in your package.json.

### 3. No secrets needed
The workflow uses `${{ secrets.GITHUB_TOKEN }}` which GitHub provides
automatically — you don't need to create any secrets.

---

## What gets published to GitHub Releases

electron-builder uploads these files automatically:
- `GitFast-Setup-1.2.2.exe`  ← the installer users download
- `GitFast-Setup-1.2.2.exe.blockmap`  ← enables differential updates (faster)
- `latest.yml`  ← the file electron-updater checks to know the latest version

The `latest.yml` looks like this:
```yaml
version: 1.2.2
files:
  - url: GitFast-Setup-1.2.2.exe
    sha512: abc123...
    size: 75000000
path: GitFast-Setup-1.2.2.exe
sha512: abc123...
releaseDate: '2026-04-23T14:00:00.000Z'
```

electron-updater in the installed app fetches this file on startup,
compares the version to the running version, and if newer — downloads
and prompts the user to restart.

---

## Troubleshooting

### Build fails with "NSIS not found"
electron-builder on Windows includes NSIS. Make sure you're using
`runs-on: windows-latest` in the workflow (already set).

### "Resource not accessible by integration" error
Go to your GitHub repo → Settings → Actions → General →
Set "Workflow permissions" to "Read and write permissions". Save.

### Users not getting the update
- Check the GitHub Release was created and has `latest.yml` uploaded
- The updater checks on startup — user needs to restart the app
- Make sure the version in package.json was actually bumped

### Want to test the update flow locally?
You can't fully test auto-update in dev mode (it's disabled on purpose).
Build a test .exe with a lower version, install it, then publish a
release with a higher version and watch the banner appear.

---

## Quick reference — full release in 4 commands

```bash
# Edit package.json version first, then:
git add package.json
git commit -m "chore: release v1.X.X"
git tag v1.X.X
git push origin main && git push origin v1.X.X
```
