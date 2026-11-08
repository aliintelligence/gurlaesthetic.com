# Gurl Aesthetic · gurlaesthetic.com

The online store for **Gurl Aesthetic**, an online nail supply shop in Trinidad & Tobago
(Instagram and TikTok: `@gurlaesthetic.tt`).

The whole site is plain HTML, CSS and JavaScript. There is no build step and no server:
GitHub Pages serves the files in this repository directly, and orders are sent as a
pre-filled WhatsApp message to the shop's number.

## Editing the store (no coding needed)

Everything that changes day to day lives in two files in the `data/` folder.
You can edit them straight on GitHub: open the file, click the pencil icon, change the
text, then click **Commit changes**. The live site updates about a minute later.

### `data/products.json` — the product list

Each product looks like this:

```json
{
  "id": "acryl-gel-01",
  "name": "Acryl Gel 01 · Clear",
  "category": "Acryl gel",
  "price": 70,
  "note": "Builder gel · 30 g",
  "tag": "New",
  "inStock": true,
  "image": "",
  "description": "Strong, flexible and perfect for beautiful extensions.",
  "details": "Cure 60 s LED or 120 s UV.",
  "look": { "bg": "#FDF0F5", "pack": "#1F1E1D", "ink": "#ffffff", "label": "Acryl gel 01" }
}
```

| Field | What it does |
| --- | --- |
| `id` | Unique, lowercase, dashes only. It becomes the product link (`product.html?id=acryl-gel-01`). Never reuse an id. |
| `name` | Shown everywhere. |
| `category` | Groups products in the shop filters and the menu. Use the same spelling each time. |
| `price` | A number in TT$. Use `null` if you want "Price on request". |
| `note` | Short line under the name (size, pack count). |
| `tag` | Small badge on the photo, e.g. `"New"`, `"Kit"`, `"Popular"`. Leave `""` for none. |
| `inStock` | `true` or `false`. Sold-out products stay listed but cannot be added to the bag. |
| `image` | Path to a photo, e.g. `"assets/img/products/acryl-gel-01.jpg"`. Leave `""` to show the drawn bottle. |
| `description` | Paragraph on the product page. |
| `details` | "How to use" text on the product page. Leave `""` to hide it. |
| `look` | Colours for the drawn bottle while there is no photo: `bg` (tile), `pack` (bottle), `ink` (text on bottle), `label`. |

Keep the commas between products and the square brackets at the start and end. If the
site shows "Could not load the shop data", a comma or quote is missing in this file.

### Adding product photos

1. Upload the photo to `assets/img/products/` (on GitHub: **Add file → Upload files**).
2. Put its path in that product's `image` field, e.g. `"assets/img/products/milk-pink.jpg"`.

Square photos look best. Keep each under about 500 KB so pages load fast on mobile data.

### `data/site.json` — shop settings

WhatsApp number, social links, the announcement bar text, the delivery and payment notes,
and the three customer reviews on the home page. The reviews are placeholders right now:
paste real ones from the Instagram **Reviews** highlight.

## How ordering works

1. The customer adds products to the bag (saved in their browser).
2. **Send order on WhatsApp** opens `wa.me/18683386517` with the order typed out:
   quantities, names, line totals, subtotal, the customer's name and delivery area.
3. You reply in WhatsApp to confirm delivery fee and payment, exactly like today.

To accept card payments later, a local gateway such as WiPay can be added to the
checkout without changing anything else.

## Hosting

- **GitHub Pages** serves the `main` branch. Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
- The `CNAME` file points the site at `gurlaesthetic.com`. At the domain registrar, add:
  - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `CNAME` record for `www` → `aliintelligence.github.io`
- In Settings → Pages, enter `gurlaesthetic.com` as the custom domain and tick **Enforce HTTPS** once the DNS check passes.

## Working on the code

Open the folder with any static server, for example:

```bash
npx serve .
```

(The pages fetch the JSON files, so opening `index.html` directly from the file system will not load products.)

- `index.html`, `shop.html`, `product.html` — the pages. Header, footer and cart drawer are rendered by the script.
- `assets/css/style.css` — brand styles. Colours are CSS variables at the top of the file.
- `assets/js/app.js` — loads the JSON, renders products, cart drawer, WhatsApp checkout.

Brand: blush `#FDF0F5`, soft pink `#F6A6C6`, deep pink `#C9437A`, ink `#141413`.
Fonts: Jost (body) and Playfair Display italic (accents), both from Google Fonts.
