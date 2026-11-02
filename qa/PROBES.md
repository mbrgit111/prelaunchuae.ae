# Probe vocabulary (every case carries one machine-checkable `probe`)

The runner (qa/run.mjs) executes the probe against http://localhost:3450 and fills `actual`, `status`, `evidence`.
Probe kinds:

1. HTTP (no browser):
   {"kind":"http","path":"/about","method":"GET","expectStatus":200,"redirectTo":"https://prelaunchuae.com/x"(optional),
    "bodyIncludes":["text"],"bodyExcludes":["Net Capital"],"bodyRegex":"...","bodyNotRegex":"...",
    "headers":{"content-type":"image/png"},"jsonPath":{"expr":"JSON expression over `body`, must be truthy"},
    "bodyJson":{...request body for POST...},"requestHeaders":{...}}
   For many paths at once use "paths":[...] (all must satisfy the same expectations).
2. UI (Playwright Chromium):
   {"kind":"ui","path":"/projects","viewport":"mobile|small|desktop",   // mobile 375x812, small 320x640, desktop 1440x900
    "steps":[{"do":"click|fill|press|goto|reload|back|hover|wait|scroll","sel":"css or text=...","value":"..."}],
    "expect":[{"type":"visible|hidden|text|textNot|count|attr|style|url|noOverflow|noConsoleErrors|noExternalRequests|focusable","sel":"css","value":"...","prop":"css prop for style","op":"eq|gte|lte|contains|regex"}],
    "shot":true}
   Selectors are your best reading of the source; the runner tells the designer when a selector matched nothing and the case is then corrected and noted (test error, not product bug).
3. Data (node, no server):
   {"kind":"data","expr":"JS expression, truthy = pass; variables: projects (raw data/remapp-projects.json .projects array), list (data/remapp-projects-list.json), index (parsed /projects-index.json array), sitemap (array of sitemap.xml paths), site (object of built html is NOT available)"}
4. Contrast (no browser):
   {"kind":"contrast","fg":"#0B1F33","bg":"#F4EFE6","min":4.5}
5. File:
   {"kind":"file","path":"public/favicon.svg","exists":true,"includes":["text"],"excludes":["text"],"regex":"..."}
6. Command:
   {"kind":"cmd","run":"npx vitest run","expectExit":0,"outIncludes":["80 passed"]}
