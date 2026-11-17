# Composing CG layers — reference

Use this document to write the content of a **CG layer**: an HTML fragment that playout software (CasparCG, OBS browser source…) displays as an overlay. Everything needed to produce a correct layer on the first try is here.

## 1. What a layer is

- A layer is an **HTML fragment**: no `<html>`, `<head>` or `<body>`. It may contain `<style>` and `<script>` tags.
- It is served publicly, with no authentication:
  - `/cg/layer/<slug>`: this layer alone, whether enabled or not;
  - `/cg/all`: every **enabled** layer, stacked in the same page.
- In `/cg/all`, layers stack in **alphabetical order of their name**: the last one is on top. To control the order, prefix the names (`10 Background`, `20 Lower third`, `90 Logo`).
- Saving a layer automatically reloads the open `/cg/…` pages.

### The surrounding page

The server wraps each layer like this:

```html
<body>                                       <!-- transparent background, overflow hidden, 100% × 100% -->
  <div class="cg-layer" data-layer="<slug>"> <!-- position:absolute; inset:0; overflow:hidden -->
    … layer content …
  </div>
</body>
```

What this means:

- **The background is transparent.** Never fill the whole surface, unless a full-screen graphic is intended.
- **The surface covers the whole output** (1920 × 1080 by default). Position elements `absolute` relative to the layer, with **px** values. The editor preview renders the page at its real resolution and then scales it down, so px values map exactly to the output.
- Anything that overflows the surface is clipped.

### Playout constraints

- **Offline.** Playout machines often have no internet access. No CDN, no Google Fonts, no external images: everything goes through assets (§4).
- **No interaction.** Nobody clicks: no buttons, no `alert`.
- **Shared page.** In `/cg/all`, every layer lives in the same document. `id`s, custom CSS classes and global JS variables can collide. Prefix `id`s and classes with the slug, and scope CSS with `[data-layer="<slug>"]`.
- **Sandboxed preview.** The editor preview is a sandboxed iframe without same origin. `localStorage`, `document.cookie` and access to the parent page throw there: layer scripts must not depend on them.

## 2. Tailwind CSS

Tailwind v4 is compiled **in the browser** from the classes present in the page. Every utility is available, including:

- arbitrary values: `top-[870px]`, `w-[640px]`, `bg-[#0b1f3a]`, `text-[42px]`, `tracking-[0.08em]`;
- transition and animation utilities: `transition-all duration-500 ease-out`;
- attribute variants: `data-show:opacity-100` (see `ctx-show`, §5).

For CSS that utilities don't express well (keyframes, complex selectors), use a `<style>` in the layer, scoped to it:

```html
<style>
  @keyframes acme-slide-in { from { transform: translateX(-110%) } to { transform: none } }
  [data-layer="lower-third"] .acme-box[data-show] { animation: acme-slide-in .6s cubic-bezier(.2,.8,.2,1) both }
</style>
```

## 3. CSS variables and global stylesheet

They are defined in the admin (*Graphics → Custom CSS*) and injected into **every** CG page and into the preview. Never redeclare them in a layer.

| Variable kind | Admin name | CSS property      | Usage                                                                                |
| ------------- | ---------- | ----------------- | ------------------------------------------------------------------------------------ |
| color         | `primary`  | `--color-primary` | `var(--color-primary)`, or Tailwind `bg-primary`, `text-primary`, `border-primary`… |
| value         | `font`     | `--font`          | `var(--font)`, or Tailwind `font-(family-name:--font)`, `p-(--gap)`…                 |

- **Prefer variables over hard-coded values** for brand colors, fonts and spacing. The layer then follows the brand when it changes.
- If the available variables are unknown, ask for the list. Otherwise write explicit values and say so.
- The **global stylesheet** (same admin page) is loaded before the variables and the layer content. It is the place for `@font-face` rules and classes shared by several layers.

## 4. Assets (images, fonts, videos…)

Files uploaded in *Graphics → Assets* are served at:

```
/cg/files/<name>
```

- The name is lowercase, slugified, and keeps its extension (`channel-logo.png`, `inter-bold.woff2`).
- Replacing a file **keeps its URL**, and CG pages reload.
- Always write an absolute path starting with `/cg/files/`: it works both on output and in the preview.
- Accepted extensions:
  - images: png, jpg/jpeg, gif, webp, avif, svg;
  - fonts: woff, woff2, ttf, otf;
  - video: mp4, webm, mov;
  - audio: mp3, wav, ogg;
  - data: json.
