import { createContext, useState, useContext, useCallback, useEffect, useRef } from "react";
import { useRefreshToken } from '../../hooks/useRefreshToken';
import { IChatResponse } from "@common/types/chatResponse";
import { entityType } from "@common/types/entityType";
import { actionKeywords } from "@/components/aiChat/keywords";
import useCurrentEntityTracker from "@/hooks/usePageTracker";
import chatService from "@/services/chat-service";
import { useNavigate } from "react-router-dom";

const chatContext = createContext(undefined);
const { Provider } = chatContext;

// TODO: add support for other entities
const getEntityWithArticle = (entity: entityType) => {
  return entity === 'invoice' ? 'an invoice' : `a ${entity}`;
}

const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [answer, setAnswer] = useState('How can I assist you?');
    const [isAwaitingYesNoResponse, setIsAwaitingYesNoResponse] = useState(false);
    const [entityParameters, setEntityParameters] = useState<Record<string, string>>({});
    const currentEntityInView = useCurrentEntityTracker();
    const yesNoCallbackRef = useRef<((value: boolean) => void) | null>(null);


    useEffect(() => {
      if (isOpen) {
        setAnswer('How can I assist you?');
      } else {
        setAnswer('');
      }
    }, [isOpen]);

    const awaitYesNoResponse = useCallback((callback: (value: boolean) => void) => {
      setIsAwaitingYesNoResponse(true);
      yesNoCallbackRef.current = callback;
    }, []);

    const clear = useCallback(() => {
      setAnswer('');
      yesNoCallbackRef.current = null;
      setEntityParameters({});
    }, []);

    const handleResponse = useCallback((response: IChatResponse) => {
        if (!response.isValid) {
            setAnswer(answer + ' I am sorry, I cannot assist with that. Please try using a different prompt.');
            return;
        }
        const { action, entity, parameters } = response;
        if (action === 'delete') {
          setAnswer(`Are you sure you want to delete ${entity}?`);
          awaitYesNoResponse((value) => {
            // TODO: delete entity and write answer
          })
        } else if (entity !== currentEntityInView) {
          setAnswer(` Looks like you wish to ${action} ${getEntityWithArticle(entity as entityType)}, this action requires navigation to a differet page. would you like to navigate to the ${entity} page?`);
          awaitYesNoResponse((value) => {
            if (value) {
              const path = parameters._id ? `${entity}/${parameters._id}` : `${entity}s`;
              navigate(`/${path}`, {
                state: {
                  action: 'navigate',
                  entity,
                  parameters: entityParameters
                 }
              });
            }
          })
          setEntityParameters(parameters);
        }
    }, [currentEntityInView, navigate, awaitYesNoResponse]);

    const handleYesClicked = useCallback(() => {
      if (yesNoCallbackRef.current) {
        yesNoCallbackRef.current(true);
      }
      clear();
      setIsOpen(false);
    }, [clear]);
  
    const handleNoClicked = useCallback(() => {
      if (yesNoCallbackRef.current) {
        yesNoCallbackRef.current(false);
      }
      clear();
    }, [clear]);
  
    const handleSearch = useCallback(async (searchQuery: string) => {
        try {
          if (searchQuery.trim() === '') return;
          setIsLoading(true);
          const response = await chatService.sendMessage(searchQuery);
          handleResponse(response);
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
      }, []);
    return <Provider value={{ 
        isOpen,
        setIsOpen,
        handleSearch,
        answer,
        setAnswer,
        isLoading,
        handleYesClicked,
        handleNoClicked,
        isAwaitingYesNoResponse,
     }}>{children}</Provider>
}

const useChatContext = () => {
    const context = useContext(chatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}

export { ChatProvider, useChatContext };