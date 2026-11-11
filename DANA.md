# دانا (Dana) — ICS branded Open WebUI fork

Persian RTL assistant shell for **شرکت اعتبارسنجی ایران (ICS)**. Themes live under `static/dana/themes/`; allowlisted chat widgets under `static/dana/magic-tokens.json`.

Live preview (local):

- Themes gallery: http://127.0.0.1:13000/static/dana/design-gallery.html
- Widgets: http://127.0.0.1:13000/static/dana/ux-preview.html
- Quick switch: http://127.0.0.1:13000/?dana_theme=ics-dark

## Themes

![gallery](docs/dana/themes/gallery.png)

| Id | Role | Preview |
| --- | --- | --- |
| `ics-dark` | Default dark-red brand BG + motion chat background | ![dark](docs/dana/themes/ics-dark.png) |
| `ics-maroon` | Light ICS maroon shell | ![maroon](docs/dana/themes/ics-maroon.png) |
| `ics-gauge` | Gauge-color motion / accents | ![gauge](docs/dana/themes/ics-gauge.png) |
| `ics-stair` | Stair transparent motion pack | ![stair](docs/dana/themes/ics-stair.png) |
| `ics-mono` | Mono logo pack | ![mono](docs/dana/themes/ics-mono.png) |
| `vanilla` | Disable Dana brand layer | — |

Admin: Settings → General → دانا / ICS Brand. Env: `DANA_THEME_ID` (see [`docs/dana/env.dana.example`](docs/dana/env.dana.example)).

## Magic tokens

Assistant messages may emit allowlisted tokens. Unknown tokens are ignored (fail closed).

| Token | Renderer | Usage |
| --- | --- | --- |
| `BIRTHDAY` | `BirthdayCake` | `<BIRTHDAY>` |
| `CREDIT_SCORE_BANDS` | `CreditScoreBands` | `<CREDIT_SCORE_BANDS>` or `<<<MAGIC:CREDIT_SCORE_BANDS {…}>>>` |
| `CREDIT_SCORE_GAUGE` | `CreditScoreGauge` | `<<<MAGIC:CREDIT_SCORE_GAUGE {"score":720,"band":"خوب","variant":"ring"}>>>` |
| `COMPANY_TIMELINE` | `CompanyTimeline` | `<<<MAGIC:COMPANY_TIMELINE {"items":[…],"variant":"vertical"}>>>` |
| `INFO_BANNER` | `InfoBanner` | `<<<MAGIC:INFO_BANNER {"title":"اطلاعیه","body":"…"}>>>` |
| `DATA_TABLE` | `DataTable` | `<<<MAGIC:DATA_TABLE {"variant":"striped",…}>>>` |
| `COLLAPSE_LIST` | `CollapseList` | `<<<MAGIC:COLLAPSE_LIST {"variant":"accordion",…}>>>` |
| `ANIMATED_LOGO` | `AnimatedLogo` | `<<<MAGIC:ANIMATED_LOGO {"variant":"white"}>>>` |

Catalog source: [`static/dana/magic-tokens.json`](static/dana/magic-tokens.json) · variants: [`static/dana/magic-variants.json`](static/dana/magic-variants.json)

### CREDIT_SCORE_GAUGE

Variants: `ring` · `arc` · `hero`

![CREDIT_SCORE_GAUGE](docs/dana/magic/CREDIT_SCORE_GAUGE.png)

### CREDIT_SCORE_BANDS

Colored score-range pills with Persian digits; active band outlined.

![CREDIT_SCORE_BANDS](docs/dana/magic/CREDIT_SCORE_BANDS.png)

### COMPANY_TIMELINE

Variants: `vertical` · `horizontal` · `compact`

![COMPANY_TIMELINE](docs/dana/magic/COMPANY_TIMELINE.png)

### INFO_BANNER

Glass callout banner for ICS notices.

![INFO_BANNER](docs/dana/magic/INFO_BANNER.png)

### BIRTHDAY

Animated cake celebration widget.

![BIRTHDAY](docs/dana/magic/BIRTHDAY.png)

### DATA_TABLE

Variants: `striped` · `cards` · `dense`

![DATA_TABLE](docs/dana/magic/DATA_TABLE.png)

### COLLAPSE_LIST

Variants: `accordion` · `grid` · `chips`

![COLLAPSE_LIST](docs/dana/magic/COLLAPSE_LIST.png)

### ANIMATED_LOGO

Variants: `white` · `maroon` · `gauge` (brand motion webm/stills)

![ANIMATED_LOGO](docs/dana/magic/ANIMATED_LOGO.png)

### UX montage

![ux-preview](docs/dana/magic/ux-preview.png)
