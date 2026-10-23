import { FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { IChatProviderProps } from '../Definitions/IChatProviderProps';
import { ChatContext } from '../../Contexts/ChatContext';
import { IChatContextValue } from '../../Contracts/IChatContextValue';
import { IConversationSession } from '../../../Core/Domain/Entities/Definitions/IConversationSession';
import { ConversationSession } from '../../../Core/Domain/Entities/Implementations/ConversationSession';
import { IChatMessage } from '../../../Core/Domain/Entities/Definitions/IChatMessage';
import { ChatMessage } from '../../../Core/Domain/Entities/Implementations/ChatMessage';
import { ChatStatus } from '../../../Core/Domain/Enums/ChatStatus';
import { MockChatService } from '../../../Infrastructure/Services/MockChatService';
import { BrowserConversationRepository } from '../../../Infrastructure/Repositories/BrowserConversationRepository';
import { BrowserStorageService } from '../../../Infrastructure/Services/BrowserStorageService';
import { ChatRequestDto } from '../../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../../Application/DTOs/StreamCallbacksDto';
import { UseModel } from '../../Hooks/UseModel';

export const ChatProvider: FC<IChatProviderProps> = ({
  children,
  chatService,
  repository
}) =>
{
  const { SelectedModel } = UseModel();

  const service = useMemo(() =>
  {
    return chatService || new MockChatService();
  }, [chatService]);

  const repo = useMemo(() =>
  {
    return repository || new BrowserConversationRepository(new BrowserStorageService());
  }, [repository]);

  const [sessions, setSessions] = useState<IConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>(ChatStatus.Idle);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() =>
  {
    const loaded = repo.GetAllSessions();
    setSessions(loaded);
  }, [repo]);

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

  const stopGenerating = useCallback(() =>
  {
    if (abortControllerRef.current)
    {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus(ChatStatus.Idle);
  }, []);

  const selectSession = useCallback((id: string) =>
  {
    stopGenerating();
    setActiveSessionId(id);
  }, [stopGenerating]);

  const createNewSession = useCallback(() =>
  {
    stopGenerating();
    setActiveSessionId(null);
  }, [stopGenerating]);

  const deleteSession = useCallback((id: string) =>
  {
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
  }, [repo]);

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

  const clearAllSessions = useCallback(() =>
  {
    stopGenerating();
    repo.ClearAllSessions();
    setSessions([]);
    setActiveSessionId(null);
  }, [stopGenerating, repo]);

  const sendMessage = useCallback(async (prompt: string) =>
  {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || status === ChatStatus.Streaming)
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

    const userMsg = ChatMessage.CreateUserMessage(cleanPrompt, SelectedModel);
    targetSession.AddMessage(userMsg);

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
    setStatus(ChatStatus.Streaming);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const request = new ChatRequestDto(
      cleanPrompt,
      targetSession.Messages,
      SelectedModel,
      abortController.signal
    );

    const callbacks = new StreamCallbacksDto(
      (chunk: string) =>
      {
        assistantMsg.AppendContent(chunk);
        setSessions((prev) => [...prev]);
      },
      () =>
      {
        repo.SaveSession(targetSession!);
        setStatus(ChatStatus.Idle);
        abortControllerRef.current = null;
      },
      () =>
      {
        setStatus(ChatStatus.Error);
        abortControllerRef.current = null;
      }
    );

    await service.StreamMessageAsync(request, callbacks);
  }, [activeSession, status, SelectedModel, repo, service]);

  const isGenerating = status === ChatStatus.Streaming;

  const value = useMemo<IChatContextValue>(() =>
  {
    return {
      Sessions: sessions,
      ActiveSession: activeSession,
      Messages: messages,
      Status: status,
      IsGenerating: isGenerating,
      SendMessage: sendMessage,
      StopGenerating: stopGenerating,
      CreateNewSession: createNewSession,
      SelectSession: selectSession,
      DeleteSession: deleteSession,
      RenameSession: renameSession,
      ClearAllSessions: clearAllSessions
    };
  }, [
    sessions,
    activeSession,
    messages,
    status,
    isGenerating,
    sendMessage,
    stopGenerating,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    clearAllSessions
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
