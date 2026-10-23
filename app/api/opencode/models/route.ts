import { NextResponse } from 'next/server';
import { FetchOpenCodeModelsAsync } from '../../../../src/Server/OpenCode/OpenCodeModels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the free OpenCode catalog without exposing upstream request details. */
export async function GET(): Promise<NextResponse>
{
  try
  {
    const models = await FetchOpenCodeModelsAsync();

    return NextResponse.json({
      models: models.map((model) =>
      {
        return {
          id: model.Id,
          name: model.Name,
          badge: model.Badge
        };
      })
    });
  }
  catch
  {
    return NextResponse.json(
      { message: 'The model catalog is unavailable.' },
      { status: 502 }
    );
  }
}
