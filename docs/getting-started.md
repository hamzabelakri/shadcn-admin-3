# Getting Started

This page walks you through cloning the template from GitLab and getting a local instance running. If you're new to the template's architecture rather than its setup, start with the [Introduction](./introduction) instead.

[[toc]]

---

## Prerequisites

* **Node.js** (LTS version) and **npm**.
* Access to the team's **GitLab** project.
* A valid `.env` configuration for the API you're pointing the template at (ask your team lead if you don't have one).

::: tip
Already set up? Jump straight to [Starting a New Feature](#_5-starting-a-new-feature).
:::

---

## 1. Clone the Repository

```bash
git clone git@git.asteroidea.co:internal-tools/dev-templates/astro-template/react-shadcn-gin-go-template/astro-react-vite-shadcn.git
cd astro-react-vite-shadcn
```

::: warning Always use the latest branch
The repository has multiple branches. Never build off `main`/`master` — always work off the **latest** branch.
:::

List the branches by commit date, then check out the top result:

::: code-group

```bash [list branches]
git branch -r --sort=-committerdate
```

```bash [checkout latest]
git checkout <latest-branch-name>
```

:::

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

If the repo includes a `.env.example` file, copy it:

```bash
cp .env.example .env
```

::: details `.env.example` not present?
Create `.env` yourself in the project root instead — same variables, just typed out manually.
:::

At minimum, set the API base URL the central Axios instance will call (see [Data Fetching & State](./architecture/data-fetching)):

```
VITE_API_URL = https://api.example.com
```

---

## 4. Run the Development Server

```bash
npm run dev
```

The app will be available locally, with hot module reloading enabled through Vite.

---

## 5. Starting a New Feature

Once the app is running, the fastest way to bootstrap a new feature is to copy the `src/apps/users` folder as a reference — it implements every pattern documented in this guide (service layer, hooks, store, columns, toolbar, and modals) end to end. Rename it, adjust the model/service to your entity, and follow the [Core Architecture](./architecture/data-fetching) guides for each layer as you go.

---

## Next Steps

* **[Introduction](./introduction)** — what the template includes and how the docs are organized.
* **[Data Fetching & State](./architecture/data-fetching)** — the first architecture guide to read.
* **[Docker Deployment](./deployment)** — build and push the app once it's ready to ship.