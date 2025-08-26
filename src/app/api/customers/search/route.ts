import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/client";
import { customers } from "@/drizzle/schema/customers";

const searchParamsSchema = z.object({
  q: z.string().max(100).default(""),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const customerSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  address: z.string(),
  phone: z.string().nullable(),
});

export type CustomerSearchResult = z.infer<typeof customerSearchResultSchema>;

const searchResponseSchema = z.object({
  results: z.array(customerSearchResultSchema),
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
          id: customers.id,
          name: customers.name,
          email: customers.email,
          address: customers.address,
          phone: customers.phone,
        })
        .from(customers)
        .where(sql`${customers.status} = 'active'`)
        .orderBy(sql`${customers.updatedAt} DESC`)
        .limit(limit);

      const validatedResults = recentResults.map((result) =>
        customerSearchResultSchema.parse(result)
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
        id: customers.id,
        name: customers.name,
        email: customers.email,
        address: customers.address,
        phone: customers.phone,
        rank: sql<number>`ts_rank(
          to_tsvector('simple', unaccent(CONCAT_WS(' ', 
            COALESCE(${customers.name}, ''),
            COALESCE(${customers.email}, ''), 
            COALESCE(${customers.address}, '')
          ))),
          websearch_to_tsquery('simple', unaccent(${escapedQuery}))
        )`.as("rank"),
      })
      .from(customers)
      .where(
        sql`${customers.status} = 'active' AND to_tsvector('simple', unaccent(CONCAT_WS(' ', 
          COALESCE(${customers.name}, ''),
          COALESCE(${customers.email}, ''), 
          COALESCE(${customers.address}, '')
        ))) @@ websearch_to_tsquery('simple', unaccent(${escapedQuery}))`
      )
      .orderBy(sql`rank DESC, ${customers.name}`)
      .limit(limit);

    const validatedResults = searchResults.map((result) =>
      customerSearchResultSchema.parse({
        id: result.id,
        name: result.name,
        email: result.email,
        address: result.address,
        phone: result.phone,
      })
    );

    const response = searchResponseSchema.parse({
      results: validatedResults,
      query,
      count: validatedResults.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Customer search error logged for debugging

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
      { error: "Lỗi tìm kiếm khách hàng" },
      { status: 500 }
    );
  }
}