- Video: no Range requests. Prefer short loops (`autoplay muted loop playsinline`) over seeking to a given position.
- A `.json` file can be read by a script: `await (await fetch('/cg/files/config.json')).json()`.

Font:

```css
@font-face {
  font-family: 'Inter';
  src: url('/cg/files/inter-bold.woff2') format('woff2');
  font-weight: 700;
}
```

Image: `<img src="/cg/files/channel-logo.svg" class="absolute top-[48px] right-[64px] h-[72px]" alt="">`

## 5. Live data: `ctx-*` attributes

Layers display data from the **context**, a JSON tree held by the context engine (titles, guest names, scores, lists…). `ctx-*` attributes bind the HTML to that tree. Every context change is pushed to the page in real time. There is nothing to load: the runtime is already included.

### Reference

| Attribute            | Effect                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ctx-source="a.b"`   | Subscribes to the context path `a.b`. The element and its descendants read from that value. `ctx-source=""` gives the whole context.         |
| `ctx-value="x.y"`    | **Replaces the element's text** with the value (`textContent`). An object is shown as JSON; `null` or a missing value gives an empty string. |
| `ctx-show="x.y"`     | Sets the `data-show` attribute while the value is *truthy*, removes it otherwise. **Hides nothing by itself**: it must be styled (see below). |
| `ctx-each="x.y"`     | Repeats the element for every item of the array. The current item is named `$`.                                                             |
| `ctx-each-name="n"`  | Also gives the item the alias `$n`, so a nested `ctx-each` can reach it.                                                                     |
| `ctx-each-max="5"`   | Only shows 5 items at a time.                                                                                                                |
| `ctx-each-loop="8"`  | With `ctx-each-max`, moves to the next slice every 8 s, looping.                                                                             |

### Path resolution rules

- Paths are dotted, and array indexes are plain segments: `match.teams.0.name`.
- Under a `ctx-source`, a path is **relative to the source value**. A nested `ctx-each` doesn't change that root: only paths starting with `$` or `$<name>` start from the item.
- A `ctx-source` value is always an **absolute path** in the context, even when the source is nested in another one. A nested source isolates its subtree: its descendants only see its value.
- A `ctx-*` element outside any `ctx-source` is never rendered.

### Pitfalls

- **`ctx-value` overwrites the element's content**, children included. Put `ctx-value` on a leaf `<span>`, not on a container.
- **No attribute binding.** `src`, `href`, `class` or `style` can't be bound to a value. To vary a visual depending on the data:
  - **Values known in advance**: one element per case, each with a `ctx-show` on a boolean or a distinct field. Example: `ctx-show="home.isWinner"`.
  - **Free values**, such as an image name: a `<span hidden ctx-value="…">` read by a small script (`MutationObserver`). See example 5.
- **Plain text only.** `ctx-value` doesn't interpret HTML.
- **Template text shows before the data arrives.** Leave `ctx-value` elements empty in the HTML, or keep the block hidden until `ctx-show` resolves.
- **Animations.** Unchanged text isn't rewritten, so its animation doesn't restart. `ctx-each` copies are reused by position, and so are their animations.
- **Execution order.** The runtime is a module: it runs after parsing, so after the layer's classic `<script>` tags. A `ctx-each` element is removed from the DOM and replaced by its copies. A script that hooks into a repeated element must therefore do so after rendering, or observe the DOM.

### Showing and hiding

`ctx-show` only sets `data-show`. Describe the default (hidden) state and the visible state in CSS, which allows transitions:

```html
<div ctx-show="visible"
     class="opacity-0 translate-y-[40px] transition-all duration-500 ease-out
            data-show:opacity-100 data-show:translate-y-0">
```

### Debugging

- Add `?ctx-debug` to the page URL, or run `ctxDebug = true` in the console (also works in the preview).
- The console then logs subscriptions, updates, missing paths and values that should have been arrays.
- `ctxSources` lists the bound sources and their last value.

## 6. Examples

The context paths below are **illustrative**. They depend on what is actually defined in the context engine. Ask for the structure if it is unknown.

### 1 — Name / title strap (lower third)

Context: `{ "lowerThird": { "visible": true, "name": "Marie Durand", "title": "Technical director" } }`

```html
<div ctx-source="lowerThird">
  <div ctx-show="visible"
       class="absolute left-[120px] bottom-[110px] flex flex-col
              opacity-0 -translate-x-[60px] transition-all duration-500 ease-out
              data-show:opacity-100 data-show:translate-x-0">
    <span ctx-value="name"
          class="bg-primary px-[28px] py-[10px] text-[46px] font-bold leading-none text-white"></span>
    <span ctx-value="title"
          class="self-start bg-white px-[28px] py-[8px] text-[28px] leading-none text-primary"></span>
  </div>
