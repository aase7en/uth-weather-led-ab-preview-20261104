# Water-bank percentage LED design demo (2026-11-21)

**PREVIEW ONLY**; do not confuse with production aase7en/webapp-widget.

Hosted preview target: https://aase7en.github.io/uth-weather-led-ab-preview-20261104/water-bank-clarity-20261121/

Shows two ThaiWater/HII reference stations in 432x40 physical LED logical pixels (1x/2x/3x), or one enlarged station, with synthetic scenario controls.

- Main figure: (waterlevel_msl - ground_level_msl)/(min_bank_msl - ground_level_msl) x 100. Valid only for verified same-datum MSL, finite numbers, bank > ground and level >= ground.
- Secondary figure: min_bank_msl - waterlevel_msl metres. Descriptions distinguish below, at and above bank (physical reference only, NOT official flood-warning thresholds).
- Data fixtures: HDA004 ground .227, bank 3.03, level 2.36; S5 ground -8.59, bank 4.70, level .88. Reproduce 76.1% and 71.3% and gaps .67m/3.82m. NOT live readings.
- Scenario samples include near 94%, at 100%, above 100%, stale and unavailable. No external API/Google Sheet/Apps Script calls or production changes.
- A mock trend arrow is for UI design only. Production must calculate a real trend only from verified timestamped readings or show unknown. Never infer flood risk from this percentage.
- Production adoption is blocked by owner visual review, actual data/quality contract, stale/unknown handling, independent review and hosted CI.

QA: run the local scripts/qa-water-bank-preview-20261121.cjs with existing Puppeteer. All screenshots are SIMULATED fixtures and physical LED confirmation is outstanding.
