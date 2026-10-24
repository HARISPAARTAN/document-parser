# Document parser

Upload a PDF passport, national ID card or driving licence and get the key fields (surname, given name, date of birth, issue and expiry dates, document number) extracted into an editable form.

Node/Express API with React front end. Fields are found with labelled-text patterns over the PDF's text layer; a confidence score reports how many required fields were filled.

## How it works

1. The React client (`client/`) takes a PDF by drag-and-drop or file picker and posts it with the document type to the API.
2. `server/index.js` receives the upload with multer (PDF only, 10 MB limit), calls the parser and deletes the uploaded file afterwards.
3. `server/documentParser.js` reads the text layer with `pdf-parse`, matches labelled fields (`Surname:`, `Given name:`, `Date of birth:`, ...) per document type, normalises dates, and returns the fields with a confidence score. If fewer than three fields are found it tries a `tesseract.js` OCR pass as a fallback.
4. The client shows the fields in a form you can correct.

## Run it

Requires Node 18 or newer.

```bash
npm run install-all   # installs server and client dependencies
npm run build         # builds the React client into client/build
npm run server        # starts the API and serves the client on http://localhost:5000
```

For development with hot reload: `npm run dev` (API on 5000, client on 3000 with a proxy).

## API

| Method and path | Body | Response |
|---|---|---|
| `POST /api/upload-document` | multipart: `document` (PDF), `documentType` (`passport`, `nationalId` or `license`) | `{ success, data: { documentType, extractedData, confidence, rawText } }` |
| `GET /*` | | the built client |

## Status

Verified on 2026-10-24 on Windows with Node 22 (`node tests/smoke.mjs`): dependencies installed, client built, server started, `GET /` served the client, and a generated one-page text PDF returned `surname DOE`, `givenName JOHN` and the dates. The smoke test writes the PDF by hand and needs no extra packages.

## Limitations

- Only PDFs with a text layer are verified. The tesseract.js fallback is wired in, but tesseract.js does not read PDF files directly, so scanned, image-only documents are not supported yet.
- Field labels are matched in English (surname, given name, date of birth, expiry, issue date, passport or ID number).
- Dates are read as day/month/year or year-month-day.

## Licence

MIT, see `LICENSE`.
