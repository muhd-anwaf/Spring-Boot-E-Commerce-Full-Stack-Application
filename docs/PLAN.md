# Implementation Plan

## Current state (discovered)

**Stack.** Backend: Java 17 / Spring Boot 3.2.5, Spring Data JPA, Spring Security with JWT (JJWT), PostgreSQL, ModelMapper, springdoc Swagger UI. Frontend: React 19, Vite, Redux Toolkit (hand-written reducers), React Router 7, Axios, Tailwind 4, MUI, Headless UI, react-hot-toast (installed, unused).

**Run.** Backend `mvn spring-boot:run` (needs PostgreSQL `sb_ecom`, env `DB_PASSWORD`, `JWT_SECRET`). Frontend `npm run dev` (needs `VITE_BACK_END_URL`).

**Backend API (existing).** Auth (`/api/auth/signin|signup|signout|user|username`), categories, products (list/filter/page/sort, admin CRUD, image upload), cart (add/list/update/delete), addresses CRUD, order placement (`POST /api/order/users/payments/{method}`). See README for the final table.

**Frontend (existing).** One page: product grid with search, category filter (hard-coded list), sort toggle, product modal. No auth, cart, checkout, orders, profile, admin, 404, navbar/footer, pagination UI (empty `Pagination.jsx`).

## Gaps and bugs found

Backend:
1. No role enforcement: any logged-in user can call `/api/admin/**`; signup accepts `role: admin`; category create/update are public.
2. Address/cart endpoints lack ownership checks; `GET /addresses` and `GET /carts` expose every user's data.
3. Missing endpoints: product detail, order history/detail, user profile, admin orders/users.
4. `placeOrder` does not re-check stock or address ownership.
5. Sign-in returns the whole cookie string as `jwtToken`; bad login returns 404; successful GETs return 302; empty lists throw 400.
6. DTOs have no validation; `updateProduct` does not recompute special price; unhandled exceptions give 500s; `sortBy` not whitelisted.
7. CORS rejects `PATCH` and is not wired into the security chain; cookie is not HttpOnly; cookie and token lifetimes differ.
8. Seed users with fixed passwords are created on every start; debug logging and `show-sql` are on; no `.env.example`; only a `contextLoads` test (needs live Postgres).

Frontend: everything except the catalog (see above), plus categories hard-coded, `sortOrder=null` sent on first load, error view always says "404", no API interceptors.

## Assumptions
- Keep the stack and the existing component styles; new Redux code uses `createSlice`/`createAsyncThunk`.
- Auth: the SPA stores the JWT in `localStorage` and sends `Authorization: Bearer` (the server also sets an HttpOnly cookie). Cart is the server-side cart, so it persists per account; guests are sent to log in when adding to cart.
- Payments are mock/test mode only (a "Mock payment" method; the server records the result). No real provider is added.
- Admin = `ROLE_ADMIN`. Sellers keep their role but have no extra permissions yet.
- Seed data (demo users, categories, products) is opt-in via `APP_SEED_ENABLED=true`; demo passwords come from config.
- A zero-setup `h2` Spring profile is added so the app and tests run without PostgreSQL. PostgreSQL remains the default/production database.
- No pushes; work stays on `feature/complete-frontend`.

## Ordered tasks
1. Backend config: env-based properties, `.env.example`, docker-compose for Postgres, `h2` profile, opt-in seeding.
2. Backend security: role rules, signup fix, JWT/cookie fixes, CORS, JSON 401/403.
3. Backend API gaps: validation, error handler, product detail, ownership checks, orders, users, admin endpoints, stock re-check.
4. Backend tests (MockMvc + H2): auth, products, cart, orders, authorization.
5. Frontend foundation: API client with interceptors, store slices, router, layout (navbar, footer), 404, shared components.
6. Frontend features: auth pages, product list pagination + detail, cart, checkout, orders, profile.
7. Admin area: products, categories, orders, users.
8. Frontend tests (Vitest + Testing Library), lint, build.
9. Run both apps and verify the full flow.
10. README, LICENSE, CONTRIBUTING, root scripts, final report.
