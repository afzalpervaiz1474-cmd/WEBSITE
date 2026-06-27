# React + Vite 

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Render deployment

This project is configured for Render deployment using `render.yaml`.

1. Connect your GitHub repo `afzalpervaiz1474-cmd/WEBSITE` to Render.
2. Create a new Web Service with branch `main`.
3. Use the default build command from `render.yaml`: `npm install && npm run build`.
4. Use the start command from `render.yaml`: `npm run start`.
5. Add a Render environment variable for `JWT_SECRET`.
6. Keep local `.env` files out of Git and use `.env.example` as a template.
