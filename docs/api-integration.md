# API integration status

The pinned Swagger snapshot has **128 REST paths, 146 operations and 312 schemas**. `npm run generate:api` creates `src/api/generated/openapi.ts` for every pinned REST operation. `npm run check:api` fails if a path or method is missing from that generated file. The live Swagger checked on 2026-11-10 has **139 paths, 158 operations and 331 schemas**. The pilot auth, `/users/me`, `/activity-feeds`, and `/posts/{id}` paths remain available. Other paths and schemas have changed; their adapters need a separate migration before regenerating the entire contract from the live file.

| Area | Generated contract | Connected to a real screen |
| --- | --- | --- |
| Auth login, logout and own profile | Yes | Yes for non-demo accounts |
| Activity feed and post detail | Yes | Read-only Feed for non-demo accounts |
| Question proposals and lecturer review | Yes | Yes in API sessions; demo sessions use a separate store |
| Practice by question set, answer, rate, report error and AI refine | Yes | Yes in API sessions |
| Games and badges | Yes | Yes in API sessions, except admin operations |
| Exams | Yes | Partly; existing code can fall back to demo data |
| Auth refresh and change password | Yes | No |
| Admin APIs | Yes, because they are in Swagger | No; the frontend does not invoke them |
| Post writes, reactions, comments, relations, chat, notifications, search, media, devices and cosmetics | Yes | No; demo interactions remain local |
| STOMP chat destinations | Listed in `src/api/realtime-contract.ts` | No |

The STOMP destinations and DTO names are written in OpenAPI `info.description`, not as machine-readable operations or component schemas. The documented publish fields are represented in `realtime-contract.ts`; broadcast payloads remain `unknown` until the backend publishes schemas. This avoids inventing fields and does not imply a working WebSocket connection.

Proposal and review screens go through `src/features/proposals/proposalGateway.ts`. A signed-in (API) session calls only the REST endpoints and shows backend errors as they are; it never falls back to demo data or reports a failed action as successful. A demo session uses only `src/features/proposals/demoStore.ts`, one store shared by the student and lecturer screens, so a demo proposal reaches the lecturer queue and approved questions appear in the student bank. Swagger has no endpoint for resolved-session history or for listing bank questions, so in API sessions the history tab only keeps sessions completed while it is open, and the student bank is still demo data. `src/api/exams.ts` still falls back to mock data on errors and has not been migrated yet.

Business rules kept by the UI: `POST /sessions/approve` is the lecturer choosing questions into the subject's exam bank (APPROVED questions of a subject; shared by its lecturers). Lecturers can collect questions from several students' sets in a basket and approve them in one call. Students never see which of their questions were chosen: student screens show only the set status, practice shows every question of a resolved set, and the question source (AI or human) is not displayed. `practiceGateway.ts` serves profile question sets and practice; AI refine uses `ai-refine` then `ai-apply`. Swagger has no JSON listing of the exam bank, so in API sessions the lecturer bank page links to automatic exam generation and bank export instead of listing questions.

Games follow Swagger, not older written specs: Game 3 has no endpoint (it is the author confidence sent when proposing questions), there is no Minigame 3 popularity game, and lecturers do not resolve games manually. Lecturers only review Game 5 error reports; Swagger has no endpoint listing all reports, so in API sessions the lecturer looks reports up by question ID (`GET /questions/{id}/ratings`, filtered by `is_error`). The review body uses the Swagger field name `is_comfirmed` as spelled.

`src/features/demo/components/modals/ApiReferenceModal.tsx` is an older UI demo map. It is not an API contract or a list of completed integrations.

Demo Feed/Profile create, edit, delete, comment, reply, media preview and friend-first ordering remain local interactions. For a non-demo account, login loads `/users/me`; Feed reads `/activity-feeds` by cursor and resolves post events with `/posts/{id}`. That Feed has no local write actions. The current activity-feed contract has no friend-first sorting option, so the API Feed preserves the backend's order.

Demo chat conversations are visible only to their listed participants, and demo messages are shared between those participants. Demo chat and feed changes synchronize between open same-origin browser tabs with `BroadcastChannel`; they are not persisted by a server and do not synchronize across devices. API chat is not connected. The documented STOMP chat destinations alone do not provide a working connection, and the current contract does not define a feed push destination.

The Push tab in Settings currently stores the six notification preferences in browser `localStorage` and an optional voice recording in IndexedDB. This is local-only configuration: it does not register a push subscription, send or receive system notifications, or synchronize settings between browsers/devices. Real push delivery, per-event server preferences, and delivery of a user's voice recording require backend API support.

When a feature is connected, use the typed `api` client with its exact Swagger path and method, handle the `code/message/data` envelope through `expectEnvelope`, then update this table. Multipart endpoints require the `multipartBody` serializer. Export endpoints currently return a download URL in a JSON envelope rather than a binary response.
