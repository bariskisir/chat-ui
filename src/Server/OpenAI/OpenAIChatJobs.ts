/** Keeps OpenAI-compatible generations running after the client stream disconnects. */

import { IChatCitation } from '../../Core/Domain/Entities/Definitions/IChatCitation';
import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';
import { WebSearchEngine, WebSearchMode } from '../../Core/Domain/Enums/WebSearchMode';
import { StreamOpenAIChatAsync } from './OpenAIClient';
import { IOpenAIMessage } from './OpenAIProtocol';

/** One buffered event emitted by a running chat job. */
export type OpenAIChatJobEvent =
  | { type: 'status'; value: 'searching' | 'generating' }
  | { type: 'content'; value: string }
  | { type: 'reasoning'; value: string }
  | { type: 'search'; phase: 'searching'; engine: WebSearchEngine }
  | { type: 'search'; phase: 'completed'; engine: WebSearchEngine; citations: IChatCitation[] }
  | { type: 'search'; phase: 'failed'; engine: WebSearchEngine }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface IOpenAIChatJobRequest
{
  Prompt: string;
  Messages: IOpenAIMessage[];
  ModelId: string;
  ProviderId: string;
  ReasoningEffort: ReasoningEffort;
  WebSearchMode: WebSearchMode;
}

export interface IOpenAIChatJobSubscriber
{
  OnEvent(event: OpenAIChatJobEvent, index: number): void;
  OnComplete(): void;
}

interface IOpenAIChatJob
{
  Id: string;
  Events: OpenAIChatJobEvent[];
  IsDone: boolean;
  Subscribers: Set<IOpenAIChatJobSubscriber>;
  AbortController: AbortController;
}

/** Finished jobs stay available long enough for a background tab to reconnect. */
const JobRetentionMs = 15 * 60_000;

/**
 * Route handlers can be bundled separately, so the job registry lives on globalThis
 * to keep one instance per server process.
 */
const JobRegistry = globalThis as typeof globalThis & {
  __cuiOpenAIChatJobs?: Map<string, IOpenAIChatJob>;
};
const Jobs = JobRegistry.__cuiOpenAIChatJobs
  ?? new Map<string, IOpenAIChatJob>();
JobRegistry.__cuiOpenAIChatJobs = Jobs;

/** Returns the provider response for display in the chat. */
function DescribeError(error: unknown): string
{
  if (error instanceof Error && error.message.trim())
  {
    return error.message;
  }

  return 'The response could not be completed. Please try again.';
}

/** Appends one event to the job buffer and forwards it to live subscribers. */
function Emit(job: IOpenAIChatJob, event: OpenAIChatJobEvent): void
{
  job.Events.push(event);
  const index = job.Events.length - 1;

  for (const subscriber of [...job.Subscribers])
  {
    try
    {
      subscriber.OnEvent(event, index);
    }
    catch
    {
      job.Subscribers.delete(subscriber);
    }
  }
}

/** Runs one chat generation independently of the requesting HTTP connection. */
async function RunJobAsync(
  job: IOpenAIChatJob,
  request: IOpenAIChatJobRequest
): Promise<void>
{
  try
  {
    let messages = request.Messages;

    if (request.WebSearchMode !== 'off')
    {
      const engine = request.WebSearchMode;
      Emit(job, { type: 'status', value: 'searching' });
      Emit(job, { type: 'search', phase: 'searching', engine });

      try
      {
        const [{ SearchWebAsync }, { BuildReferencePrompt }] = await Promise.all([
          import('../WebSearch/WebSearchService'),
          import('../WebSearch/WebSearchPrompt')
        ]);

        const searchResult = await SearchWebAsync(
          engine,
          [request.Prompt],
          job.AbortController.signal
        );

        Emit(job, {
          type: 'search',
          phase: 'completed',
          engine,
          citations: searchResult.Citations
        });

        if (searchResult.Context)
        {
          messages = [
            {
              role: 'system',
              content: BuildReferencePrompt(request.Prompt, searchResult)
            },
            ...messages
          ];
        }
      }
      catch (error)
      {
        if (job.AbortController.signal.aborted)
        {
          throw error;
        }

        Emit(job, { type: 'search', phase: 'failed', engine });
      }
    }

    Emit(job, { type: 'status', value: 'generating' });

    await StreamOpenAIChatAsync({
      ProviderId: request.ProviderId,
      ModelId: request.ModelId,
      Messages: messages,
      ReasoningEffort: request.ReasoningEffort,
      Signal: job.AbortController.signal,
      OnDelta: (delta) =>
      {
        if (delta.Reasoning)
        {
          Emit(job, { type: 'reasoning', value: delta.Reasoning });
        }

        if (delta.Content)
        {
          Emit(job, { type: 'content', value: delta.Content });
        }
      }
    });

    Emit(job, { type: 'done' });
  }
  catch (error)
  {
    if (!job.AbortController.signal.aborted)
    {
      Emit(job, { type: 'error', message: DescribeError(error) });
    }
  }
  finally
  {
    job.IsDone = true;

    for (const subscriber of [...job.Subscribers])
    {
      try
      {
        subscriber.OnComplete();
      }
      catch
      {
        // The subscriber has already closed its stream.
      }
    }

    job.Subscribers.clear();
    setTimeout(() =>
    {
      if (Jobs.get(job.Id) === job)
      {
        Jobs.delete(job.Id);
      }
    }, JobRetentionMs).unref();
  }
}

/** Starts a generation and returns the identifier used to subscribe or resume. */
export function StartOpenAIChatJob(request: IOpenAIChatJobRequest): string
{
  const job: IOpenAIChatJob = {
    Id: crypto.randomUUID(),
    Events: [],
    IsDone: false,
    Subscribers: new Set(),
    AbortController: new AbortController()
  };

  Jobs.set(job.Id, job);
  void RunJobAsync(job, request);

  return job.Id;
}

/** Reports whether a job is known to this server process. */
export function HasOpenAIChatJob(jobId: string): boolean
{
  return Jobs.has(jobId);
}

/**
 * Replays buffered events from the requested index and then follows the live job.
 * Returns a detach function, or null when the job is no longer available.
 */
export function SubscribeToOpenAIChatJob(
  jobId: string,
  from: number,
  subscriber: IOpenAIChatJobSubscriber
): (() => void) | null
{
  const job = Jobs.get(jobId);
  if (!job)
  {
    return null;
  }

  const start = Math.max(0, Math.min(from, job.Events.length));
  for (let index = start; index < job.Events.length; index += 1)
  {
    subscriber.OnEvent(job.Events[index], index);
  }

  if (job.IsDone)
  {
    subscriber.OnComplete();
    return () =>
    {
      // Nothing to detach.
    };
  }

  job.Subscribers.add(subscriber);

  return () =>
  {
    job.Subscribers.delete(subscriber);
  };
}

/** Stops a running generation and releases its buffered events. */
export function CancelOpenAIChatJob(jobId: string): boolean
{
  const job = Jobs.get(jobId);
  if (!job)
  {
    return false;
  }

  job.AbortController.abort();
  Jobs.delete(job.Id);

  for (const subscriber of [...job.Subscribers])
  {
    try
    {
      subscriber.OnComplete();
    }
    catch
    {
      // The subscriber has already closed its stream.
    }
  }

  job.Subscribers.clear();
  return true;
}
