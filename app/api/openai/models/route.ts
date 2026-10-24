import { NextResponse } from 'next/server';
import { FetchOpenAIModelsAsync } from '../../../../src/Server/OpenAI/OpenAIModels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the configured provider catalog without exposing upstream request details. */
export async function GET(): Promise<NextResponse>
{
  try
  {
    const models = await FetchOpenAIModelsAsync();

    return NextResponse.json({
      models: models.map((model) =>
      {
        return {
          id: model.Id,
          name: model.Name,
          providerId: model.ProviderId,
          providerName: model.ProviderName
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
