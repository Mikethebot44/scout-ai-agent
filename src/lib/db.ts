import { createDb } from "@scout/shared/db";
import { env } from "@scout/env/apps-www";

export const db = createDb(env.DATABASE_URL);
