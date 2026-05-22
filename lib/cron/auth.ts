import { NextRequest } from "next/server";

export function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return false;

  const parts = authHeader.split(" ");

  if (parts.length !== 2) return false;

  const [type, token] = parts;

  if (type !== "Bearer") return false;

  if (!process.env.CRON_SECRET) {
    throw new Error("CRON_SECRET not set");
  }

  return token === process.env.CRON_SECRET;
}