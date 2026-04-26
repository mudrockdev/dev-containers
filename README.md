# Dev Container Templates

Each folder under `src/` is a self-contained dev container template directory that follows the `containers.dev` template distribution layout.

Templates included:

- `almalinux10-mise`
- `almalinux10-mise-mysql`
- `almalinux10-mise-postgresql`
- `debian13-bun`
- `debian13-bun-mysql`
- `debian13-bun-postgresql`
- `ubuntu2604-bun`
- `ubuntu2604-bun-mysql`
- `ubuntu2604-bun-postgresql`

Behavior:

- Bun templates install Bun for the non-root `devcontainer` user with `curl -fsSL https://bun.sh/install | bash`.
- mise templates install mise for the non-root `devcontainer` user with `curl https://mise.run | sh`.
- Every template sets `appPort` for Zed compatibility.
- Bun templates forward ports `3000` and `5173`.
- MySQL variants also forward `3306`.
- PostgreSQL variants also forward `5432`.

Database defaults:

- MySQL: host `localhost`, port `3306`, database `app`, user `app`, password `app`, root password `root`
- PostgreSQL: host `localhost`, port `5432`, database `app`, user `app`, password `app`

Testing with Podman:

- `bun run test debian13-bun`
- `bun run test debian13-bun -- bun --version`
- `bun run test almalinux10-mise`

Local editor use:

- Open `src/<template-id>` as the project folder in VS Code, Zed, or IntelliJ if you want to use a template directly from this repository.

Publishing:

- The repository includes a manual-only GitHub Actions workflow at `.github/workflows/publish-templates.yml`.
- It publishes the collection from `./src` to the OCI registry and namespace you choose when you run it.
- Bump each template version in `src/*/devcontainer-template.json` before republishing template changes.
