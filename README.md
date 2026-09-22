This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Test the database connection

1. Open PowerShell in `C:\Users\User\Desktop\stocks_app`.
2. Run `node --version`. The database test uses native TypeScript support; use Node.js 22.18+ or 24+ (verified with 24.19.0).
3. If dependencies are not installed, run `npm install`.
4. Confirm the root `.env` file contains `MONGODB_URI` with your MongoDB connection string. Keep the value private. The test loads environment files using Next.js rules and defaults to development; existing shell variables and higher-priority environment files can override `.env`.
5. Run `npm run test:db`.
6. Look for all four `PASS` lines and `Database connection test passed`. In PowerShell, `$LASTEXITCODE` should be `0`.

The test calls the actual `database/mongoose.ts` helper, checks the connection state, sends `{ ping: 1 }`, verifies connection reuse, and disconnects. It does not read or modify documents, so it does not verify collection read/write permissions or application queries. No development server is required.

If it fails, check the reported stage: confirm `MONGODB_URI` is set, verify database credentials and `authSource`, and check DNS/network connectivity and the database IP access list. The test stops after 45 seconds and returns a nonzero exit code on failure. A Node `MODULE_TYPELESS_PACKAGE_JSON` warning may appear when importing the TypeScript helper; it does not indicate a database failure.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/(root)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
