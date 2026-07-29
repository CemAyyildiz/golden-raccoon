# Contributing to Golden Raccoon

## Required toolchain

Golden Raccoon uses Node.js for the Next.js application and Rust for Soroban contracts.

- Node.js 22 or newer.
- npm 10 or newer.
- Rust stable 1.84 or newer. `wasm32v1-none` first became available in Rust 1.84.
- Stellar CLI 26.1.x for a mainnet Protocol 26 release build. A newer CLI may be used for Protocol 27 testnet work after compatibility is verified.
- Soroban SDK exactly `26.0.1`, pinned in `soroban/Cargo.toml` for current mainnet compatibility.

Install the contract toolchain on macOS:

```sh
rustup toolchain install stable
rustup target add wasm32v1-none
cargo install --locked stellar-cli --version 26.1.0
```

Homebrew may also install Stellar CLI, but `brew install stellar-cli` follows the newest release and can move ahead of mainnet. Check all versions before building:

```sh
node --version
npm --version
rustc --version
stellar --version
```

If both Homebrew Rust and rustup are installed, force Stellar CLI to use the rustup compiler that owns the WASM target:

```sh
RUSTC="$(rustup which rustc)" stellar contract build --manifest-path soroban/Cargo.toml
```

## Installation and verification

```sh
npm install
npm install --prefix frontend
npm run quality:gate
cargo test --manifest-path soroban/Cargo.toml
RUSTC="$(rustup which rustc)" stellar contract build --manifest-path soroban/Cargo.toml
```

Never commit a Stellar secret key, signed XDR, provider credential, or production wallet seed. User transactions must be signed only by the connected wallet.

## API contracts

Every route under `frontend/src/app/api/**` is documented as OpenAPI 3.1 in
`docs/openapi/v1/openapi.json`. If you add, remove, or change a route's
request/response shape, update the spec and `docs/openapi/ROUTE_COVERAGE.md`
in the same change, then run:

```sh
npm run test:openapi
```

This checks that every implemented route/method is documented (and vice
versa) and validates spec/error-helper conformance. It also runs as part of
`npm run quality:gate`. See `docs/openapi/COMPATIBILITY.md` for the
versioning and breaking-change policy.
