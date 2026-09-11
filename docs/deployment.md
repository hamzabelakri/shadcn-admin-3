# Docker Deployment

The template builds into a small, production-ready image using a multi-stage `Dockerfile`: a Node stage compiles the Vite app, and an Nginx stage serves the static output.

[[toc]]

---

## 1. Verify the Dockerfile Exists

::: tip
Most clones of this template already include a `Dockerfile` in the project root. Check before creating a new one — a project-specific version may already have tweaks (build args, env injection, etc.) you don't want to overwrite.
:::

If it's missing, create `Dockerfile` in the project root with this configuration:

```dockerfile
# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# ---------- Stage 2: Nginx ----------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

The build stage installs dependencies and runs `npm run build`, producing static output in `/app/dist`. The Nginx stage discards everything else — Node, source files, `node_modules` — and only copies that `dist` folder into a lightweight Nginx image, keeping the final image small.

---

## 2. Verify `nginx.conf` Exists

The Dockerfile's Nginx stage expects an `nginx.conf` file in the project root and copies it in as the server config.

::: warning
This app is a client-side routed SPA (TanStack Router). Without a `try_files` fallback to `index.html`, refreshing the browser on any route other than `/` returns Nginx's 404 page instead of the app.
:::

If `nginx.conf` doesn't exist yet, create one in the project root:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

---

## 3. Build the Image

```bash
docker build -t <image-name>:<tag> .
```

Replace `<image-name>:<tag>` with something meaningful, e.g. `frontend-template:latest`.

---

## 4. Run It Locally to Verify

```bash
docker run -p 8080:80 <image-name>:<tag>
```

Visit `http://localhost:8080` — you should see the app served exactly as it will run in production.

---

## 5. Push to the Registry

::: tip
Ask your team lead for this project's exact GitLab Container Registry path — it typically follows `registry.<gitlab-host>/<group-path>/<project>`.
:::

```bash
docker tag <image-name>:<tag> <registry-path>:<tag>
docker push <registry-path>:<tag>
```

---

## Common Mistakes to Avoid

* ❌ **Missing `nginx.conf`**: Building the image without a valid `nginx.conf` either fails the build (`COPY` can't find the file) or ships a server that 404s on any client-side route.
* ❌ **No `try_files` Fallback**: An `nginx.conf` without `try_files $uri /index.html;` breaks deep links and page refreshes on any route besides `/`.
* ❌ **Untagged Images**: Pushing without a meaningful `<tag>` (or always using `latest`) makes it hard to trace which image version is actually running in an environment.
* ❌ **Copying `node_modules` into the Final Image**: If a custom Dockerfile skips the multi-stage split, the final image balloons in size — the whole point of Stage 2 is to leave Node and `node_modules` behind.