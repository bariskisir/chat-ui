import { IWebSearchResult } from './WebSearchService';

const ReferencePrompt = `Please answer the question based on the reference materials

## Citation Rules:
- Please cite the context at the end of sentences when appropriate.
- Please use the format of citation number [number] to reference the context in corresponding parts of your answer.
- If a sentence comes from multiple contexts, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer.
- If all reference content is not relevant to the user's question, please answer based on your knowledge.

## My question is:

{question}

## Reference Materials:

{references}

Please respond in the same language as the user's question.`;

/** Builds the same reference prompt AIChat uses for web-grounded answers. */
export function BuildReferencePrompt(question: string, result: IWebSearchResult): string
{
  const references = result.Citations.map((citation) =>
  {
    return {
      number: citation.Index,
      title: citation.Title,
      content: citation.Snippet,
      url: citation.Url
    };
  });

  return ReferencePrompt
    .replace('{question}', question)
    .replace(
      '{references}',
      `\`\`\`json\n${JSON.stringify(references, null, 2)}\n\`\`\``
    );
}
