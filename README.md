# Weekend Outing Triage

Mobile-first decision engine for parents to quickly triage, filter, and discover outdoor and indoor outings with toddlers and young children.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (Dark theme slate palette with safe-area utilities)
- Capacitor Core, CLI, Android, and Geolocation
- Lucide React icon set
- Vitest for automated contract testing

## Project Structure

- `capacitor.config.ts`: Capacitor native app configuration (`com.weekendouting.triage`).
- `src/types/`: Strict TypeScript data contracts and runtime validators:
  - `location.ts`: `LocationCoords` interface and `isLocationCoords` runtime validator.
  - `weather.ts`: `WeatherCondition`, `WeatherState`, condition list, and `isWeatherState` validator.
  - `spot.ts`: `SpotCategory`, `EnergyLevel`, `CostLevel`, `SpotType`, `ParentAmenities`, `Spot`, and validation guards.
  - `triage.ts`: `TriageCountOption`, `ProximityBand`, `TriageFilter`, `TriageCandidate`, and `TriageOutput`.
  - `index.ts`: Re-export hub for all contracts.
- `src/types/__tests__/`: Automated test suites validating Capacitor configs, Geolocation contracts, data structures, and edge-case guards.

## Available Scripts

- `npm run dev`: Start local Vite development server.
- `npm run build`: Type-check via `tsc -b` and build production client bundle via Vite.
- `npm test`: Run automated Vitest contract suite.
- `npm run lint`: Run Oxlint static analysis.
