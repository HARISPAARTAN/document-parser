// End-to-end smoke test for the document parser. No dependencies beyond Node 18+.
//
//   1. writes a one-page text PDF by hand (Helvetica, BT ... Tj ET lines),
//   2. starts `node server/index.js` on PORT=5055,
//   3. GET /                      -> the built React client is served,
//   4. POST /api/upload-document  -> multipart (document = the PDF, documentType = passport)
//                                    returns success: true with surname and given name extracted,
//   5. stops the server.
//
// Run `npm run build` first (client/build/index.html must exist), then:  node tests/smoke.mjs
// The last line printed on success is:  smoke ok: surname=DOE givenName=JOHN

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5055;
const BASE = `http://127.0.0.1:${PORT}`;
const UPLOADS = path.join(ROOT, 'server', 'uploads');

// Two properties of the unmodified app shape this PDF; the test works around them, it does not fix them.
//
// 1. Value capture: server/documentParser.js captures names with [A-Z\s]+, which also matches line
//    breaks. Bare lines "Surname: DOE" / "Given name: JOHN" are extracted as "DOE GIVEN NAME" and
//    "JOHN DATE OF BIRTH". Numbered fields, as on an EU driving licence ("1. Surname", "2. ..."), end
//    each value at the next field number, so the lines below extract cleanly.
// 2. Small files: pdf-parse bundles pdf.js 1.10, which can fail with "bad XRef entry" when given the
//    pooled Buffer that fs.readFileSync returns for a file under 4096 bytes (observed with a 635-byte
//    PDF). A comment line pads the PDF well past that size, so the server reads it into its own Buffer.
const FIELD_LINES = [
  '1. Surname: DOE',
  '2. Given name: JOHN',
  '3. Date of birth: 12/05/1990',
  '4. Expiry: 01/01/2030',
];
const MIN_PDF_BYTES = 8192;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pdfString(text) {
  return text.replace(/[\\()]/g, (c) => `\\${c}`);
}

// Minimal valid PDF: catalog, pages, one page, a content stream with one BT ... ET block per line,
// the standard Helvetica font, and a classic xref table with exact byte offsets (all ASCII).
function buildPdf(lines, minBytes) {
  const content =
    lines.map((text, i) => `BT /F1 14 Tf 72 ${720 - i * 24} Td (${pdfString(text)}) Tj ET`).join('\n') + '\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  pdf += `%${'-'.repeat(Math.max(0, minBytes - pdf.length))}\n`; // padding comment, ignored by readers
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const at of offsets) pdf += `${String(at).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

function expect(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function main() {
  const clientIndex = path.join(ROOT, 'client', 'build', 'index.html');
  if (!existsSync(clientIndex)) {
    throw new Error('client/build/index.html is missing - run `npm run build` first');
  }

  // Refuse to run if something already answers on the port, so that a reply always comes from our server.
  const taken = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) }).then(
    () => true,
    () => false,
  );
  if (taken) throw new Error(`port ${PORT} is already in use`);

  const uploadsExisted = existsSync(UPLOADS);
  let serverLog = '';
  let exited = null;
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stopped = new Promise((resolve) =>
    server.once('exit', (code, signal) => {
      exited = { code, signal };
      resolve();
    }),
  );
  server.stdout.on('data', (chunk) => (serverLog += chunk));
  server.stderr.on('data', (chunk) => (serverLog += chunk));
  process.once('exit', () => server.kill());

  try {
    // Wait until GET / answers.
    let home = null;
    for (const deadline = Date.now() + 30000; !home && Date.now() < deadline; ) {
      if (exited) throw new Error(`server exited early (code ${exited.code}, signal ${exited.signal})`);
      home = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
      if (!home) await sleep(200);
    }
    if (!home) throw new Error('server did not answer GET / within 30 s');

    expect(home.status, 200, 'GET / status');
    const html = await home.text();
    if (!html.includes('<div id="root">')) throw new Error('GET / did not return the client (no <div id="root">)');
    console.log('GET /  -> 200, client build served (<div id="root"> present)');

    const form = new FormData();
    form.append('document', new Blob([buildPdf(FIELD_LINES, MIN_PDF_BYTES)], { type: 'application/pdf' }), 'passport-sample.pdf');
    form.append('documentType', 'passport');
    const response = await fetch(`${BASE}/api/upload-document`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60000),
    });
    const raw = await response.text();
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(`POST /api/upload-document returned ${response.status}, not JSON: ${raw.slice(0, 200)}`);
    }
    if (response.status !== 200) {
      throw new Error(`POST /api/upload-document returned ${response.status}: ${JSON.stringify(body)}`);
    }
    expect(body.success, true, 'response.success');
    const fields = body.data && body.data.extractedData ? body.data.extractedData : {};
    console.log(`POST /api/upload-document -> 200, success: true, extractedData: ${JSON.stringify(fields)}`);
    expect(fields.surname, 'DOE', 'extractedData.surname');
    expect(fields.givenName, 'JOHN', 'extractedData.givenName');

    const leftovers = existsSync(UPLOADS) ? readdirSync(UPLOADS) : [];
    expect(leftovers.length, 0, 'files left in server/uploads after processing');
    console.log('server/uploads is empty after processing');

    return `smoke ok: surname=${fields.surname} givenName=${fields.givenName}`;
  } catch (error) {
    if (serverLog.trim()) console.error(`--- server output ---\n${serverLog.trim()}\n--- end server output ---`);
    throw error;
  } finally {
    if (!exited) {
      server.kill();
      await Promise.race([stopped, sleep(5000)]);
    }
    // Remove the empty uploads folder if this run created it.
    if (!uploadsExisted && existsSync(UPLOADS) && readdirSync(UPLOADS).length === 0) rmdirSync(UPLOADS);
  }
}

main().then(
  (summary) => console.log(summary),
  (error) => {
    console.error(`smoke FAILED: ${error.message}`);
    process.exitCode = 1;
  },
);
