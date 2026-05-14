import { PrismaClient } from "../../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.COLLECTOR_DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { __collectorPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.__collectorPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__collectorPrisma = prisma;
}

export function tenantPrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        const tenantScoped = [
          "IntegrationConnection",
          "CollectionJob",
          "CollectionJobRun",
          "CollectionRetry",
          "SyncLog",
        ];

        if (!model || !tenantScoped.includes(model)) {
          return query(args);
        }

        if (["create", "createMany"].includes(operation)) {
          if ("data" in args) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                tenantId,
              }));
            } else {
              (args.data as Record<string, unknown>).tenantId = tenantId;
            }
          }
        }

        if (
          [
            "findMany",
            "findFirst",
            "findUnique",
            "update",
            "updateMany",
            "delete",
            "deleteMany",
            "count",
            "aggregate",
          ].includes(operation)
        ) {
          if ("where" in args) {
            (args.where as Record<string, unknown>).tenantId = tenantId;
          } else {
            (args as Record<string, unknown>).where = { tenantId };
          }
        }

        return query(args);
      },
    },
  });
}
