export class OpenAIApiError extends Error
{
  public readonly StatusCode: number;

  public constructor(statusCode: number, message: string)
  {
    super(message);
    this.name = 'OpenAIApiError';
    this.StatusCode = statusCode;
  }
}
