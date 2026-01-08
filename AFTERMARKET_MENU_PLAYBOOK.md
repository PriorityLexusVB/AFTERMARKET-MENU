# AFTERMARKET-MENU — Playbook (Priority Lexus VB)

**Repo:** `PriorityLexusVB/AFTERMARKET-MENU`  
**Primary deployment:** Cloud Run (Cloud Build trigger)  
**Primary device target:** iPad **landscape** (Safari “Add to Home Screen” / PWA standalone)  
**Purpose:** Customer-facing protection menu + admin console to curate packages & add-ons.

---

## 0) One sentence truth
**Admin drag/drop defines what customers see.**  
Packages come from `features` columns 1–3, Popular Add-Ons come from `ala_carte_options` column 4.

---

## 1) Data model: what drives what

### 1.1 Packages (Elite / Platinum / Gold)
**Collection:** `features`  
**Mapping (strict):**
- **Elite** = `features.column === 2`
- **Platinum** = `features.column === 3`
- **Gold** = `features.column === 1`

**Ordering:** `position` ascending (0-based)  
**Connector:** `connector` is the connector to the **NEXT** item below.  
- The last item’s connector is irrelevant (hide it).

### 1.2 Popular Add-Ons (right-most customer column)
**Collection:** `ala_carte_options`  
**Filter:**
- `isPublished === true`
- `column === 4`  (Featured / Popular Add-Ons)
**Ordering:** `position` ascending

**Important:** Popular Add-Ons are **NOT** driven by `features.column === 4`.  
They are purely `ala_carte_options` featured placement.

---

## 2) Admin UI responsibilities (3 tabs)

### 2.1 Package Features tab (BOARD ONLY)
**Job:** ordering + AND/OR for packages.
- DnD reorder & move between columns 2/3/1
- AND/OR toggle for next-item connector

**Not allowed here:** editing product fields.  
Everything that edits a product should deep-link to Product Hub.

### 2.2 A La Carte Options tab (BOARD ONLY)
**Job:** ordering for A La Carte visibility.
- Featured lane (Column 4) for Popular Add-Ons
- Optional “Published (not featured)” lane
- “Hidden items” panel to explain why totals don’t match:
  - Unpublished
  - Missing required fields (name/price)
  - Invalid price (<= 0)

**Rule:** If header shows `Visible X / Total Y`, and X != Y, the UI must show:
- A “Hidden items” section listing each hidden doc + reasons.

### 2.3 Product Hub tab (THE ONLY EDITOR)
**Job:** edit everything in one place. This is the “single hub promise.”
Per product (feature) you can:
- Choose package lane (2/3/1 or Not in Packages)
- Set connector (AND/OR) if in a lane
- Publish/unpublish to A La Carte
- Set A La Carte price (required to publish)
- Set NEW flag
- Set Featured (Popular Add-Ons) (Column 4)
- Set category (columns 1–3 if used)
- Set A La Carte position
- Duplicate to other package lanes (creates a new `features` doc)

**UX goal:** rows collapsed by default (chips summary), expand reveals controls.

---

## 3) Firestore fields (expected behavior)

### 3.1 `features` (source of packages)
Common fields:
- `name`, `description`
- `column?: 1|2|3`
- `position?: number`
- `connector?: "AND"|"OR"`
- `publishToAlaCarte?: boolean`
- `alaCartePrice?: number`
- `alaCarteWarranty?: string`
- `alaCarteIsNew?: boolean`
- Media: `imageUrl?`, `thumbnailUrl?`, `videoUrl?`
- (Any optional field must never be written as `undefined`)

### 3.2 `ala_carte_options` (source of A La Carte + Popular Add-Ons)
Doc id should be stable: **same as feature.id**
Fields:
- `name`, `description`, `price`, `cost`
- `isPublished: boolean`
- placement:
  - `column?: number` (4 = Featured)
  - `position?: number`
  - `connector?: "AND"|"OR"` (if used)
- media: `imageUrl?`, `thumbnailUrl?`, `videoUrl?`
- `sourceFeatureId?: string`

**Hard rule:** Firestore rejects `undefined`.  
Any payload must sanitize optional fields:
- omit the key, or
- replace with `deleteField()` sentinel for clearing.

---

## 4) Publish/unpublish: correctness rules

### 4.1 Publish (feature → ala_carte_options)
Publishing requires:
- price exists and > 0
- payload is sanitized (no undefined)
- upsert with stable id:
  `setDoc(doc(db,'ala_carte_options',feature.id), cleaned, { merge:true })`

### 4.2 Unpublish (do not delete doc)
Unpublish must:
- set `isPublished: false`
- clear placement so UI doesn’t show “Featured while unpublished”:
  - `column: deleteField()`
  - `position: deleteField()`
  - `connector: deleteField()` (if used)

---

## 5) Troubleshooting: “Popular Add-Ons full customer side, blank admin side”
This is almost always a **source mismatch**:
- Customer uses: `ala_carte_options (published, column 4)`
- Admin board might mistakenly show `features.column === 4`

Fix:
- Package Features tab should not imply it controls Popular Add-Ons via column 4.
- A La Carte tab is the only ordering surface for Popular Add-Ons.

---

## 6) iPad landscape: one-screen UX requirements

### 6.1 Goal
On iPad landscape:
- the page itself never scrolls
- 4 columns visible: Elite | Platinum | Gold | Popular Add-Ons
- right-side summary is replaced by fixed **bottom bar**
- tap targets >= 44px

### 6.2 Reliable iOS Safari viewport strategy
Use CSS vars updated by JS:
- JS sets `--app-vh: ${window.innerHeight}px`
- CSS uses `--app-height` = 100dvh when supported else var(--app-vh)

Lock scroll:
- `html, body, #root { height: var(--app-height); overflow: hidden; overscroll-behavior: none; }`

Grid:
- `grid-template-columns: repeat(4, minmax(0, 1fr))`
- menu height = `calc(var(--app-height) - header - bottomBar)`

Clamp text to prevent internal scroll.

### 6.3 A La Carte iPad UX
Prefer big “+ ADD” buttons.
If the A La Carte list needs to scroll, allow scroll inside the list panel only (not the whole page).

---

## 7) PWA / “no search bar” install

To remove browser chrome on iPad:
1) Open in Safari
2) Share → Add to Home Screen
3) Launch from icon

Required:
- `public/manifest.webmanifest`
- icons in `public/icons/*`
- iOS meta tags + manifest link in `index.html`
- server headers:
  - manifest served as `application/manifest+json`
  - icons long cached (`immutable`)

---

## 8) Verification checklist

### Cloud Shell smoke checks
```bash
URL="https://priority-lexus-aftermarket-menu-351793974523.us-west1.run.app"
curl -sI "$URL/manifest.webmanifest" | egrep -i "content-type|cache-control|ratelimit" || true
curl -sI "$URL/icons/icon-192.png" | egrep -i "cache-control|content-type" || true
curl -s -o /dev/null -w "%{http_code}\n" "$URL/icons/does-not-exist.png"
