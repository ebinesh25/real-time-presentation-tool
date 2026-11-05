# real-time-presentation-tool

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Sw3hW6danZmuUn5R5h8p0hOxIcsl)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Apply the SQL migration in `migrations/0001_presentation_owners.sql` to the configured PostgreSQL database before uploading presentations. PowerPoint conversion uses the bundled LibreOffice WebAssembly runtime; no system LibreOffice installation is required.

An upload creates a presenter session in the uploader's browser and a separate `/join/<id>` link for viewers. Presenter access is tied to that browser and hostname; clearing its cookies or switching devices loses access. Viewers can download the original PowerPoint for new uploads. Presentations uploaded before this feature only have the converted PDF and cannot be assigned to an uploader automatically.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
