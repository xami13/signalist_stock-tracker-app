import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import mongoose from "mongoose";

process.env.NODE_ENV ??= "development";
nextEnv.loadEnvConfig(fileURLToPath(new URL("../", import.meta.url)), process.env.NODE_ENV === "development");

// Bound the check even when DNS or the server is unreachable.
const timeout = setTimeout(() => {
  console.error("FAIL: Database check exceeded 45 seconds. Check network access and the database host.");
  process.exit(1);
}, 45_000);

let stage = "configuration";
try {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI must be set");
  console.log("PASS: MONGODB_URI is configured (value hidden)");
  const { connectToDatabase } = await import("../database/mongoose.ts");
  stage = "connection/authentication";
  const connection = await connectToDatabase();
  assert.equal(connection.connection.readyState, 1);
  console.log("PASS: App helper connected to MongoDB");
  stage = "database ping";
  const result = await connection.connection.db.command({ ping: 1 }, { timeoutMS: 10_000 });
  assert.equal(result.ok, 1);
  console.log("PASS: Database ping returned ok: 1");
  stage = "connection reuse";
  assert.equal(await connectToDatabase(), connection);
  console.log("PASS: Repeated calls reuse the same connection");
  console.log("Database connection test passed. No documents were read or changed.");
} catch (error) {
  // Do not print raw driver errors: they can contain connection details.
  console.error(`FAIL: ${stage} (${error.name})`);
  if (error.code === 18) console.error("Authentication failed. Check your database username, password, and authSource.");
  else console.error("Check MONGODB_URI, DNS/network access, and your database IP access list.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  clearTimeout(timeout);
}
