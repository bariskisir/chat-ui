export class OpenCodeApiError extends Error
{
  public readonly StatusCode: number;

  public constructor(statusCode: number, message: string)
  {
    super(message);
    this.name = 'OpenCodeApiError';
    this.StatusCode = statusCode;
  }
}
