// Project binding declarations for the Cloudflare runtime types.
// The hosting control plane may inject DB at deployment time; application code
// treats the binding as optional and fails explicitly when it is unavailable.
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
  }
}
