# DualisCapax Photo Archive — Earth's Hidden Signals

**Collection started:** 2026-10-17  
**Purpose:** Preserve a source-linked visual research collection for the DualisCapax investigation into seismic sensing, Earth's magnetic environment, and Sun–Earth interactions.

> **Archive policy:** Each item records its title, original source, attribution/rights information, and relevance. Images embedded below are served from their original publishers; this first commit is a curated index, not a claim that the original image binaries have been copied into this repository. Where reuse rights permit, locally preserved copies can be added with checksums and provenance.

## 01 — Listening beneath the Antarctic ice

**Topic:** Deep seismic sensing at the South Pole.

- **Source:** U.S. Geological Survey (USGS), *The Loneliest Seismometers on Earth* (January 15, 2026)
- **Rights:** USGS page identifies its media as public domain.
- **Research value:** A real-world example of seismometers deployed more than 8,000 feet beneath the South Pole icecap to capture subtle ground motion.

[Open the USGS article and original photographs](https://www.usgs.gov/news/science-snippet/loneliest-seismometers-earth)

Related background: [Listening to the Earth at the South Pole — USGS](https://www.usgs.gov/programs/earthquake-hazards/science/listening-earth-south-pole)

## 02 — Waves in Earth's magnetic bubble

![NASA visualization of plasma waves in Earth's magnetosphere](https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004922/PlasmaWavesGraphic.png)

- **Source:** [NASA Scientific Visualization Studio — Plasma Waves](https://svs.gsfc.nasa.gov/4922)
- **Credit:** NASA/GSFC Scientific Visualization Studio.
- **Research value:** A map of plasma-wave regions and phenomena across Earth's magnetosphere.
- **Use:** Reference visualization; consult the source page for full credit and reuse details.

## 03 — Earth's magnetic structure

![NOAA diagram of Earth's magnetic structure](https://www.ncei.noaa.gov/sites/default/files/2019-updated-HDGM-diagram-v7-with-nums-01_0.png)

- **Source:** [NOAA National Centers for Environmental Information — Modeling Earth's Geomagnetic Fields](https://www.ncei.noaa.gov/news/HDGM)
- **Research value:** A cross-section illustrating Earth's core, mantle, lithosphere, and magnetic-field-related currents.
- **Use:** Scientific reference diagram; retain NOAA attribution and consult the source page for reuse details.

## 04 — A seismic station in the field

![EarthScope Alaska Transportable Array post-hole station schematic](https://anf.ucsd.edu/images/about/AlaskaTA-posthole.png)

- **Source:** [EarthScope ANF — About the Array Network Facility](https://anf.ucsd.edu/about/)
- **Research value:** Shows how a field station combines a buried seismometer with power, timing, environmental sensing, and communications infrastructure.
- **Use:** Technical reference; consult the source page for attribution and reuse terms.

## Research questions for the collection

1. What physical signals can each instrument measure directly?
2. Which signals are routinely discarded as noise, and under what conditions might they contain useful structure?
3. Can seismic, magnetic, ionospheric, and solar observations be time-aligned to test a shared physical hypothesis?
4. Which relationships survive independent validation and negative controls?

## Provenance and integrity

For future locally stored assets, record:

- Original source URL and creator/credit
- Rights or license statement and date checked
- Retrieval date in UTC
- Original filename and media type
- SHA-256 checksum
- Any transformations, with originals preserved unchanged

**Scientific rule:** visual similarity or correlation alone does not establish a shared physical mechanism. Keep observations, interpretations, and hypotheses distinct.


## Live tools

- [Open the gallery](./gallery.html) — searchable cards backed by the discovery index.
- [Discovery index](./discoveries.json) — source-linked NASA image candidates.
- [Updater](./update_discoveries.py) — refreshes the candidate index from the NASA Images API; it does not download binaries.
- [Public DNS audit report](./public-dns-audit.json) — read-only DNS and HTTPS snapshots.
- [DNS audit implementation](./audit_public_dns.py) — checks public DNS-over-HTTPS and HTTPS responses; never edits records.

## Automation boundaries

- `.github/workflows/earth-photo-archive.yml` refreshes the discovery index daily and on manual dispatch.
- `.github/workflows/public-dns-audit.yml` checks public DNS and HTTPS every six hours and on manual dispatch.
- Both workflows have repository-content write permission only. Neither has Cloudflare credentials, deploys Pages, changes DNS, touches the database, or modifies the Vultr servers.
- GitHub scheduled workflows run from the repository's default branch. These schedules become active only after the proposed branch is reviewed and merged. A manual run can be tested against the branch first.
- Discovery does not mean permission to mirror. Each image must pass item-level credit and rights review before binary files are copied into the repository.

## Production simplification rule

The current operations record states that the live domain, DNS, database, and New Jersey server must be preserved, and production publication/DNS cutover require explicit approval. The new archive and audit work is isolated on a review branch. It does not remove or replace the existing Pages worker or hosting configuration.