</div>
```

### 2 — Paginated looping list

Context: `{ "agenda": { "items": [ { "time": "14:00", "label": "Opening" }, … ] } }`

```html
<ul ctx-source="agenda" class="absolute right-[80px] top-[160px] w-[620px] space-y-[12px]">
  <li ctx-each="items" ctx-each-max="5" ctx-each-loop="8"
      class="flex gap-[24px] bg-black/70 px-[24px] py-[14px] text-[30px] text-white">
    <span ctx-value="$.time" class="w-[110px] font-bold text-primary"></span>
    <span ctx-value="$.label"></span>
  </li>
</ul>
```

### 3 — Nested arrays

Context: `{ "results": { "groups": [ { "name": "Group A", "teams": [ { "name": "…", "pts": 6 } ] } ] } }`

```html
<div ctx-source="results" class="absolute inset-x-[160px] top-[140px] grid grid-cols-2 gap-[40px]">
  <section ctx-each="groups" ctx-each-name="group" class="bg-black/75 p-[24px] text-white">
    <h2 ctx-value="$group.name" class="mb-[12px] text-[34px] font-bold"></h2>
    <div ctx-each="$group.teams" class="flex justify-between text-[28px]">
      <span ctx-value="$.name"></span><span ctx-value="$.pts"></span>
    </div>
  </section>
</div>
```

### 4 — Score with states

Context: `{ "match": { "home": { "name": "…", "score": 2, "serving": true }, "away": { … } } }`

```html
<div ctx-source="match" class="absolute left-[80px] top-[60px] flex text-[34px] font-bold text-white">
  <div class="flex items-center gap-[16px] bg-primary px-[20px] py-[8px]">
    <span ctx-show="home.serving" class="size-[12px] rounded-full bg-yellow-300 opacity-0 data-show:opacity-100"></span>
    <span ctx-value="home.name"></span><span ctx-value="home.score" class="tabular-nums"></span>
  </div>
  <div class="flex items-center gap-[16px] bg-black/80 px-[20px] py-[8px]">
    <span ctx-value="away.score" class="tabular-nums"></span><span ctx-value="away.name"></span>
    <span ctx-show="away.serving" class="size-[12px] rounded-full bg-yellow-300 opacity-0 data-show:opacity-100"></span>
  </div>
</div>
```

### 5 — Image picked from the data (attribute binding workaround)

Context: `{ "guest": { "photo": "marie-durand.jpg" } }`. The file `marie-durand.jpg` is an asset.

```html
<div ctx-source="guest">
  <span hidden ctx-value="photo" id="guest-photo-src"></span>
  <img id="guest-photo" alt="" class="absolute left-[120px] bottom-[220px] size-[180px] rounded-full object-cover">
</div>
<script>
  (() => {
    const source = document.getElementById('guest-photo-src')
    const img = document.getElementById('guest-photo')
    const sync = () => {
      const name = source.textContent.trim()
      img.hidden = !name
      if (name) img.src = `/cg/files/${encodeURIComponent(name)}`
    }
    new MutationObserver(sync).observe(source, { childList: true, characterData: true, subtree: true })
    sync()
  })()
</script>
```

### 6 — Clock (script only, no context)

```html
<div id="clock-time" class="absolute right-[64px] top-[48px] text-[40px] font-bold tabular-nums text-white"></div>
<script>
  (() => {
    const el = document.getElementById('clock-time')
    const tick = () => (el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    tick()
    setInterval(tick, 1000)
  })()
</script>
```

## 7. Checklist before delivering a layer

- [ ] HTML fragment only, no `<html>`, `<head>` or `<body>`; transparent background.
- [ ] `absolute` positioning in px, designed for the output resolution (1920 × 1080 by default); safe areas respected (≈ 5% from the edges).
- [ ] No external resources: images and fonts via `/cg/files/<name>`.
- [ ] Brand colors and fonts via variables (`bg-primary`, `var(--font)`…).
- [ ] `id`s, custom classes and `<style>` rules prefixed or scoped by the slug; scripts wrapped in an IIFE.
- [ ] `ctx-value` only on leaf elements, left empty in the template.
- [ ] Every `ctx-show` has a hidden default state and a visible `data-show:` state.
- [ ] `ctx-*` paths relative to the source; `$` or `$<name>` for `ctx-each` items.
- [ ] Legible on air: text ≥ 24 px, enough contrast, `tabular-nums` for changing numbers.
