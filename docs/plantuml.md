# PlantUML C4 Diagrams — Setup Guide
## Works in: Google Antigravity preview · GitHub · anyone who clones

---

## 1. Your repo structure

```
your-project/
├── docs/
│   └── diagrams/
│       ├── invsys-container.puml   ← source of truth (edit this)
│       └── invsys-container.svg    ← committed render (never edit manually)
├── .github/
│   └── workflows/
│       └── render-diagrams.yml     ← auto-renders on push
└── README.md                       ← embeds the SVG
```

---

## 2. The `.puml` source file

Save as `docs/diagrams/invsys-container.puml`:

```plantuml
@startuml invsys-container
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_TOP_DOWN()
LAYOUT_WITH_LEGEND()

title Container Architecture -- Invsys Platform (2026-05-05)

Person(admin, "Admin", "Gestiona productos y ajusta inventario")
Person(user,  "User",  "Consulta catalogo (rol no sembrado)")
System_Ext(fx_api, "exchangerate-api.com", "API externa de tasas FX")

System_Boundary(invsys, "Invsys Platform [system]") {

  Container(grafana,    "Grafana",    "Dashboard: 3000",      "Visualizacion")
  Container(prometheus, "Prometheus", "TSDB: 9090",           "Scrape de /metrics")

  Container(auth,      "Auth Service",      "NestJS/TypeScript: 3001", "Login, JWT issue/refresh, disable user, bcrypt")
  Container(inventory, "Inventory Service", "Go/Gin/GORM: 8080",       "add/deduct/query stock * SIN auth aplicada *")
  Container(product,   "Product Service",   "NestJS/TypeScript: 3002", "CRUD productos, conversion de moneda, historial de precios, JwtAuthGuard")

  ContainerDb(postgres, "PostgreSQL 15", "RDBMS: 5432", "3 DBs: auth_db, products_db, inventory_db")
  ContainerQueue(kafka, "Apache Kafka",  "KRaft: 9092", "Topics: product.created / updated / deleted")
  ContainerDb(redis,    "Redis 7",       "Cache: 6379", "TTL 3600s para tasas FX")
}

' ── Layout hints (Graphviz honors these; Mermaid does not) ────────────────
Lay_R(admin, user)
Lay_D(admin, auth)
Lay_R(auth, inventory)
Lay_R(inventory, product)
Lay_D(auth, postgres)
Lay_R(postgres, kafka)
Lay_R(kafka, redis)
Lay_L(grafana, prometheus)
Lay_D(grafana, auth)

' ── Relationships ─────────────────────────────────────────────────────────
Rel(admin, auth,      "POST /auth/login",              "HTTPS/JSON")
Rel(admin, inventory, "add/deduct stock sin token",    "HTTPS/JSON")
Rel(admin, product,   "CRUD productos Bearer JWT",     "HTTPS/JSON")
Rel(user,  product,   "GET /products Bearer JWT",      "HTTPS/JSON")

Rel_U(prometheus, auth,      "scrape /metrics", "HTTP")
Rel_U(prometheus, inventory, "scrape /metrics", "HTTP")
Rel_U(prometheus, product,   "scrape /metrics", "HTTP")
Rel(grafana, prometheus,     "PromQL queries",  "HTTP")

Rel_D(auth,      postgres, "lee/escribe usuarios",             "TCP/SQL")
Rel_D(inventory, postgres, "lee/escribe stock",                "TCP/SQL")
Rel_D(product,   postgres, "lee/escribe productos+price_hist", "TCP/SQL")

Rel_D(product,   kafka,    "publica product.{created,updated,deleted}", "TCP")
Rel(kafka,    inventory,   "consume product.created",                   "TCP")
Rel(product,  redis,       "cache de tasas FX",                         "TCP")
Rel(product,  fx_api,      "GET /v6/latest/USD",                        "HTTPS")

@enduml
```

---

## 3. Render locally (first time + after edits)

### Option A — Command line (recommended)

```bash
# Install once (macOS)
brew install plantuml

# Install once (Ubuntu/Debian)
sudo apt install plantuml graphviz

# Render to SVG
plantuml -tsvg docs/diagrams/invsys-container.puml

# Commit both files
git add docs/diagrams/invsys-container.puml docs/diagrams/invsys-container.svg
git commit -m "docs: update container architecture diagram"
git push
```

### Option B — Antigravity extension (live preview while editing)

1. Open Antigravity → Extensions (`Ctrl+Shift+X`)
2. Search **"PlantUML"** → install **jebbs.plantuml**
3. Open `invsys-container.puml`
4. Press `Alt+D` → live preview panel opens beside your file
5. Every save re-renders instantly

> The extension calls the public PlantUML server by default.
> For offline use, add to your `settings.json`:
> ```json
> "plantuml.server": "https://www.plantuml.com/plantuml",
> "plantuml.render": "PlantUMLServer"
> ```

---

## 4. Embed in `README.md`

```markdown
## Architecture

<div style="background:#ffffff; padding:16px; display:inline-block; border-radius:4px;">

![Container Architecture — Invsys Platform](./docs/diagrams/invsys-container.svg)

</div>
```

**Why this works everywhere:**

| Viewer | How it renders |
|---|---|
| GitHub (web) | Renders SVG inline — no plugin needed |
| Google Antigravity preview | `div` wrapper ensures white background |
| `git clone` + any editor | SVG file is already committed, renders as image |
| Dark theme users | White `div` background prevents theme bleed-through |

---

## 5. GitHub Actions — auto-render on every push

Create `.github/workflows/render-diagrams.yml`:

```yaml
name: Render PlantUML diagrams

on:
  push:
    paths:
      - 'docs/diagrams/**.puml'

jobs:
  render:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install PlantUML + Graphviz
        run: sudo apt-get install -y plantuml graphviz

      - name: Render all .puml files to SVG
        run: |
          find docs/diagrams -name "*.puml" | while read f; do
            plantuml -tsvg "$f"
            echo "Rendered: $f"
          done

      - name: Commit rendered SVGs
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "docs: auto-render PlantUML diagrams [skip ci]"
          file_pattern: "docs/diagrams/*.svg"
```

**What this does:** any time you push a change to a `.puml` file, GitHub
renders it to SVG and commits the result automatically. Your README always
shows the current diagram without you having to render locally.

---

## 6. UX for people who clone your project

They get a great experience with zero setup:

- `README.md` shows the diagram as a plain image (SVG is committed)
- The `.puml` source is there if they want to edit it
- Add this note to your README so they know the workflow:

```markdown
> **Editing diagrams:** Source files are in `docs/diagrams/*.puml`.
> Edit the `.puml` file, then run `plantuml -tsvg docs/diagrams/<file>.puml`
> to regenerate the SVG, or just push — GitHub Actions will render it automatically.
```

---

## 7. Why PlantUML C4 instead of Mermaid C4

| Feature | Mermaid C4 | C4-PlantUML |
|---|---|---|
| `Lay_U/D/L/R` layout hints | ❌ Explicitly unsupported | ✅ Fully honored by Graphviz |
| Edge routing (no crossings) | ❌ All edges share center corridor | ✅ Graphviz routes each edge independently |
| `together {}` row grouping | ❌ Not supported | ✅ Supported |
| Native GitHub rendering | ✅ Yes | ❌ No (use committed SVG) |
| Antigravity live preview | ✅ Built-in | ✅ Via jebbs.plantuml extension |
| Arrow labels readable | ❌ Often overlapping | ✅ Graphviz spaces them |
