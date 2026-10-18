# Satisfactory Locator

[![Hippocratic License HL3-BOD-CL-ECO-FFD-LAW-MEDIA-MIL-MY-SV-TAL-USTA-XUAR](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-BOD-CL-ECO-FFD-LAW-MEDIA-MIL-MY-SV-TAL-USTA-XUAR&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/bod-cl-eco-ffd-law-media-mil-my-sv-tal-usta-xuar.html)

---

A static TypeScript web application for finding Satisfactory factory locations that satisfy multiple resource-node proximity requirements.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [Deployment](#deployment) for notes on how to install the project on a live system.

### Prerequisites

- Node.js 24 or newer, or the version selected by `mise.toml`
- npm
- Nix with flakes enabled, if using the provided development shell
- direnv, optional but recommended when using Nix

### Setup

Clone the repository and install dependencies:

```bash
git clone git@github.com:BlueSialia/satisfactory-locator.git
cd satisfactory-locator
npm install
```

With Nix and direnv installed, run `direnv allow` after cloning to enter the pinned development shell automatically. Without direnv, use `nix develop`.

Run `./setup-hooks.sh` once to enable the local Conventional Commits hook.

### Running the Client

```bash
npm run dev
```

Open the local Vite URL printed by the command. The initial map shows the world background; add conditions and select **Apply filters** to calculate valid areas.

## Running the Tests

### Unit Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

### Quality Checks

```bash
npm run format
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run size
npm run knip
npm run check
```

`npm run check` runs linting, type checking, coverage, the production build with bundle-size limits, and Knip. It is the same command used by CI.

- `npm run generate:data` validates the upstream resource data with Zod and generates the normalized `public/data/resource-nodes.json` asset. It runs automatically before `npm run dev` and `npm run build`.
- `npm run size` builds the application and checks the generated JavaScript and CSS against the limits in `package.json`: 300 kB of brotli-compressed JavaScript and 30 kB of brotli-compressed CSS.

## Deployment

### GitHub Pages

The `main` branch is deployed automatically by `.github/workflows/deploy-pages.yml`. Configure the repository's Pages source as **GitHub Actions** under **Settings → Pages → Build and deployment**.

### Other Static Hosts

Build the application and deploy the generated `dist/` directory:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

Vite uses relative asset URLs so the build works at a GitHub Pages repository URL with a repository-name prefix.

## Built With

| Dependency | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Application language with strict compiler settings |
| [Vite](https://vite.dev/) | Development server and production build |
| [Leaflet](https://leafletjs.com/) | Interactive map rendering |
| [polygon-clipping](https://github.com/mfresh-pro/polygon-clipping) | Search-area union and intersection geometry |
| [Zod](https://zod.dev/) | Build-time validation of resource data |
| [Biome](https://biomejs.dev/) | Formatting and linting |
| [Vitest](https://vitest.dev/) | Unit tests and coverage |

## Automations

Pushes to `main` run the full check suite and deploy to GitHub Pages only when all checks pass. The scheduled dependency audit is documented in [AUTOMATIONS.md](AUTOMATIONS.md).

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/BlueSialia/satisfactory-locator/tags).

## Authors

* **Jorge Domínguez** - *Initial work* - [BlueSialia](https://github.com/BlueSialia)

See also the list of [contributors](https://github.com/BlueSialia/satisfactory-locator/contributors) who participated in this project.

## License

This project is licensed under the Hippocratic License 3.0. See the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [Tjark-Kuehl/satisfactorymap](https://github.com/Tjark-Kuehl/satisfactorymap) for the resource-node data and map background.
- Satisfactory is a trademark of Coffee Stain Studios. This project is not affiliated with Coffee Stain Studios.
