# Application Architecture

The frontend template is organized around a small number of core responsibilities:

* Application initialization
* Routing
* Authentication
* Server-state management
* UI and layout
* Theming
* Notifications and error handling

The application is composed by combining these responsibilities rather than putting all functionality into a single layer.

## High-level architecture

At startup, the application initializes its global providers before rendering the router.

The current provider hierarchy is:

```text
React Strict Mode
└── Query Client Provider
    └── Theme Provider
        └── Font Provider
            └── Direction Provider
                └── Alert Provider
                    └── Router Provider
```

Each provider has a specific responsibility.

| Provider              | Responsibility                                     |
| --------------------- | -------------------------------------------------- |
| Query Client Provider | Provides TanStack Query throughout the application |
| Theme Provider        | Controls the application theme                     |
| Font Provider         | Controls the application's font configuration      |
| Direction Provider    | Supports layout direction such as LTR/RTL          |
| Alert Provider        | Provides application-wide alert functionality      |
| Router Provider       | Handles application routing                        |

This hierarchy is defined during the application's entry-point initialization.

## Application initialization

The application entry point creates the router and supplies the TanStack Query client to it.

The router uses the generated route tree and is configured to preload routes when navigation is intended.

The application also imports the global styles and internationalization setup during initialization.

The important principle for developers is:

> Global application services are initialized once at the application root and made available to the rest of the application through providers.

Developers should therefore avoid creating separate global providers inside individual pages unless there is a specific architectural reason to do so.

## Routing architecture

Routing is based on TanStack Router.

The route tree is generated from the files inside the routes directory.

Routes are therefore not registered manually in a central routing configuration. Instead, developers create route files following the project's routing conventions.

The application currently contains an authenticated route group:

```text
routes/
├── __root.tsx
└── _authenticated/
    ├── route.tsx
    ├── index.tsx
    └── errors/
        └── $error.tsx
```

The `_authenticated` route acts as the authentication boundary for pages placed underneath it.

## Authentication boundary

The `_authenticated` route checks the persisted authentication state before rendering its children.

If the authentication information is missing or no valid token is found, the user is redirected to:

```text
/sign-in
```

This means developers can place pages inside the `_authenticated` route group when those pages should only be accessible to authenticated users.

See [Protected Routes](../authentication/protected-routes.md) for the practical procedure.

## Application-wide error handling

The root route defines default handling for:

* Not found errors
* General application errors

The application also provides dedicated error pages for common HTTP/application error states.

These include:

* Unauthorized
* Forbidden
* Not found
* Internal server error
* Maintenance

Error pages are handled through the application's error route rather than requiring every individual page to implement its own complete error-page layout.

## Development tools

During development, the application exposes:

* TanStack Query Devtools
* TanStack Router Devtools

These tools are rendered only in development mode.

They should be used to inspect routing behavior and server-state/query behavior while developing features.

## Architecture principle

When adding functionality, first determine **which responsibility the functionality belongs to**.

For example:

| Requirement                 | Appropriate area                   |
| --------------------------- | ---------------------------------- |
| New page                    | `routes/` + feature/page component |
| Reusable UI element         | `components/`                      |
| Server data                 | TanStack Query                     |
| Protected page              | `_authenticated` route tree        |
| Application theme           | Theme system                       |
| Global alert                | Alert system                       |
| HTTP/application error page | Error handling system              |

Avoid solving application-wide problems locally inside individual pages when the template already provides a shared mechanism.

