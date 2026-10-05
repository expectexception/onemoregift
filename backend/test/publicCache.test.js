const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

// TTL is read when the module loads; tests otherwise run with the cache off.
process.env.PUBLIC_CACHE_TTL_MS = "60000";
const { publicCache, clearPublicCacheOnWrite, _store } = require("../middleware/publicCache");

let hits;
const makeApp = () => {
  hits = { list: 0, mine: 0 };
  const app = express();
  app.use(cookieParser());
  app.use(clearPublicCacheOnWrite);
  app.get("/list", publicCache(), (req, res) => res.json({ n: ++hits.list }));
  app.get("/mine", publicCache({ anonymousOnly: true }), (req, res) => res.json({ n: ++hits.mine, user: req.cookies.user_token || null }));
  app.get("/broken", publicCache(), (req, res) => res.status(500).json({ error: true }));
  app.post("/write-ok", (req, res) => res.json({ ok: true }));
  app.post("/write-fail", (req, res) => res.status(400).json({ error: true }));
  return app;
};

test.beforeEach(() => _store.clear());

test("public GET is served from memory on repeat", async () => {
  const app = makeApp();
  const a = await request(app).get("/list?page=1");
  const b = await request(app).get("/list?page=1");
  assert.equal(a.headers["x-cache"], "MISS");
  assert.equal(b.headers["x-cache"], "HIT");
  assert.deepEqual(b.body, { n: 1 });
  assert.equal(hits.list, 1);

  // A different query string is a different entry.
  const c = await request(app).get("/list?page=2");
  assert.equal(c.headers["x-cache"], "MISS");
});

test("logged-in requests bypass anonymous-only caching", async () => {
  const app = makeApp();
  await request(app).get("/mine");
  const anon = await request(app).get("/mine");
  assert.equal(anon.headers["x-cache"], "HIT");

  const withCookie = await request(app).get("/mine").set("Cookie", "user_token=abc");
  assert.equal(withCookie.headers["x-cache"], undefined);
  assert.equal(withCookie.body.user, "abc");

  const withBearer = await request(app).get("/mine").set("Authorization", "Bearer xyz");
  assert.equal(withBearer.headers["x-cache"], undefined);
  assert.equal(hits.mine, 3);
});

test("error responses are never cached", async () => {
  const app = makeApp();
  await request(app).get("/broken");
  const again = await request(app).get("/broken");
  assert.equal(again.status, 500);
  assert.equal(again.headers["x-cache"], "MISS");
});

test("a successful write clears the cache; a failed one does not", async () => {
  const app = makeApp();
  await request(app).get("/list");
  await request(app).post("/write-fail");
  assert.equal((await request(app).get("/list")).headers["x-cache"], "HIT");

  await request(app).post("/write-ok");
  const after = await request(app).get("/list");
  assert.equal(after.headers["x-cache"], "MISS");
  assert.deepEqual(after.body, { n: 2 });
});
