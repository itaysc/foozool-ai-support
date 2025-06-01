import React, {
  useCallback,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import { GhostOverlay, StyledInput, InputContainer } from './styled';

interface AutoCompleteInputProps {
  reservedKeywords: string[];
  onSubmit?: (value: string) => void;
  onChange?: (value: string) => void;
  submitKey?: string;
  onKeywordUsed?: (keyword: string) => void;
  onKeywordRemoved?: (keyword: string) => void;
}

const AutoCompleteInput = forwardRef<HTMLInputElement, AutoCompleteInputProps>(
  (
    {
      reservedKeywords,
      onSubmit,
      onChange,
      submitKey = 'Enter',
      onKeywordUsed,
      onKeywordRemoved,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState('');
    const localInputRef = useRef<HTMLInputElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const originalKeywords = useRef(reservedKeywords);

    // Allow parent to access the input DOM node
    useImperativeHandle(ref, () => localInputRef.current as HTMLInputElement);

    const getGhostSuggestion = useCallback(() => {
      if (inputValue.length === 0) {
        return reservedKeywords[0];
      }
      const lastWord = inputValue.split(' ').pop();
      const match = reservedKeywords.find(
        (s) =>
          lastWord.length > 0 &&
          s.toLowerCase().startsWith(lastWord.toLowerCase()) &&
          s.toLowerCase() !== lastWord.toLowerCase()
      );
      if (!match && inputValue[inputValue.length - 1] === ' ') {
        return reservedKeywords[0];
      }
      return match ? match.slice(lastWord.length) : '';
    }, [inputValue, reservedKeywords]);

    const ghostSuggestion = getGhostSuggestion();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      const lastWord = e.target.value.split(' ').pop();
      if (lastWord && reservedKeywords.includes(lastWord)) {
        onKeywordUsed?.(lastWord);
      }
      onChange?.(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const lastWord = inputValue.split(' ').pop() ?? '';
      const fullSuggestion = lastWord + ghostSuggestion;

      if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghostSuggestion) {
        e.preventDefault();
        setInputValue(inputValue + ghostSuggestion);
        onKeywordUsed?.(fullSuggestion);
      } else if (e.key === submitKey && inputValue.trim()) {
        e.preventDefault();
        onSubmit?.(inputValue.trim());
        setInputValue('');
      } else if (e.key === 'Backspace') {
        const lastWord = inputValue.split(' ').pop();
        if (lastWord && originalKeywords.current.includes(lastWord)) {
          onKeywordRemoved?.(lastWord);
        }
      }
    };

    const handleScroll = () => {
      if (localInputRef.current && ghostRef.current) {
        ghostRef.current.scrollLeft = localInputRef.current.scrollLeft;
      }
    };

    return (
      <InputContainer>
        <GhostOverlay ref={ghostRef}>
          <span className="ghost">
            {inputValue}
            {ghostSuggestion}
          </span>
        </GhostOverlay>
        <StyledInput
          ref={localInputRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          autoComplete="off"
        />
      </InputContainer>
    );
  }
);

export default AutoCompleteInput;
