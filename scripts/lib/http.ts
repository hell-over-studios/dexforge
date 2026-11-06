/**
 * Cache-first, polite PokeAPI fetcher.
 *
 * - Mirror layout: scripts/.cache/pokeapi/<endpoint>/<id>.json
 * - Never performs a network request for an already cached path.
 * - Rate limiting: max `concurrency` parallel network requests AND a minimum
 *   interval between request starts, to be a good API citizen.
 * - Retries 429/5xx with exponential backoff + jitter (up to 5 attempts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const API_BASE = 'https://pokeapi.co/api/v2';
const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const CACHE_DIR = path.join(ROOT, '.cache', 'pokeapi');

const CONCURRENCY = 8;
const MIN_INTERVAL_MS = 100;
const MAX_ATTEMPTS = 5;

export const GZIP = true; // store compressed to keep the cache small on disk

let active = 0;
const waiters: (() => void)[] = [];
let lastStart = 0;

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryStart = () => {
      if (active < CONCURRENCY) {
        active++;
        // enforce spacing between network request starts
        const now = Date.now();
        const wait = Math.max(0, lastStart + MIN_INTERVAL_MS - now);
        lastStart = now + wait;
        setTimeout(resolve, wait);
      } else {
        waiters.push(tryStart);
      }
    };
    tryStart();
  });
}

function releaseSlot(): void {
  active--;
  const next = waiters.shift();
  if (next) next();
}

function cachePath(endpointPath: string): string {
  return path.join(CACHE_DIR, ...endpointPath.split('/')) + '.json.gz';
}

async function readCache(endpointPath: string): Promise<unknown | undefined> {
  const file = cachePath(endpointPath);
  try {
    const buf = await fs.promises.readFile(file);
    const json = GZIP
      ? await new Promise<string>((resolve, reject) =>
          zlib.gunzip(buf, (err, data) => (err ? reject(err) : resolve(data.toString()))),
        )
      : buf.toString();
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

async function writeCache(endpointPath: string, data: unknown): Promise<void> {
  const file = cachePath(endpointPath);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const body = Buffer.from(JSON.stringify(data));
  if (GZIP) {
    await new Promise<void>((resolve, reject) =>
      zlib.gzip(body, (err, out) =>
        err ? reject(err) : fs.promises.writeFile(file, out).then(resolve, reject),
      ),
    );
  } else {
    await fs.promises.writeFile(file, body);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Downloads (or reads from cache) a single PokeAPI resource. */
export async function fetchPokeApi<T = unknown>(endpointPath: string): Promise<T> {
  const cached = await readCache(endpointPath);
  if (cached !== undefined) return cached as T;

  const url = `${API_BASE}/${endpointPath}`;
  let attempt = 0;
  for (;;) {
    attempt++;
    await acquireSlot();
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          accept: 'application/json',
          'user-agent': 'dexforge-data-pipeline/0.1 (github.com/hell-over-studios/dexforge)',
        },
      });
    } catch (err) {
      releaseSlot();
      if (attempt >= MAX_ATTEMPTS) throw new Error(`Network error for ${url}: ${String(err)}`);
      await sleep(backoffMs(attempt));
      continue;
    }
    releaseSlot();

    if (res.status === 404) throw new Error(`404 not found: ${url}`);
    if (res.ok) {
      const data = (await res.json()) as T;
      await writeCache(endpointPath, data);
      return data;
    }
    if (res.status >= 500 || res.status === 429) {
      if (attempt >= MAX_ATTEMPTS)
        throw new Error(`Giving up on ${url} after ${attempt} attempts (HTTP ${res.status})`);
      await sleep(backoffMs(attempt, res.status === 429));
      continue;
    }
    throw new Error(`Unexpected HTTP ${res.status} for ${url}`);
  }
}

function backoffMs(attempt: number, throttle = false): number {
  const base = 1000 * 2 ** (attempt - 1);
  const jitter = base * (0.7 + Math.random() * 0.6);
  return throttle ? Math.max(jitter, 2000) : jitter;
}

/** Runs `fn` over `items` with the configured politeness, reporting progress. */
export async function mapPolite<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  label?: string,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let done = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
      done++;
      if (label && (done % 50 === 0 || done === items.length)) {
        console.log(`  … ${label}: ${done}/${items.length}`);
      }
    }
  });
  await Promise.all(workers);
  return results;
}
