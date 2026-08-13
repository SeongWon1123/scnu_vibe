# Crawl Targets

## Scope and verification

This document is the source of truth for the six announcement-board targets used by Sunmoa. URL parameters, selectors, and verification findings must be updated here whenever the school site changes.

The list-page structure and fixture were last verified on **2026-08-13**. The site robots policy permits these announcement paths and disallows only `/upload/` and `/search/` for the generic user agent. This permission does not replace the operational limits in `CLAUDE.md`.

## Request policy

The production crawler must run only at 07:00, 12:30, and 18:30 KST, request one or two recent list pages per board, wait at least three seconds between requests, identify itself with a SunmoaBot contact string, and stop if robots policy or access behavior changes. Task 2 downloaded only the academic fixture and its invalid-parameter response, separated by three seconds.

## Board configuration

| Key | Label | Site path | mi | bbsId |
| --- | --- | --- | ---: | ---: |
| general | General notices | SCNU | 1131 | 1040 |
| academic | Academic | SCNU | 1132 | 1041 |
| scholarship | Scholarship | SCNU | 8690 | 4487 |
| event | Campus events | SCNU | 1188 | 1067 |
| recruit | Recruitment | SCNU | 1189 | 1068 |
| dorm | Dormitory | dorm | 1337 | 1126 |

## URL contract

List pages use the following pattern. Both `mi` and `bbsId` are mandatory.

```text
https://www.scnu.ac.kr/{site}/na/ntt/selectNttList.do?mi={mi}&bbsId={bbsId}
```

Missing `bbsId` returns HTTP 200 but an invalid-request page instead of a list. The Task 2 invalid fixture is 209 bytes and records this condition.

Canonical detail URLs use only `nttSn` and `mi`.

```text
https://www.scnu.ac.kr/{site}/na/ntt/selectNttInfo.do?nttSn={nttSn}&mi={mi}
```

## Observed list-page structure

| Data | Observed selector or pattern | Notes |
| --- | --- | --- |
| Listing row | `table tbody tr` | Ignore rows without a notice detail link. |
| Title link | `td.ta_l a` | The relative href contains `nttSn`, `mi`, and sometimes `currPage`. |
| Pinned marker | `a b.btn_S.btn_red` | The marker text must not become part of the title. |
| Author | `td.BD_listUser` | Trim surrounding whitespace. |
| Posting date | `YYYY.MM.DD` in row text | Normalize to `YYYY-MM-DD` in Task 3. |

## Fixtures

- `tests/fixtures/list-academic.html`: a real academic-board list page captured on 2026-08-13. It is used for parser development and must not be refreshed casually.
- `tests/fixtures/list-invalid.html`: the response for the academic list URL with `mi=1132` and missing `bbsId`. It protects the crawler against a false HTTP-200 success.

## Change history

| Date | Change |
| --- | --- |
| 2026-08-13 | Added six-board configuration, live academic fixture, invalid-response fixture, URL contract, and observed selectors. |
## Live parser validation

On 2026-08-13, one current list page per board was requested with the SunmoaBot user agent, a three-second pause between requests, and no pagination. Each response was HTTP 200 and `parseNoticeList` returned one or more rows.

| Board | Response bytes | Parsed rows | Pinned rows | Error |
| --- | ---: | ---: | ---: | --- |
| general | 114,640 | 10 | 0 | none |
| academic | 124,605 | 23 | 13 | none |
| scholarship | 115,478 | 11 | 1 | none |
| event | 113,399 | 10 | 0 | none |
| recruit | 114,854 | 10 | 0 | none |
| dorm | 46,507 | 19 | 9 | none |

The transient live responses are not committed. The academic and invalid-request fixtures remain the deterministic test inputs.