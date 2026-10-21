# Rexios VPS deployment and removal

This guide prepares a manual deployment at `https://rexios.duckdns.org`. It does not install or replace the VPS's existing Docker, Caddy, PostgreSQL, firewall or other applications. Use **only `compose.vps.yml`** for this deployment; the local Compose files serve a different purpose.

Preparation was verified locally: Compose/helper validation, blank-secret rejection, migration/seed/startup with cached images under the VPS runtime limits, web-to-API health, unique shared-network DNS alias, and project-scoped teardown retaining the external network. The 20 API integration checks and frontend build pass; lint retains three existing warnings. Native ARM64 builds and the actual shared-proxy reload remain deployment-time checks.

## Isolation

| Resource | Rexios ownership |
| --- | --- |
| Checkout | `/home/opc/rexiosai` |
| Compose project | `rexios-vps` |
| Containers | `rexios-vps-db-1`, `rexios-vps-api-1`, `rexios-vps-rexios-web-1` |
| Persistent volumes | `rexios-vps_database`, `rexios-vps_uploads` |
| Private network | `rexios-vps_default` |
| Shared external network | Existing `fidelgo-vps-dev-edge`; never delete it |
| Shared proxy route | Only the `rexios.duckdns.org` site block |
| Host ports | None |

Only `rexios-web` joins the shared edge network. Its service name is deliberately unique: using `web` would add a DNS alias that could conflict with another project's web service. The database and API stay on the project network. Internal ports 5432, 3000 and 80 do not occupy host ports. The database and uploads use Docker volumes, avoiding host bind-mount permission/SELinux changes.

The API and database each have a 512 MiB runtime memory limit; the web container has 96 MiB. CPU and log limits keep this small demo bounded. Builds can temporarily use more resources, so build one image at a time. All base images have ARM64 variants; build natively on the Ampere VPS rather than copying x86 images or installing emulation.

## Before first deployment

The October 21 assessment found Docker 26.1.3 / Compose 2.27.0, existing Caddy on ports 80/443, and the correct DuckDNS IPv4 record. Recheck these facts before deploying:

```bash
docker compose version
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker network inspect fidelgo-vps-dev-edge --format '{{.Name}}'
getent ahostsv4 rexios.duckdns.org
df -h /
free -m
```

The existing proxy is `esireviews-web-1`, already attached to that edge network. Its configuration also serves ESI Reviews and Fidelgo. Adding the Rexios hostname requires an additive configuration change and graceful reload of this shared proxy; do that separately from starting Rexios. Do not restart or recreate any existing project to deploy this app.

GitHub authentication was unavailable to `opc` during the assessment. Arrange repository read access first, preferably with a repository-scoped read-only deploy key. Keep credentials outside this checkout and out of Git URLs. Use your existing local GitHub credentials to push updates to `main`; the VPS only needs to pull.

## Checkout and configuration

After repository access is ready:

```bash
cd /home/opc
git clone --branch main <authenticated-repository-url> rexiosai
cd /home/opc/rexiosai
umask 077
cp .env.vps.example .env.vps
```

Use the HTTPS URL `https://github.com/AzzouzAimen/rexiosai.git` with a configured credential helper, or `git@github.com:AzzouzAimen/rexiosai.git` with a configured deploy key. Do not place a token in the URL.

Generate two different secrets using the VPS's existing Python, without installing Node on the host:

```bash
python3 -c 'import secrets; print(secrets.token_hex(32))'
python3 -c 'import secrets; print(secrets.token_hex(32))'
```

Put one value in `POSTGRES_PASSWORD` and the other in `SESSION_SECRET` inside `.env.vps`. Use hex for the database password because it is interpolated into a URL. Keep `DEMO_PASSWORD=123` for the requested demonstration credentials. `.env.vps` is ignored by Git and Docker builds. Blank secrets intentionally fail validation.

The VPS Compose file fixes the allowed origin to `https://rexios.duckdns.org`, enables secure session cookies and trusts the app's immediate proxy. The existing web Caddy config forwards the original HTTPS scheme from the shared edge proxy.

## Build and start Rexios

The helper pins the project name, environment file and standalone Compose file. Invoke it with Bash; it does not need an executable bit.

```bash
bash deploy/vps.sh config --quiet
bash deploy/vps.sh build api
bash deploy/vps.sh build rexios-web
bash deploy/vps.sh up -d --wait db
bash deploy/vps.sh run --rm --no-deps api npm run db:migrate
bash deploy/vps.sh run --rm --no-deps api npm run db:seed
bash deploy/vps.sh up -d --wait
bash deploy/vps.sh ps
bash deploy/vps.sh exec -T api node -e "fetch('http://127.0.0.1:3000/api/health').then(async r=>{console.log(await r.text());process.exit(r.ok?0:1)})"
```

Seeding is explicit and preserves edited fixture text and decisions. It resets fixture account passwords to `DEMO_PASSWORD`. Restarting or updating containers does not automatically seed or migrate. Reuse cached images/dependencies; check download sizes before any large uncached build. Never run global Docker prune/cleanup commands on this shared VPS.

## Connect the shared Caddy proxy

`deploy/rexios.caddy` contains the one required site block. It routes to `rexios-web:80` through the existing external network; no new public port or firewall rule is needed. Caddy can obtain and renew the certificate through the already-reachable ports 80/443. DuckDNS already resolves to this VPS; no extra DNS-updater container is needed while that public IP remains unchanged.

