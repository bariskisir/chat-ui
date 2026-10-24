import { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { IChatProviderProps } from '../Definitions/IChatProviderProps';
import { ChatContext } from '../../Contexts/ChatContext';
import { IChatContextValue } from '../../Contracts/IChatContextValue';
import { IConversationSession } from '../../../Core/Domain/Entities/Definitions/IConversationSession';
import { ConversationSession } from '../../../Core/Domain/Entities/Implementations/ConversationSession';
import { IChatAttachment } from '../../../Core/Domain/Entities/Definitions/IChatAttachment';
import { IChatMessage } from '../../../Core/Domain/Entities/Definitions/IChatMessage';
import { ChatMessage } from '../../../Core/Domain/Entities/Implementations/ChatMessage';
import { ChatStatus } from '../../../Core/Domain/Enums/ChatStatus';
import { ChatSearchStatus } from '../../../Core/Domain/Enums/ChatSearchStatus';
import { ReasoningEffort } from '../../../Core/Domain/Enums/ReasoningEffort';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { WebSearchMode } from '../../../Core/Domain/Enums/WebSearchMode';
import { BrowserConversationRepository } from '../../../Infrastructure/Repositories/BrowserConversationRepository';
import { BrowserStorageService } from '../../../Infrastructure/Services/BrowserStorageService';
import { ChatRequestDto } from '../../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../../Application/DTOs/StreamCallbacksDto';
import { UseModel } from '../../Hooks/UseModel';

export const ChatProvider: FC<IChatProviderProps> = ({
  children,
  chatService,
  repository,
  webSearchEnabled = true
}) =>
{
  const { SelectedModel, CurrentDescriptor } = UseModel();

  const repo = useMemo(() =>
  {
    return repository || new BrowserConversationRepository(new BrowserStorageService());
  }, [repository]);

  const [sessions, setSessions] = useState<IConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [generatingSessionIds, setGeneratingSessionIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );
  const [reasoningEffort, setReasoningEffortState] = useState<ReasoningEffort>('default');
  const [webSearchMode, setWebSearchModeState] = useState<WebSearchMode>('off');
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const discardedSessionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() =>
  {
    const loaded = repo.GetAllSessions();
    setSessions(loaded);
  }, [repo]);

  const isOpenAIModel = CurrentDescriptor?.Provider === ServiceProviderType.OpenAI;
  const canUseReasoning = isOpenAIModel
    && Boolean(CurrentDescriptor?.ReasoningEfforts.length);
  const canUseWebSearch = isOpenAIModel && webSearchEnabled;

  useEffect(() =>
  {
    const efforts = CurrentDescriptor?.ReasoningEfforts ?? [];
    if (efforts.length === 0 && reasoningEffort !== 'default')
    {
      setReasoningEffortState('default');
      return;
    }

    if (efforts.length > 0 && !efforts.includes(reasoningEffort))
    {
      setReasoningEffortState(efforts[0] ?? 'default');
    }
  }, [CurrentDescriptor, reasoningEffort]);

  useEffect(() =>
  {
    if (!canUseWebSearch && webSearchMode !== 'off')
    {
      setWebSearchModeState('off');
    }
  }, [canUseWebSearch, webSearchMode]);

  const activeSession = useMemo(() =>
  {
    if (!activeSessionId)
    {
      return null;
    }
    return sessions.find((s) => s.Id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages: IChatMessage[] = useMemo(() =>
  {
    return activeSession ? activeSession.Messages : [];
  }, [activeSession]);

  const setSessionGenerating = useCallback((sessionId: string, isGenerating: boolean) =>
  {
    setGeneratingSessionIds((previous) =>
    {
      const wasGenerating = previous.has(sessionId);
      if (wasGenerating === isGenerating)
      {
        return previous;
      }

      const next = new Set(previous);
      if (isGenerating)
      {
        next.add(sessionId);
      }
      else
      {
        next.delete(sessionId);
      }

      return next;
    });
  }, []);

  const stopGenerating = useCallback((sessionId?: string) =>
  {
    const targetId = sessionId ?? activeSessionId;
    if (!targetId)
    {
      return;
    }

    const controller = abortControllersRef.current.get(targetId);
    if (controller)
    {
      abortControllersRef.current.delete(targetId);
      controller.abort();
    }

    setSessionGenerating(targetId, false);
  }, [activeSessionId, setSessionGenerating]);

  const stopAllGenerating = useCallback(() =>
  {
    for (const controller of abortControllersRef.current.values())
    {
      controller.abort();
    }

    abortControllersRef.current.clear();
    setGeneratingSessionIds(new Set<string>());
  }, []);

  const selectSession = useCallback((id: string) =>
  {
    setActiveSessionId(id);
  }, []);

  const createNewSession = useCallback(() =>
  {
    setActiveSessionId(null);
  }, []);

  const deleteSession = useCallback((id: string) =>
  {
    discardedSessionIdsRef.current.add(id);
    stopGenerating(id);

    repo.DeleteSession(id);
    setSessions((prev) =>
    {
      const filtered = prev.filter((s) => s.Id !== id);
      return filtered;
    });

    setActiveSessionId((current) =>
    {
      if (current === id)
      {
        return null;
      }
      return current;
    });
  }, [repo, stopGenerating]);

  const renameSession = useCallback((id: string, newTitle: string) =>
  {
    setSessions((prev) =>
    {
      return prev.map((s) =>
      {
        if (s.Id === id)
        {
          s.Rename(newTitle);
          repo.SaveSession(s);
        }
        return s;
      });
    });
  }, [repo]);

  const clearCurrentSession = useCallback(() =>
  {
    if (!activeSessionId)
    {
      return;
    }

    discardedSessionIdsRef.current.add(activeSessionId);
    stopGenerating(activeSessionId);
    repo.DeleteSession(activeSessionId);
    setSessions((prev) => prev.filter((s) => s.Id !== activeSessionId));
    setActiveSessionId(null);
  }, [activeSessionId, stopGenerating, repo]);

  const clearAllSessions = useCallback(() =>
  {
    sessions.forEach((session) => discardedSessionIdsRef.current.add(session.Id));
    stopAllGenerating();
    repo.ClearAllSessions();
    setSessions([]);
    setActiveSessionId(null);
  }, [sessions, stopAllGenerating, repo]);

  const setReasoningEffort = useCallback((effort: ReasoningEffort) =>
  {
    const available = CurrentDescriptor?.ReasoningEfforts ?? [];
    if (available.length === 0 || !available.includes(effort))
    {
      return;
    }

    setReasoningEffortState(effort);
  }, [CurrentDescriptor]);

  const setWebSearchMode = useCallback((mode: WebSearchMode) =>
  {
    if (!canUseWebSearch)
    {
      setWebSearchModeState('off');
      return;
    }

    setWebSearchModeState(mode);
  }, [canUseWebSearch]);

  const sendMessage = useCallback(async (
    prompt: string,
    attachments: IChatAttachment[] = []
  ) =>
  {
    const cleanPrompt = prompt.trim();
    const isActiveSessionGenerating = activeSessionId !== null
      && generatingSessionIds.has(activeSessionId);

    if (!SelectedModel || !CurrentDescriptor || !cleanPrompt || isActiveSessionGenerating)
    {
      return;
    }

    let targetSession = activeSession;
    let isBrandNewSession = false;

    if (!targetSession)
    {
      const title = cleanPrompt.length > 36 ? cleanPrompt.substring(0, 36) + '...' : cleanPrompt;
      targetSession = ConversationSession.CreateNew(SelectedModel, title);
      isBrandNewSession = true;
    }

    const userMsg = ChatMessage.CreateUserMessage(cleanPrompt, SelectedModel, attachments);
    targetSession.AddMessage(userMsg);
    const requestHistory = [...targetSession.Messages];

    const assistantMsg = ChatMessage.CreateAssistantMessage(SelectedModel, '');
    targetSession.AddMessage(assistantMsg);

    if (isBrandNewSession)
    {
      setSessions((prev) => [targetSession!, ...prev]);
      setActiveSessionId(targetSession.Id);
    }
    else
    {
      setSessions((prev) => [...prev]);
    }

    repo.SaveSession(targetSession);

    const abortController = new AbortController();
    abortControllersRef.current.set(targetSession.Id, abortController);
    setSessionGenerating(targetSession.Id, true);

    const request = new ChatRequestDto(
      cleanPrompt,
      requestHistory,
      CurrentDescriptor.ApiId,
      CurrentDescriptor.Provider,
      CurrentDescriptor.ProviderId,
      targetSession.Id,
      abortController.signal,
      reasoningEffort,
      webSearchMode
    );

    const isDiscarded = () => discardedSessionIdsRef.current.has(targetSession!.Id);

    const finalizeSearch = () =>
    {
      if (assistantMsg.Search?.Status === ChatSearchStatus.Searching)
      {
        assistantMsg.ApplySearchState({
          ...assistantMsg.Search,
          Status: ChatSearchStatus.Failed
        });
        setSessions((prev) => [...prev]);
      }
    };

    const callbacks = new StreamCallbacksDto(
      (chunk: string) =>
      {
        if (isDiscarded())
        {
          return;
        }

        assistantMsg.AppendContent(chunk);
        setSessions((prev) => [...prev]);
      },
      () =>
      {
        finalizeSearch();

        if (!isDiscarded())
        {
          repo.SaveSession(targetSession!);
        }

        if (abortControllersRef.current.get(targetSession!.Id) === abortController)
        {
          abortControllersRef.current.delete(targetSession!.Id);
        }

        setSessionGenerating(targetSession!.Id, false);
      },
      (error: Error) =>
      {
        finalizeSearch();

        if (!isDiscarded())
        {
          assistantMsg.ApplyError(error.message);
          repo.SaveSession(targetSession!);
        }

        if (abortControllersRef.current.get(targetSession!.Id) === abortController)
        {
          abortControllersRef.current.delete(targetSession!.Id);
        }

        setSessionGenerating(targetSession!.Id, false);
      },
      (chunk: string) =>
      {
        if (isDiscarded())
        {
          return;
        }

        assistantMsg.AppendReasoning(chunk);
        setSessions((prev) => [...prev]);
      },
      (search) =>
      {
        if (isDiscarded())
        {
          return;
        }

        assistantMsg.ApplySearchState(search);
        setSessions((prev) => [...prev]);
      }
    );

    await chatService.StreamMessageAsync(request, callbacks);
  }, [
    activeSession,
    activeSessionId,
    generatingSessionIds,
    SelectedModel,
    CurrentDescriptor,
    reasoningEffort,
    webSearchMode,
    repo,
    chatService,
    setSessionGenerating
  ]);

  const isGenerating = activeSessionId !== null
    && generatingSessionIds.has(activeSessionId);
  const status = isGenerating ? ChatStatus.Streaming : ChatStatus.Idle;

  const value = useMemo<IChatContextValue>(() =>
  {
    return {
      Sessions: sessions,
      ActiveSession: activeSession,
      Messages: messages,
      Status: status,
      IsGenerating: isGenerating,
      ReasoningEffort: reasoningEffort,
      WebSearchMode: webSearchMode,
      WebSearchEnabled: webSearchEnabled,
      CanUseReasoning: canUseReasoning,
      CanUseWebSearch: canUseWebSearch,
      SendMessage: sendMessage,
      StopGenerating: stopGenerating,
      CreateNewSession: createNewSession,
      SelectSession: selectSession,
      DeleteSession: deleteSession,
      ClearCurrentSession: clearCurrentSession,
      RenameSession: renameSession,
      ClearAllSessions: clearAllSessions,
      SetReasoningEffort: setReasoningEffort,
      SetWebSearchMode: setWebSearchMode
    };
  }, [
    sessions,
    activeSession,
    messages,
    status,
    isGenerating,
    reasoningEffort,
    webSearchMode,
    webSearchEnabled,
    canUseReasoning,
    canUseWebSearch,
    sendMessage,
    stopGenerating,
    createNewSession,
    selectSession,
    deleteSession,
    clearCurrentSession,
    renameSession,
    clearAllSessions,
    setReasoningEffort,
    setWebSearchMode
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
