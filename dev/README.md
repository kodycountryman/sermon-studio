# Local Codex preview

Run `npm run dev` and open the loopback URL (normally http://127.0.0.1:5173).
Vite handles `/api/ai` locally using the Codex CLI; all other `/api` routes retain
the Cloudflare proxy. The page displays “Using Codex”.

The Codex CLI must be installed and signed in (`codex login status`, or
`codex login` if needed). The bridge finds the bundled macOS CLI, or `codex` on
PATH. Set `CODEX_BIN` to override the executable path. It uses the CLI default
model with your existing account authentication and limits.

Each request uses an ephemeral session in a temporary directory with the
read-only sandbox; non-streaming requests ignore user configuration. Text-service prompts
instruct Codex not to use tools. Temporary directories are removed on completion.
The endpoint accepts only loopback, same-origin requests, limits request size,
and runs one generation at a time. Disconnects/cancellation terminate the child
process; streaming requests time out after 180 seconds (110 seconds for non-streaming).

Streaming requests use `codex app-server` text deltas and forward them immediately
through SSE. Outline formatting uses a single compact classification stream and
renders original source lines progressively, with purple practical examples.
Cancellation or failures restore the complete source with completed formatting.

`npm run build` produces the ordinary production site. This middleware is a
Vite development plugin, not a Cloudflare Function or browser dependency. The
published site continues using its configured Anthropic Cloudflare endpoint.