Before changing the shared proxy, back up both its current Caddyfile and its source file outside this repository. Preserve all current sites and settings, append only this site block, validate the full combined configuration, then use `caddy reload` rather than stopping/recreating the container. Check the existing ESI Reviews and Fidelgo routes before and after the reload. Remove only the added site block to roll back routing.

The inspected proxy starts from `/etc/caddy/Caddyfile` inside its image. Its source is `/home/opc/esi-reviews/deploy/Caddyfile`, with no live Caddyfile bind mount. Save the route in that source **and** apply it to the running configuration. A live API-only change or an edit only inside the container can disappear during a later recreation. This guide deliberately does not automate edits to another project's files.

For the later routing step, create backups and a candidate from the **live** configuration, which may differ from the source. Run from the Rexios checkout:

```bash
rexios_proxy_backup="/home/opc/rexios-proxy-backups/$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$rexios_proxy_backup"
docker cp esireviews-web-1:/etc/caddy/Caddyfile "$rexios_proxy_backup/live.Caddyfile"
cp /home/opc/esi-reviews/deploy/Caddyfile "$rexios_proxy_backup/source.Caddyfile"
cp "$rexios_proxy_backup/live.Caddyfile" "$rexios_proxy_backup/candidate.Caddyfile"
# First addition only: confirm the hostname is absent before appending.
cat deploy/rexios.caddy >> "$rexios_proxy_backup/candidate.Caddyfile"
diff -u "$rexios_proxy_backup/live.Caddyfile" "$rexios_proxy_backup/candidate.Caddyfile"
```

`diff` returns 1 for the expected added block. Review that it contains only the new Rexios block. Separately add that same block to `/home/opc/esi-reviews/deploy/Caddyfile`, preserving its existing contents; do not overwrite the source blindly with the live candidate. Copy and validate that source before relying on it for a future image rebuild, then apply the reviewed live candidate:

```bash
docker cp /home/opc/esi-reviews/deploy/Caddyfile esireviews-web-1:/tmp/rexios-source.Caddyfile
docker exec esireviews-web-1 caddy validate --config /tmp/rexios-source.Caddyfile --adapter caddyfile
docker cp "$rexios_proxy_backup/candidate.Caddyfile" esireviews-web-1:/tmp/rexios-candidate.Caddyfile
docker exec esireviews-web-1 caddy validate --config /tmp/rexios-candidate.Caddyfile --adapter caddyfile
# Proceed only after validation succeeds.
docker cp "$rexios_proxy_backup/candidate.Caddyfile" esireviews-web-1:/etc/caddy/Caddyfile
docker exec esireviews-web-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

This reload changes configuration without restarting the container. If it fails or the existing sites regress, restore `live.Caddyfile` to `/etc/caddy/Caddyfile` with `docker cp`, reload it, and restore the saved source file. On eventual removal, follow the same backup/validate/copy/reload sequence with a candidate that removes **only** the Rexios block; update the source too. A future proxy image recreation must be built from the updated source.

After routing is enabled, verify HTTPS, `/api/health`, guest browsing, company login and talent login. Password `123` applies to seeded `c@demo.test`, `c2@demo.test`, `c3@demo.test`, `c4@demo.test`, `s@demo.test` and `m@demo.test`. No browser automation is required by the deployment commands.

## Update manually

From `/home/opc/rexiosai`, with a clean checkout:

```bash
git pull --ff-only origin main
bash deploy/vps.sh build api
bash deploy/vps.sh build rexios-web
bash deploy/vps.sh run --rm --no-deps api npm run db:migrate
bash deploy/vps.sh up -d --wait
bash deploy/vps.sh ps
```

Back up Rexios data before a schema-changing update. Keep the database password and session secret stable across ordinary updates; changing the environment alone does not change an existing PostgreSQL password.

## Stop or remove later

First remove only the `rexios.duckdns.org` block from the shared proxy's source and running configuration, validate and gracefully reload it, and verify the other sites. Keep its existing networks, certificates and other configuration intact.

While Rexios is still running, optionally back up its database and uploaded files outside the checkout. These commands use the existing containers and download no backup tools:

```bash
cd /home/opc/rexiosai
umask 077
bash deploy/vps.sh exec -T db pg_dump -U rexios rexios > ../rexios-database.sql
bash deploy/vps.sh exec -T api tar -C /app/uploads -czf - . > ../rexios-uploads.tar.gz
```

To stop and remove Rexios containers and its private network **while retaining its data**:

```bash
bash deploy/vps.sh down
```

To permanently remove **only Rexios's database and uploaded files** when no longer needed:

```bash
# This next command intentionally destroys Rexios's two persistent volumes.
bash deploy/vps.sh down --volumes
```

`down` does not remove the external proxy network or other Compose projects. Do not add `--rmi all`: the PostgreSQL image may be shared with another app.

After removal, the checkout can be deleted separately after verifying it resolves to exactly `/home/opc/rexiosai`. Keep any desired backups outside it. A stopped checkout with `.env.vps` retained can be brought back using the same commands. This workflow does not require uninstalling Docker, changing the host database, modifying firewall rules, or deleting shared resources.
