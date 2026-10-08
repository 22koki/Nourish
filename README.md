# Nourish

A working nutrition-product foundation connecting weekly meal planning, ingredient shopping, guided cooking and habit check-ins with a private professional planning workspace.

## Product experience

- Warm forest-green and cream interface, original food imagery and responsive layouts.
- Individual dashboard, recipe discovery and favorites.
- Weekly plans, adjustable household servings, restrictions and budget-aware starter generation.
- Consolidated shopping quantities, pantry matching, checklists and export.
- Guided cooking, timers and meal check-ins.
- Barrier-aware self-directed swaps with shopping-list recalculation.
- Private client records, professional notes, draft client plans and export.
- Signed-in account-scoped D1 persistence, server validation, data export and deletion.

## Running locally

Requires Node 22.13+ and pnpm. Run `pnpm install`, then `pnpm dev`.

The app expects Cloudflare D1 via the `DB` binding and the Sites identity headers. Outside Sites, adapt authentication on the server; never trust identity headers directly from an untrusted public client. The current API rejects anonymous users. A local UI preview without platform identity can display the interface but cannot save records.

Generate migrations with `pnpm db:generate`. Apply them with Wrangler using the configured D1 database. Hosted Sites deployment applies committed schema migrations.

Run `pnpm exec tsc --noEmit` for type checking. Run `pnpm build` for the production build. Tests: `pnpm test`.

## Release boundaries

This is an initial working release, not a clinically validated or fully commercial nutrition SaaS. The recipe library contains eight original plant-based concepts plus live TheMealDB discovery by ingredient, recipe name or category. Full detail records are fetched before showing ingredients. Opened recipes are saved in the account cookbook (up to 100), and can be favorited, manually planned, cooked and exported. Images are illustrative; ingredient costs are sample estimates. The user configures their own local cost multiplier, not a live currency conversion. Pantry matching currently assumes the listed ingredient is available; it does not subtract exact inventory quantities. Weekly plans are reusable weekday templates, not dated appointments.

Therapeutic nutrition, prescribing, verified nutrient analysis, credential verification, client account invitations/sharing, professional approval of substitutions, secure clinical messaging, video consultations, payments/subscriptions, live retailer inventory/checkout, translation, offline mode, wearables, arbitrary website recipe imports, automated reminders and administration are not implemented. Client plans are private preparation records belonging to the professional's signed-in account; no client delivery is implied. Consumer swaps are clearly identified as self-directed.

Before storing real patient information or commercial launch, validate clinical content, jurisdiction-specific professional requirements, privacy and retention controls, multi-user workflows, billing and operational support. The current single-account workspace is suitable for product demonstration and carefully bounded pilot planning.

## Technical structure

- `app/studio.tsx`: interactive product UI
- `app/recipes.ts`: starter recipes
- `app/domain.ts`: shared planning and ingredient rules
- `app/api/workspace/route.ts`: authenticated validated account data API
- `db/schema.ts` and `drizzle/`: D1 schema and migrations
- `public/images/`: bundled food assets

## Assets

Hero photograph and recipe contact sheet generated for this project. Pasta photograph from Unsplash, source https://images.unsplash.com/photo-1473093295043-cdd812d0e601 . Displayed imagery illustrates the recipes and is not proof of nutritional composition.

## Live recipe source

TheMealDB is queried from `app/api/recipes/route.ts`, behind signed-in access. Searches have bounded pagination, detail hydration, request timeouts, graceful errors and a short-lived per-worker cache. A query of `chicken` currently returns 20 source matches under development access; access-tier limits mean this is not an exhaustive catalog count.

Configure the server-only `THEMEALDB_API_KEY` secret for licensed production access before commercial/public release. The current owner-private development app uses the documented test key `1` when that secret is absent. Never expose paid keys in client code. Source terms: https://www.themealdb.com/terms_of_use.php and documentation: https://www.themealdb.com/documentation .

No nutrient values, serving sizes, cooking times or price estimates are invented for imported recipes. The UI labels those fields as unavailable. Source ingredient measures stay verbatim. Shopping lists show original quantities and repeat counts, not guessed household scaling. Imported recipes are excluded from automatic constrained plans and cannot be manually planned when allergy restrictions are selected. Manual planning requires ingredient review. The optional deep-frying filter checks wording only; it is not a healthy-food certification.

Pantry matching supports a small conservative alias list, distinguishes chicken stock from chicken, and reports missing ingredients. Quantity, cut and preparation still need user review. Provider attribution, source links, videos and source license metadata are retained.

## GitHub and live app

Repository: https://github.com/22koki/Nourish

Private development app: https://nourish-studio.micro1-4225.chatgpt.site
