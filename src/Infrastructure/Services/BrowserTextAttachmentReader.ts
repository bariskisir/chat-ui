import { IChatAttachment } from '../../Core/Domain/Entities/Definitions/IChatAttachment';

export class BrowserTextAttachmentReader
{
  public static readonly MaxAttachmentCount = 4;
  public static readonly MaxFileSizeBytes = 64 * 1024;

  private static readonly SupportedExtensions: string[] = [
    '.txt',
    '.md',
    '.markdown',
    '.json',
    '.jsonc',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.html',
    '.htm',
    '.xml',
    '.svg',
    '.yml',
    '.yaml',
    '.toml',
    '.ini',
    '.cfg',
    '.conf',
    '.env',
    '.csv',
    '.tsv',
    '.log',
    '.py',
    '.java',
    '.kt',
    '.kts',
    '.go',
    '.rs',
    '.c',
    '.h',
    '.cpp',
    '.hpp',
    '.cc',
    '.cs',
    '.php',
    '.rb',
    '.swift',
    '.sh',
    '.bash',
    '.zsh',
    '.ps1',
    '.sql',
    '.graphql',
    '.gql',
    '.vue',
    '.svelte',
    '.astro'
  ];

  public async ReadAsync(file: File): Promise<IChatAttachment>
  {
    if (!BrowserTextAttachmentReader.IsSupported(file))
    {
      throw new Error('Only text and code files can be attached.');
    }

    if (file.size > BrowserTextAttachmentReader.MaxFileSizeBytes)
    {
      throw new Error('Files must be 64 KB or smaller.');
    }

    let content: string;
    try
    {
      content = await file.text();
    }
    catch
    {
      throw new Error('The file could not be read.');
    }

    if (content.includes('\u0000'))
    {
      throw new Error('Binary files are not supported.');
    }

    return {
      Id: BrowserTextAttachmentReader.CreateId(),
      Name: file.name,
      MimeType: file.type || 'text/plain',
      Size: file.size,
      Content: content
    };
  }

  private static IsSupported(file: File): boolean
  {
    if (file.type.startsWith('text/'))
    {
      return true;
    }

    const extension = BrowserTextAttachmentReader.GetExtension(file.name);

    return extension.length > 0
      && BrowserTextAttachmentReader.SupportedExtensions.includes(extension);
  }

  private static GetExtension(fileName: string): string
  {
    const dotIndex = fileName.lastIndexOf('.');

    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
  }

  private static CreateId(): string
  {
    return 'attachment-'
      + Date.now().toString(36)
      + '-'
      + Math.random().toString(36).substring(2, 7);
  }
}
