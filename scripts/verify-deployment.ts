#!/usr/bin/env tsx

import { existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "../src/lib/env";
import { createScriptLogger } from "../src/lib/logger";

const logger = createScriptLogger({ prefix: "DEPLOY" });

async function verifyDeployment(): Promise<void> {
  logger.info("Verifying deployment configuration...");

  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFiles = [
    "vercel.json",
    "next.config.ts",
    "drizzle.config.ts",
    ".env.production.example",
    "DEPLOYMENT.md",
  ];

  for (const file of requiredFiles) {
    if (!existsSync(join(process.cwd(), file))) {
      errors.push(`❌ Missing file: ${file}`);
    } else {
      logger.success(`Found: ${file}`);
    }
  }

  try {
    logger.info("Checking environment variables...");

    if (!env.DATABASE_URL) {
      errors.push("❌ DATABASE_URL is not configured");
    } else {
      logger.success("DATABASE_URL is configured");
    }

    if (!env.NEXTAUTH_SECRET) {
      errors.push("❌ NEXTAUTH_SECRET is not configured");
    } else if (env.NEXTAUTH_SECRET.length < 32) {
      errors.push("❌ NEXTAUTH_SECRET must be at least 32 characters");
    } else {
      logger.success("NEXTAUTH_SECRET is configured");
    }

    if (!env.NEXTAUTH_URL) {
      warnings.push("⚠️  NEXTAUTH_URL should be set for production");
    } else {
      logger.success("NEXTAUTH_URL is configured");
    }
  } catch (error) {
    errors.push(`❌ Environment validation failed: ${error}`);
  }

  logger.info("Checking Node.js version...");
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0] || "0", 10);

  if (majorVersion < 18) {
    errors.push(`❌ Node.js version ${nodeVersion} is too old. Minimum: v18`);
  } else {
    logger.success(`Node.js version ${nodeVersion} is supported`);
  }

  logger.info("Verification Summary:");

  if (errors.length === 0) {
    logger.success("All checks passed! Ready for deployment.");

    if (warnings.length > 0) {
      logger.warn("Warnings:");
      for (const warning of warnings) {
        logger.warn(`  ${warning}`);
      }
    }

    logger.info("Next steps:");
    logger.info("  1. Create Neon database: https://console.neon.tech/");
    logger.info("  2. Configure Vercel environment variables");
    logger.info("  3. Deploy to Vercel");
    logger.info("  4. Run post-deployment verification");
  } else {
    logger.error("Deployment verification failed:");
    for (const error of errors) {
      logger.error(`  ${error}`);
    }

    if (warnings.length > 0) {
      logger.warn("Additional warnings:");
      for (const warning of warnings) {
        logger.warn(`  ${warning}`);
      }
    }

    process.exit(1);
  }
}

process.on("SIGINT", async (): Promise<void> => {
  logger.info("Verification interrupted");
  process.exit(0);
});

if (require.main === module) {
  verifyDeployment()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.logError(error, "Verification failed");
      process.exit(1);
    });
}
