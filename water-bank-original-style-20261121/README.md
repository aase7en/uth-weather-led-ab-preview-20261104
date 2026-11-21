# UTH Water Level — original production visual + percent layout (preview only)

## Latest explicit owner feedback 2026-11-21
The first percentage demo had acceptable text size and positional ideas, but the art direction was not accepted. Preserve ORIGINAL production Water Level colors, illuminated dam/flow animation, clock, status badges and 7D graph. Change ONLY the main displayed number to percentage of ground-reference-to-lowest-bank and position a trend arrow plus smaller gap-to-bank label.

This directory is a standalone PREVIEW demo with exclusively SIMULATED water samples. No HII/Google Sheet/Apps Script/backend call. The public Water page of aase7en/webapp-widget remains unchanged; owner must approve revised preview before any production feature.

## Pinned original source
- aase7en/webapp-widget main 0d12f09bc0577299a3fdfc19a39ce1df892a27b7, v2/water-luxury-live.html/css/js and assets/water-gate/5-levels/uth_led_water_3_51_75pct_spritestrip.png.
- Copies water-core.css, water-core.js and sprite are byte-identical to source. Derived water-preview-renderer.js changes ONLY local asset path, bounded trend helper and renderStation markup/metric binding.
- No canvas animation, foam, old color/glass/border, 7D historyPath chart algorithm modified. Added water-preview-overrides.css only for percent, arrow and distance-to-bank layout on top of exact original CSS.

## Data meaning
- Fixture HDA004 2.36 MSL, ground .227, bank 3.03 => 76.1%, gap .67m. S5 .88, ground -8.59, bank 4.70 => 71.3%, gap 3.82m. Fixed design test fixtures, not latest actual.
- Other UI cases: near 94%, at 100%, above 100%, historical and unavailable; dual/single station, zoom 1x/2x/3x.
- Arrow is computed only from SIMULATED timestamped history. Real adoption requires independently validated measured observations, gaps and freshness; unknown remains unknown.
- Percent is NOT flood probability, river capacity or official flood warning. Original status badge is source bank-relative, not certified evacuation guidance. Staff m MSL retained in the preview detail panel outside LED.

## Verification and release boundary
- Chrome 432x40 and 3x screenshots, 6 scenarios, mobile, no external network requests, no JS errors, text/arrow vs history graph boundary tests.
- Reduced Motion supported by original Water renderer media preference.
- Owner approval of THIS DEMO is required before any widget production feature PR; never auto-merge preview as operational Water release.
