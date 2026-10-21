# 🌐 Scent-Map — Olfactive Relational Graph

> An interactive spatial graph mapping **24,000+ fragrances** by notes, accords, and similarity distance. Inspired by the cartographic layout of *Music-Map*, built with **React**, **D3.js**, **Supabase (PostgreSQL)**, and **Tailwind CSS v4**, deployed to **Cloudflare Pages**.

---

## ⚡ Tech Stack

| Layer | Technology | Purpose & Capabilities |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite** | Fast SPA compilation, zero-latency state changes, and responsive layout management. |
| **Spatial Physics Engine** | **D3.js (`d3-force`)** | Force-directed simulation computing attraction, text collision buffers, and spatial distribution where physical distance = mathematical note distance. |
| **Styling & Design System** | **Tailwind CSS v4** | CSS-first compilation via `@tailwindcss/vite`, dynamic viewport scaling (`100dvh`), and mobile safe-area inset protection. |
| **Database & Vector Math** | **Supabase (PostgreSQL)** | GIN array indexing on fragrance notes, custom Jaccard similarity RPC functions, and sub-15ms nearest-neighbor resolution across 24k+ rows. |
| **Authentication & Realtime** | **Supabase Auth & Realtime** | Google OAuth, email authentication, row-level security (RLS), and real-time community impression feeds. |
| **Hosting & DNS Edge** | **Cloudflare Pages** | Global edge distribution, instant HTTPS, custom domain routing, and zero-propagation CDN delivery. |
| **Icons & Utilities** | **Lucide React** | Lightweight SVG iconography for olfactive telemetry, canvas zoom controls, and drawer interactions. |

---

## 🎯 Core Features

- **Spatial Force-Directed Matrix:** The focal bottle rests anchored at the center while similar fragrances float in orbital equilibrium based on shared top, mid, and base notes.
- **24,000+ Bottle Catalog:** Comprehensive database ingested from Fragrantica datasets with normalized note taxonomies and automated flanker deduplication.
- **Server-Side Jaccard Similarity RPC:** Real-time array set intersection ($\vert{}A \cap B\vert{} / \vert{}A \cup B\vert{}$) calculated directly in PostgreSQL, returning only the top nearest-neighbor nodes to keep canvas animations running at a smooth 60 FPS.
- **Interactive Note Resonance:** Hovering over any raw ingredient (e.g., *Bergamot*, *Ambroxan*, *Birch*) illuminates matching bottles across the map while dimming unrelated scents.
- **Olfactive DNA Synthesizer:** Analyzes a user's bookmarked wardrobe ("My Shelf") to determine their dominant accords, core raw notes, and personalized scent archetype (e.g., *Modern Chypre Purist*, *Resinous Wood Alchemist*).
- **Wardrobe Compatibility Score:** Computes a real-time percentage match for any unexplored fragrance against the user's saved collection.
- **Tactile Canvas Controls:** Full mouse drag-panning, mouse-wheel zooming, single-finger mobile panning, and two-finger pinch-to-zoom.
- **Community Hub & Crowdsourced Submissions:** Authenticated users can leave performance impressions (longevity/sillage) and submit unlisted fragrances directly into the relational matrix.

---

## 📁 Repository Structure

```text
scent-map/
├── .env.local                      # Supabase project URL & API keys
├── index.html                      # HTML root with viewport-fit=cover
├── package.json
├── vite.config.js                  # Vite compiler + Tailwind v4 plugin
├── scripts/
│   └── seed-csv.js                 # Batch CSV parser & ingestion script
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx       # Google OAuth & Email authentication dialog
│   │   ├── map/
│   │   │   ├── AddFragranceModal.jsx # Crowdsourced scent submission modal
│   │   │   └── ScentCanvas.jsx     # D3 force-directed physics board & zoom layer
│   │   ├── profile/
│   │   │   └── OlfactiveDnaModal.jsx # Personal wardrobe archetype & accord breakdown
│   │   └── ui/
│   │       ├── CommunityFeedDrawer.jsx # Real-time comments & discussion drawer
│   │       ├── Header.jsx          # Search autocomplete, accord strip, & auth controls
│   │       └── NoteDrawer.jsx      # Active scent pyramid & shelf bookmarking
│   ├── contexts/
│   │   └── AuthContext.jsx         # Global Supabase authentication provider
│   ├── hooks/
│   │   ├── useFavorites.js         # User shelf bookmarks & collection state
│   │   └── useFragranceGraph.js    # Cluster fetching, deduplication, & URL sync
│   ├── lib/
│   │   └── supabase.js             # Supabase client singleton
│   ├── utils/
│   │   └── olfactiveDna.js         # Accord classifications & blind-buy score math
│   ├── App.jsx                     # Root application layout coordinator
│   ├── index.css                   # Tailwind CSS v4 root styling
│   └── main.jsx                    # App mount & context wrapper
