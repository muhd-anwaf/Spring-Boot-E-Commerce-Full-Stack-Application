# Spring Boot E-Commerce

A full-stack e-commerce project with a React storefront and a Spring Boot REST API backed by PostgreSQL. The storefront provides a responsive product-catalog experience; the API also contains account, cart, address, order, and product-management capabilities.

> **Project status:** The current frontend is focused on browsing the catalog. The cart buttons are not connected to the cart API, and there are no sign-in or checkout screens yet. The backend endpoints described below can be used independently.

## Contents

- [Highlights](#highlights)
- [Application design](#application-design)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Running the application](#running-the-application)
- [API overview](#api-overview)
- [Project layout](#project-layout)
- [Validation](#validation)
- [Production considerations](#production-considerations)

## Highlights

### Storefront

- Loads products from the backend and displays them in a responsive card grid.
- Searches by keyword, filters by category, and toggles price sort order. Search and filter state is represented in the URL query string.
- Opens a product detail dialog with the product image, description, price, and stock availability.
- Shows loading and request-error states while products are fetched.
- Uses Redux for product and request state, with Axios for API calls.

### Backend capabilities

- Product and category catalog endpoints, including paginated and sortable product results.
- User registration, sign-in, sign-out, and JWT-based authentication.
- Cart operations for adding products, changing quantities, retrieving a cart, and removing items.
- Address management and order placement with payment metadata.
- Product image upload and static image serving.
- OpenAPI documentation through Swagger UI.

The backend includes payment data structures and accepts payment-related metadata when an order is placed. A payment-provider integration is not demonstrated in this codebase.

## Application design

The storefront uses a clean catalog layout: an amber page surface frames white product cards, with slate-toned text and borders for contrast. Product imagery is presented in a contained square area, with prices and availability emphasized below the product description. The card grid adapts from smaller screens to two, three, or four columns as the viewport grows.

The filter controls are grouped in a white toolbar. They include product search, a category selector, a sort-order toggle, and a clear-filters action. The interface uses Montserrat, Tailwind CSS utilities, and Material UI controls; product details appear in a Headless UI dialog.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Redux Toolkit, Axios |
| UI | Tailwind CSS 4, Material UI, Headless UI, React Icons |
| Backend | Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security |
| Authentication | JWT (JJWT), BCrypt password encoding |
| Database | PostgreSQL |
| API documentation | Springdoc OpenAPI / Swagger UI |
| Build and validation | Maven, npm, ESLint |

## Architecture

```text
Browser
  |
  v
React + Vite storefront
  |  URL-driven search and filters
  |  Redux product state
  |  Axios requests to /api
  v
Spring Boot REST API
  |-- Controllers       HTTP endpoints
  |-- Services          Business operations
  |-- Repositories      Spring Data JPA access
  |-- Entities          Relational domain model
  |-- Security          JWT authentication and authorization rules
  v
PostgreSQL

Product images: backend image directory, served from /images/
```

The backend follows a controller/service/repository structure. Request and response payloads are represented by DTOs, with JPA entities providing persistence mappings.

## Data model

Hibernate manages the relational schema from the JPA entities. The main domain tables and relationships are:

| Entity | Purpose and relationships |
| --- | --- |
| `users`, `roles`, `user_role` | User accounts and their assigned roles (`ROLE_USER`, `ROLE_SELLER`, `ROLE_ADMIN`). |
| `categories`, `products` | Categories contain products. Products have a seller, stock quantity, price, discount, and special price. |
| `carts`, `cart_items` | A user has a cart; each cart item references a product and stores quantity and pricing information. |
| `addresses` | Addresses belong to users and may be referenced by orders. |
| `orders`, `order_items` | Orders contain product line items and reference an address and payment record. |
| `payments` | Payment method and payment-provider response metadata associated with an order. |

The default configuration uses `spring.jpa.hibernate.ddl-auto=update`, so Hibernate updates the schema at startup. No database migration tool or migration scripts are currently included.

## Getting started

### Prerequisites

- Java 17
- Maven 3.6.3 or newer
- Node.js and npm
- PostgreSQL

### Configure PostgreSQL and the JWT secret

Create a PostgreSQL database named `sb_ecom`, or set a different JDBC URL using the environment variable below. The backend reads standard Spring datasource environment variables. `JWT_SECRET` must be a Base64-encoded secret with at least 256 bits of key material.

In PowerShell, configure the values for the terminal session that will run the backend:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/sb_ecom"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "<your-postgres-password>"
$env:JWT_SECRET = "<base64-encoded-secret>"
```

Use your own database credentials and secret; do not commit them to the repository.

### Configure the frontend

The frontend includes [`frontend/.env.example`](frontend/.env.example). Copy it to `.env` if you need to change the API address:

```powershell
Copy-Item .env.example .env
```

Set `VITE_BACK_END_URL` in that file to the backend origin. The example value is `http://localhost:8080`.

## Running the application

Run the backend and frontend in separate terminals from the repository root.

### Backend

```powershell
cd backend
mvn spring-boot:run
```

The API is available at `http://localhost:8080`. Swagger UI is available at `http://localhost:8080/swagger-ui/index.html`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the local storefront URL when it starts; the configured default is `http://localhost:5173`.

## API overview

All routes are prefixed with `/api`. Routes under `/api/public` and `/api/auth` are configured for unauthenticated access. Other API routes require authentication. The backend accepts JWT authentication for protected requests.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/public/products` | List products; supports `keyword`, `category`, `pageNumber`, `pageSize`, `sortBy`, and `sortOrder` query parameters. |
| `GET` | `/public/categories` | List categories with pagination and sorting. |
| `GET` | `/public/categories/{categoryId}/products` | List products in a category. |
| `POST` | `/auth/signup` | Register an account. |
| `POST` | `/auth/signin` | Sign in and issue the JWT cookie. |
| `POST` | `/auth/signout` | Clear the JWT cookie. |
| `GET` | `/carts/users/cart` | Retrieve the authenticated user's cart. |
| `POST` | `/carts/products/{productId}/quantity/{quantity}` | Add a product to the cart. |
| `PUT` | `/cart/products/{productId}/quantity/{operation}` | Change a cart product quantity. |
| `DELETE` | `/carts/{cartId}/product/{productId}` | Remove a product from a cart. |
| `GET`, `POST`, `PUT`, `DELETE` | `/addresses` and `/users/addresses` | Manage and retrieve addresses. |
| `POST` | `/order/users/payments/{paymentMethod}` | Place an order using the supplied address and payment metadata. |
| `POST` | `/admin/categories/{categoryId}/product` | Add a product to a category. |
| `PUT`, `PATCH`, `DELETE` | `/admin/products/{productId}` | Update, re-categorize, or delete a product. |
| `PUT` | `/products/{productId}/image` | Upload a product image. |

Product listing defaults to page `0`, page size `50`, and ascending sort order. See the Swagger UI for request and response schemas.

## Project layout

```text
.
├── backend/
│   ├── src/main/java/com/ecommerce/project/
│   │   ├── config/          # Spring and OpenAPI configuration
│   │   ├── controller/      # REST endpoints
│   │   ├── model/           # JPA entities
│   │   ├── payload/         # API DTOs
│   │   ├── repositories/    # Spring Data repositories
│   │   ├── security/        # JWT and Spring Security
│   │   └── service/         # Business logic and image handling
│   └── src/main/resources/  # Application configuration
└── frontend/
    ├── src/api/             # Axios API client
    ├── src/components/      # Catalog, filter, product card, and dialog
    └── src/store/           # Redux store, reducers, and actions
```

## Validation

Run the backend tests from `backend`:

```powershell
mvn test
```

Run the frontend lint and production build from `frontend`:

```powershell
npm run lint
npm run build
```

## Production considerations

The repository is configured for local development. Before deploying it, replace development seed accounts, use managed secrets and production database credentials, configure the frontend origin and image storage for the target environment, and review authentication, authorization, and payment-provider requirements. The current frontend does not yet provide account, cart, or checkout flows.
