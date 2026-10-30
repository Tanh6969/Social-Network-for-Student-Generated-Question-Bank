# API integration status

The pinned Swagger snapshot has **128 REST paths, 146 operations and 312 schemas**. `npm run generate:api` creates `src/api/generated/openapi.ts` for every REST operation. `npm run check:api` fails if a path or method is missing from that generated file.

| Area                                                                                                                                 | Generated contract                       | Connected to a real screen             |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------- |
| Auth login and logout                                                                                                                | Yes                                      | Yes                                    |
| Auth refresh and change password                                                                                                     | Yes                                      | No                                     |
| Admin APIs                                                                                                                           | Yes, because they are in Swagger         | No; the frontend does not invoke them  |
| Social, question bank, review, exams, games, relations, chat, notifications, search, media, devices, cosmetics and other REST groups | Yes                                      | No; current screens remain demo driven |
| STOMP chat destinations                                                                                                              | Listed in `src/api/realtime-contract.ts` | No                                     |

The STOMP destinations and DTO names are written in OpenAPI `info.description`, not as machine-readable operations or component schemas. The documented publish fields are represented in `realtime-contract.ts`; broadcast payloads remain `unknown` until the backend publishes schemas. This avoids inventing fields and does not imply a working WebSocket connection.

`src/features/demo/components/modals/ApiReferenceModal.tsx` is an older UI demo map. It is not an API contract or a list of completed integrations.

The social Feed/Profile create, edit, delete, comment, reply, media preview and friend-first ordering are local demo interactions. They do not call the post, comment, friendship or activity-feed endpoints. The current `GET /activity-feeds` contract exposes cursor pagination but no friend-first sorting option; that ordering needs backend support before it can be guaranteed across all pages of real data.

Demo chat conversations are visible only to their listed participants, and demo messages are shared between those participants. Demo chat and feed changes synchronize between open same-origin browser tabs with `BroadcastChannel`; they are not persisted by a server and do not synchronize across devices. API chat and feed screens are still not connected. The documented STOMP chat destinations alone do not provide a working connection, and the current contract does not define a feed push destination.

The Push tab in Settings currently stores the six notification preferences in browser `localStorage` and an optional voice recording in IndexedDB. This is local-only configuration: it does not register a push subscription, send or receive system notifications, or synchronize settings between browsers/devices. Real push delivery, per-event server preferences, and delivery of a user's voice recording require backend API support.

When a feature is connected, use the typed `api` client with its exact Swagger path and method, handle the `code/message/data` envelope through `expectEnvelope`, then update this table. Multipart endpoints require the `multipartBody` serializer. Export endpoints currently return a download URL in a JSON envelope rather than a binary response.
