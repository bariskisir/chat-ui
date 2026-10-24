/** Serves a running chat job as server-sent events, replaying missed output. */

import {
  HasOpenAIChatJob,
  SubscribeToOpenAIChatJob
} from './OpenAIChatJobs';

/**
 * Builds the SSE response for one chat job.
 * Returns null when the job has expired so the route can answer with 404.
 */
export function CreateOpenAIChatStreamResponse(
  jobId: string,
  from: number,
  signal: AbortSignal
): Response | null
{
  if (!HasOpenAIChatJob(jobId))
  {
    return null;
  }

  const encoder = new TextEncoder();
  let detach: (() => void) | null = null;
  let isClosed = false;
  let closeStream = (): void =>
  {
    // Replaced once the stream controller exists.
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller)
    {
      const close = (): void =>
      {
        if (isClosed)
        {
          return;
        }

        isClosed = true;
        detach?.();
        detach = null;

        try
        {
          controller.close();
        }
        catch
        {
          // The client may have already closed the stream.
        }
      };

      const send = (payload: Record<string, unknown>): void =>
      {
        if (isClosed)
        {
          return;
        }

        try
        {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        }
        catch
        {
          close();
        }
      };

      closeStream = close;

      const handleAbort = (): void => close();
      signal.addEventListener('abort', handleAbort, { once: true });

      if (signal.aborted)
      {
        close();
        return;
      }

      send({ type: 'job', jobId });

      detach = SubscribeToOpenAIChatJob(jobId, from, {
        OnEvent: (event, index) => send({ ...event, index }),
        OnComplete: close
      });

      if (isClosed)
      {
        detach?.();
        detach = null;
      }
      else if (!detach)
      {
        close();
      }
    },
    cancel()
    {
      closeStream();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Chat-Job-Id': jobId
    }
  });
}
