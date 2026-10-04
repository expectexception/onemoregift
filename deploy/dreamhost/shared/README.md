# Deploying to DreamHost shared hosting

Production runs on the **Web Hosting Launch** plan (`sin1-shared-01`, user
`dh_nbu4fu`). Shared hosting was not designed for this, so read *Caveats* first.

## How it works

```
browser ──https──▶ Apache (DreamHost) ──.htaccess [P]──▶ Next.js :41892 ──/api/v1, /uploads, /media──▶ Express API :41891 ──▶ MongoDB Atlas
```

- **Built off-server.** `build-release.sh` turns `HEAD` into a self-contained
  tarball (backend + its prod `node_modules`, Next.js standalone server). The
  server never runs `npm` or `next build`.
- **Runs on DreamHost's system Node 18** (`/usr/bin/node`). Official Node 20/22
  binaries crash at their first JIT compile here (the server refuses their
  executable-memory `mprotect`, `ENOMEM`). The app supports Node ≥ 18.18, and
  CI tests the backend on 18.19.1.
- **Thread budget:** DreamHost moves every `node` process into a cgroup with
  3 GB RAM, 0.9 CPU and **25 threads** (`pids.max`). A default node process
  uses ~11, so `omg` starts each with `--v8-pool-size=1`,
  `UV_THREADPOOL_SIZE=2` and `VIPS_CONCURRENCY=1` (~6 threads). Past the cap,
  new threads fail and node aborts or hangs. Keep this in mind before running
  extra node scripts on the server while the apps are up.
- **`~/onemoregift/current/bin/omg`** starts/stops both processes, and
  `omg activate` switches releases with a health check and automatic rollback.
- **Cron runs `omg ensure` every 5 minutes** and restarts whatever stopped
  answering.

Server layout (`~/onemoregift`): `releases/` (newest 3), `current` →
live release, `shared/backend.env` + `shared/frontend.env` (production secrets,
never in git or the tarball), `shared/uploads/` (user uploads), `logs/`, `run/`.

## Deploy

**Automatic:** push to `production`. The workflow tests the backend on Node 18,
builds the release, deploys it, and smoke-tests the live site.

One-time GitHub setup (repo → Settings → Secrets and variables → Actions):

| Kind | Name | Value |
|------|------|-------|
| Secret | `DREAMHOST_SSH_KEY` | private key whose `.pub` is in the server's `~/.ssh/authorized_keys` |
| Variable (optional) | `DREAMHOST_SSH_TARGET` | default `dh_nbu4fu@sin1-shared-01.dreamhost.com` |
| Variable (optional) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN` | defaults are in the workflow |

Without the secret, the workflow still builds and then skips the deploy with a warning.

**By hand** (needs a `dreamhost` alias in `~/.ssh/config`):

```bash
bash deploy/dreamhost/shared/deploy.sh
```

## Operate

```bash
ssh dreamhost
~/onemoregift/current/bin/omg status          # pids, ports, health
~/onemoregift/current/bin/omg logs backend    # or: frontend
~/onemoregift/current/bin/omg restart
tail ~/onemoregift/logs/ensure.log            # restarts done by cron
```

**Roll back:** `omg activate ~/onemoregift/releases/<older-release>`.

**Change a secret:** edit `~/onemoregift/shared/backend.env` (or
`frontend.env`), then `omg restart`. `PORT` and `NODE_ENV` there are ignored,
because `omg` sets them.

## Caveats

- DreamHost doesn't allow long-running processes on shared plans and may kill
  them without warning. Cron brings them back within 5 minutes, but expect
  occasional gaps, and DreamHost could object to the usage. A Managed VPS
  (`deploy/dreamhost/deploy.sh`, PM2) avoids this.
- Node 18 is past upstream end of life. The server's package comes from Ubuntu.
- The ports (41891/41892) are on a loopback interface shared with other
  customers on the same machine. `build-release.sh` takes `BACKEND_PORT` /
  `FRONTEND_PORT` if they ever collide.
