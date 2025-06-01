import { useCallback, useRef, useState } from 'react';
import {
  Overlay,
  ChatContainer,
  BotIcon,
  Content,
  CloseBtn,
  CloseIcon,
  LoaderContainer,
  AnswerContainer,
  AnswerText,
  ChatNavigationButtonsContainer, 
  ChatNavigationButton,
} from './styled';
import { BouncingDotsLoader, AutoCompleteInput } from '@/components';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import keywords, { entityKeywords, actionKeywords } from './keywords';
import ChatInstructions from './Instructions';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '@/context/chat/chat.context';

const Chat = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [autocompleteKeywords, setAutocompleteKeywords] = useState<string[]>(actionKeywords);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    handleSearch,
    isLoading,
    answer,
    isAwaitingYesNoResponse,
    isOpen,
    setIsOpen,
    handleYesClicked,
    handleNoClicked,
  } = useChatContext();

  const open = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  }
  
  const { animatedText, isTyping: isTypingAnswer} = useTypingEffect(answer, 25);

  const onInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim() === '') {
      setAutocompleteKeywords(actionKeywords);
    }
  }, [keywords]);

  const handleKeywordUsed = useCallback((keyword: string) => {
    let newKeywords = autocompleteKeywords.filter((k) => k !== keyword);
    if (actionKeywords.includes(keyword)) {
      newKeywords = newKeywords.filter((k) => !actionKeywords.includes(k));
    } else if (entityKeywords.includes(keyword)) {
      newKeywords = newKeywords.filter((k) => !entityKeywords.includes(k));
    }
    setAutocompleteKeywords(newKeywords);
  }, [autocompleteKeywords, actionKeywords, entityKeywords]);

  const handleKeywordRemoved = useCallback((keyword: string) => {
    let newKeywords = [];
    if (actionKeywords.includes(keyword)) {
      newKeywords = [...autocompleteKeywords, ...actionKeywords];
    } else if (entityKeywords.includes(keyword)) {
      newKeywords = [...autocompleteKeywords, ...entityKeywords];
    }
    setAutocompleteKeywords(newKeywords);
  }, [autocompleteKeywords, actionKeywords, entityKeywords]);

  const handleSearchQuery = useCallback(async () => {
    setShowInstructions(false);
    handleSearch(searchQuery);
  }, [searchQuery]);
  
  return (
    <ChatContainer>
      <Overlay className={isOpen ? 'open' : ''} onClick={() => !isOpen && open()}>
        {!isOpen && <BotIcon src='/logo/logo-small.png' alt='logo' />}
        <Content className={isOpen ? 'content-open' : 'content-close'}>
          <CloseBtn onClick={() => setIsOpen(false)}>
            <CloseIcon />
          </CloseBtn>
          <AutoCompleteInput
            ref={inputRef}
            reservedKeywords={autocompleteKeywords}
            onKeywordUsed={handleKeywordUsed}
            onSubmit={handleSearchQuery}
            submitKey='Enter'
            onKeywordRemoved={handleKeywordRemoved}
            onChange={onInputChange}
          />
          <LoaderContainer className={isLoading ? 'loader-open' : 'loader-close'}>
            <BouncingDotsLoader show={true} />
          </LoaderContainer>
          <AnswerContainer>
            {/* {showInstructions && <ChatInstructions />} */}
            <AnswerText>
              {animatedText}
              {
              !isTypingAnswer && isAwaitingYesNoResponse && (
                <ChatNavigationButtonsContainer>
                  <ChatNavigationButton onClick={handleYesClicked}>
                    Yes
                  </ChatNavigationButton>
                  <ChatNavigationButton onClick={handleNoClicked}>
                    No
                  </ChatNavigationButton>
                </ChatNavigationButtonsContainer>
              )
            }  
            </AnswerText>
            {/* <span className="blinking-cursor">|</span> */}
          </AnswerContainer>
        </Content>
      </Overlay>
    </ChatContainer>
  );
};

export default Chat;
