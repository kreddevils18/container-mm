import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/client";
import { vehicles } from "@/drizzle/schema/vehicles";

const searchParamsSchema = z.object({
  q: z.string().max(100).default(""),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const vehicleSearchResultSchema = z.object({
  id: z.string(),
  licensePlate: z.string(),
  driverName: z.string(),
  driverPhone: z.string(),
});

export type VehicleSearchResult = z.infer<typeof vehicleSearchResultSchema>;

const searchResponseSchema = z.object({
  results: z.array(vehicleSearchResultSchema),
  query: z.string(),
  count: z.number(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const queryParams = {
      q: searchParams.get("q"),
      limit: searchParams.get("limit"),
    };
    const validatedParams = searchParamsSchema.parse(queryParams);
    const { q: query, limit } = validatedParams;

    if (query.length < 2) {
      const recentResults = await db
        .select({
          id: vehicles.id,
          licensePlate: vehicles.licensePlate,
          driverName: vehicles.driverName,
          driverPhone: vehicles.driverPhone,
        })
        .from(vehicles)
        .where(sql`${vehicles.status} = 'available'`)
        .orderBy(sql`${vehicles.updatedAt} DESC`)
        .limit(limit);

      const validatedResults = recentResults.map((result) =>
        vehicleSearchResultSchema.parse(result)
      );

      const response = searchResponseSchema.parse({
        results: validatedResults,
        query,
        count: validatedResults.length,
      });

      return NextResponse.json(response);
    }

    const escapedQuery = query
      .replace(/[!()&|:*'"]/g, " ")
      .trim()
      .split(/\s+/)
      .join(" & ");

    const searchResults = await db
      .select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        driverName: vehicles.driverName,
        driverPhone: vehicles.driverPhone,
        rank: sql<number>`ts_rank(
          to_tsvector('simple', unaccent(CONCAT_WS(' ', 
            COALESCE(${vehicles.licensePlate}, ''),
            COALESCE(${vehicles.driverName}, ''), 
            COALESCE(${vehicles.driverPhone}, '')
          ))),
          websearch_to_tsquery('simple', unaccent(${escapedQuery}))
        )`.as("rank"),
      })
      .from(vehicles)
      .where(
        sql`${vehicles.status} = 'available' AND to_tsvector('simple', unaccent(CONCAT_WS(' ', 
          COALESCE(${vehicles.licensePlate}, ''),
          COALESCE(${vehicles.driverName}, ''), 
          COALESCE(${vehicles.driverPhone}, '')
        ))) @@ websearch_to_tsquery('simple', unaccent(${escapedQuery}))`
      )
      .orderBy(sql`rank DESC, ${vehicles.licensePlate}`)
      .limit(limit);

    const validatedResults = searchResults.map((result) =>
      vehicleSearchResultSchema.parse({
        id: result.id,
        licensePlate: result.licensePlate,
        driverName: result.driverName,
        driverPhone: result.driverPhone,
      })
    );

    const response = searchResponseSchema.parse({
      results: validatedResults,
      query,
      count: validatedResults.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Tham số không hợp lệ",
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Lỗi tìm kiếm phương tiện" },
      { status: 500 }
    );
  }
}