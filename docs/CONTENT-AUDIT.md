# Bilingual demo content review — 2026-10-21

Reviewed the running app with Playwright MCP in Arabic and English, using guest, company, complete talent and incomplete talent accounts. Preserved the existing layout, theme and deferred controls.

## Coverage

All 17 route families were opened in both languages, including these seeded variants:

| Area | Screens and content checked |
| --- | --- |
| Public/auth | Landing, About, sign-in, signup, role and authentication prompts |
| Community | Feed, q1–q3 detail, answers and accepted answer, sidebar, empty-answer states, ask form/code placeholder |
| Problems | Feed/filters, p1–p4 detail, descriptions, deliverables, constraints, criteria, discussion and replies |
| Company | Welcome, My Problems, new/edit forms, contact fields, review pages for p1/p2/p3, closed/locked brief |
| Talent | Welcome, populated/empty profile, education/experience selections, My Applications, proposal form, saved draft and completeness gate |
| Restricted content | Company/selected-applicant private notes and company contacts, profile menu and notifications |

Browsed long pages and inspected representative full-page screenshots, including the English profile, application review, Arabic applications and private details. Bilingual company-name fields intentionally show both translations. Code, addresses, product names, skill tags and algorithm identifiers are intentionally not translated.

## Corrections

- Added stored English translations for seeded proposals, rejection feedback, private notes and talent names/background; kept Arabic profile data when saving the English profile.
- Translated education/experience labels, categories, company/status badges, avatar initials, durations, upload hints and form examples. Fixed a seed education value that did not match any profile option.
- Made seeded proposals specific to each problem, replaced generic private notes with relevant synthetic details, and gave the rejected proposal constructive feedback.
- Aligned Arabic/English technical requirements: Type K oven sensing, digital DS18B20 interference, packaging-line terminology, vibration evaluation and offline inventory conflict handling. Removed raw LaTeX, redundant English prose in Arabic and unsupported prediction/zero-loss promises.
- Replaced personal-looking portfolio links and nonexistent CV claims with neutral examples; supplied explicitly synthetic company contacts.
- Removed only posts created by earlier assistant smoke checks from the preview feeds, with local backups and exact author/title guards. Retained registered accounts and unrelated records.

## Verification

Frontend and API builds pass. The 20-check API integration suite passes; the focused seed check additionally verifies concurrent upgrades, bilingual values and preservation of edited content. Lint exits successfully with three existing warnings. The frontend build retains its existing bundle-size advisory.

The additive migration and explicit seed upgrade were applied to development and packaged demo databases. No dependency installation was required. Seed upgrades compare original values and record their revision; they do not reset decisions or translate arbitrary user content.
