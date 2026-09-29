# Interactive Portfolio House

This project will become an explorable pixel-art portfolio website. The current implementation contains only the Vite and TypeScript foundation; gameplay, rooms, content, and assets are added in later stories.

## Requirements

- Node.js `22.14.0` (see `.nvmrc`)
- npm

The supported Node range is also declared in `package.json` as `>=22.14.0 <23`.

## Local development

Install the locked dependencies:

```text
npm ci
```

Start the development server:

```text
npm run dev
```

Run the checks:

```text
npm run typecheck
npm test
npm run build
```

Preview the production build locally:

```text
npm run preview
```

## Project decisions

See [`plan.md`](./plan.md) for the implementation stories and [`log.md`](./log.md) for approved technical decisions and future decisions.

Project changes are tracked in [`CHANGELOG.md`](./CHANGELOG.md). Each remaining story adds a changelog entry, commits with its story ID, and pushes to the configured Git remote before it is marked complete.

The collision-bound and interaction-radius review flags, plus label-trigger behavior, are documented in
[`docs/interaction-feedback.md`](./docs/interaction-feedback.md).
