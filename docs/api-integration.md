# API integration status

The pinned Swagger snapshot was refreshed on 2026-11-14 and has **150 REST paths, 172 operations and 345 schemas**. `npm run generate:api` creates `src/api/generated/openapi.ts`; `npm run check:api` verifies that every pinned path and method is represented. Non-admin screens use only the operations needed by their features, not all 172 operations.

| Area | Generated contract | Connected to a real screen |
| --- | --- | --- |
| Auth login, logout and own profile | Yes | Yes for non-demo accounts |
| Activity feed, posts, reactions, comments and media upload | Yes | Yes for API accounts, including cursor pages, new activity count, comment edit/delete and lecturer notes |
| User profiles and relationships | Yes | Yes for API accounts, including paginated `/users/{userId}/posts` and profile photos |
| Question proposals and lecturer review | Yes | Yes in API sessions; demo sessions use a separate store |
| Practice by question set, answer, rate, report error and AI refine | Yes | Yes in API sessions |
| Games and badges | Yes | Yes in API sessions, including badge catalog/user badges and real feed widgets; admin operations excluded |
| Exams | Yes | API flows use typed endpoints; individual legacy screens still need a separate audit |
| Auth refresh and change password | Yes | No |
| Admin APIs | Yes, because they are in Swagger | No; the frontend does not invoke them |
| Chat, notifications, full search, reports and cosmetics | Yes | API sessions use REST and STOMP for the implemented flows; demo sessions remain local |
| Lecturer course classes and video posts | Yes | API sessions use their Swagger endpoints |
| Devices and remaining account settings | Yes | Not yet connected |
| STOMP chat destinations | Listed in `src/api/realtime-contract.ts` | Direct chat connects to `/api/v1/ws`; group administration and attachments are not yet implemented |

The STOMP destinations and DTO names are written in OpenAPI `info.description`, not as machine-readable operations or component schemas. The direct chat client publishes text to `/app/chat.send`, read receipts to `/app/chat.read`, and listens on `/user/queue/messages`. Realtime behavior still needs a two-account browser test against the deployed backend.

Proposal and review screens go through `src/features/proposals/proposalGateway.ts`. A signed-in (API) session calls only the REST endpoints and shows backend errors as they are; it never falls back to demo data or reports a failed action as successful. A demo session uses only `src/features/proposals/demoStore.ts`, one store shared by the student and lecturer screens, so a demo proposal reaches the lecturer queue and approved questions appear in the student bank. Swagger has no endpoint for resolved-session history or for listing bank questions, so in API sessions the history tab only keeps sessions completed while it is open, and the student bank is still demo data. `src/api/exams.ts` still falls back to mock data on errors and has not been migrated yet.

Business rules kept by the UI: `POST /sessions/approve` is the lecturer choosing questions into the subject's exam bank (APPROVED questions of a subject; shared by its lecturers). Lecturers can collect questions from several students' sets in a basket and approve them in one call. Students never see which of their questions were chosen: student screens show only the set status, practice shows every question of a resolved set, and the question source (AI or human) is not displayed. `practiceGateway.ts` serves profile question sets and practice; AI refine uses `ai-refine` then `ai-apply`. Swagger has no JSON listing of the exam bank, so in API sessions the lecturer bank page links to automatic exam generation and bank export instead of listing questions.

Games follow Swagger, not older written specs: Game 3 has no endpoint (it is the author confidence sent when proposing questions), there is no Minigame 3 popularity game, and lecturers do not resolve games manually. Lecturers only review Game 5 error reports; Swagger has no endpoint listing all reports, so in API sessions the lecturer looks reports up by question ID (`GET /questions/{id}/ratings`, filtered by `is_error`). The review body uses the Swagger field name `is_comfirmed` as spelled.

`src/features/demo/components/modals/ApiReferenceModal.tsx` is an older UI demo map. It is not an API contract or a list of completed integrations.

Demo Feed/Profile create, edit, delete, comment, reply, media preview and friend-first ordering remain local interactions. For an API account, login loads `/users/me`, Feed reads `/activity-feeds`, `/posts/me` and public post search, resolves post events with `/posts/{id}`, then fetches subsequent cursor pages on scroll. The activity-feed contract has no global friend-first sorting option, so exact ordering across all server pages remains a backend/product decision. Profile name, bio, avatar and cover now save through `PUT /users/me`; faculty/class fields are read-only in API mode because the update contract does not accept them. Photo cropping is rendered into the uploaded file. The backend has no old-profile-photo listing, so API mode shows current photos and post photos only.

Demo chat conversations are visible only to their listed participants, and demo messages are shared between those participants. Demo chat and feed changes synchronize between open same-origin browser tabs with `BroadcastChannel`; they are not persisted by a server and do not synchronize across devices. API direct chat lists conversations and history via REST and sends text through STOMP. The feed uses `GET /activity-feeds/new-count` every 30 seconds while visible; the contract does not define a feed push destination.

The Push tab in Settings currently stores the six notification preferences in browser `localStorage` and an optional voice recording in IndexedDB. This is local-only configuration: it does not register a push subscription, send or receive system notifications, or synchronize settings between browsers/devices. Real push delivery, per-event server preferences, and delivery of a user's voice recording require backend API support.

When a feature is connected, use the typed `api` client with its exact Swagger path and method, handle the `code/message/data` envelope through `expectEnvelope`, then update this table. Multipart endpoints require the `multipartBody` serializer. Export endpoints currently return a download URL in a JSON envelope rather than a binary response.
