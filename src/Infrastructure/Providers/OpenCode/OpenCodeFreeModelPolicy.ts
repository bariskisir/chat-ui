export class OpenCodeFreeModelPolicy
{
  private static readonly FreeKeyword = 'free';
  private static readonly KnownFreeModelIds = new Set<string>(['big-pickle']);

  public IsFree(modelId: string): boolean
  {
    const normalizedModelId = modelId.trim().toLowerCase();

    return normalizedModelId.includes(OpenCodeFreeModelPolicy.FreeKeyword)
      || OpenCodeFreeModelPolicy.KnownFreeModelIds.has(normalizedModelId);
  }
}
