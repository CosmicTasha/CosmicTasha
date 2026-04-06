import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companyProfiles } from '@/db/schema';

// POST — Upsert company profile (unique on sessionId)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, name, website, size, description, aiDescription, industries, foundedYear } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 },
      );
    }

    const now = new Date();

    const values: Record<string, unknown> = { sessionId };
    if (name !== undefined) values.name = name;
    if (website !== undefined) values.website = website;
    if (size !== undefined) values.size = size;
    if (description !== undefined) values.description = description;
    if (aiDescription !== undefined) values.aiDescription = aiDescription;
    if (industries !== undefined) values.industries = industries;
    if (foundedYear !== undefined) values.foundedYear = foundedYear;

    // Build the set clause for conflict update (only provided fields)
    const setClause: Record<string, unknown> = { updatedAt: now };
    if (name !== undefined) setClause.name = name;
    if (website !== undefined) setClause.website = website;
    if (size !== undefined) setClause.size = size;
    if (description !== undefined) setClause.description = description;
    if (aiDescription !== undefined) setClause.aiDescription = aiDescription;
    if (industries !== undefined) setClause.industries = industries;
    if (foundedYear !== undefined) setClause.foundedYear = foundedYear;

    await db
      .insert(companyProfiles)
      .values(values as typeof companyProfiles.$inferInsert)
      .onConflictDoUpdate({
        target: companyProfiles.sessionId,
        set: setClause,
      });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
