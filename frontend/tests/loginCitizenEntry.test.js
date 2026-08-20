import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { homeForRole, routePermission } from "../src/auth/routing.js";

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));

async function renderLoginPage() {
  const vite = await createServer({
    root: frontendRoot,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  try {
    const [{ default: LoginPage }, { AuthProvider }] = await Promise.all([
      vite.ssrLoadModule("/src/pages/LoginPage.jsx"),
      vite.ssrLoadModule("/src/auth/AuthContext.jsx"),
    ]);
    return renderToStaticMarkup(
      React.createElement(AuthProvider, null, React.createElement(LoginPage)),
    );
  } finally {
    await vite.close();
  }
}

test("login page clearly renders public citizen access and staff sign-in", async () => {
  const markup = await renderLoginPage();

  assert.match(markup, />Citizen Services</);
  assert.match(markup, /No login required/);
  assert.match(markup, /Report local water, sanitation, or environmental hazards instantly/);
  assert.match(markup, /href="#\/citizen-report"[^>]*>[^<]*Report a Hazard/s);
  assert.match(markup, /href="#\/report-status"[^>]*>[\s\S]*?Track Report Status/);
  assert.match(markup, /Citizen access is limited to public reporting and status tracking/);
  assert.match(markup, />Staff Sign In</);
  assert.match(markup, />Email \/ Staff ID/);
  assert.match(markup, />Password/);
  assert.match(markup, />Sign In</);
  assert.match(markup, /Government Officers, ASHA Workers, and Water &amp; Sanitation Staff/);
  assert.match(markup, /<details[^>]*>[\s\S]*Demo Access for Evaluation/);
  assert.match(markup, /Hackathon testing only/);
});

test("citizen entry routes stay public without opening protected staff routes", () => {
  assert.equal(routePermission("citizen-report", "unauthenticated").outcome, "public");
  assert.equal(routePermission("report-status", "unauthenticated").outcome, "public");

  for (const route of ["overview", "asha", "water-operations", "staff-reports", "surveillance"]) {
    assert.deepEqual(
      routePermission(route, "unauthenticated"),
      { outcome: "redirect", route: "login" },
    );
  }
});

test("staff role destinations remain unchanged", () => {
  assert.equal(homeForRole("GOVT_OFFICER"), "overview");
  assert.equal(homeForRole("ASHA_WORKER"), "asha");
  assert.equal(homeForRole("WATER_WORKER"), "water-operations");
});
