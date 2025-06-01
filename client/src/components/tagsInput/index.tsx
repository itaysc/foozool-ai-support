import { useCallback, useRef, useState } from 'react';
import { GhostOverlay, StyledInput, TagBox, DeleteButton, InputWrapper, FloatingLabel } from './styled';
import { FormControl } from '@mui/material';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  possibleSuggestions?: string[];
  delimiters?: string[];
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

const TagsInput = ({ tags, onChange, possibleSuggestions = [], delimiters = [',', 'Tab', 'Enter', ' '], label, disabled, required }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getGhostSuggestion = useCallback(() => {
    const match = possibleSuggestions.find(
      (s) =>
        inputValue.length > 0 &&
        s.toLowerCase().startsWith(inputValue.toLowerCase()) &&
        s.toLowerCase() !== inputValue.toLowerCase()
    );
    return match ? match.slice(inputValue.length) : '';
  }, [inputValue, possibleSuggestions]);

  const ghostSuggestion = getGhostSuggestion();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghostSuggestion) {
      e.preventDefault();
      onChange([...tags, (inputValue + ghostSuggestion).trim()]);
      setInputValue('');
    } else if (delimiters.includes(e.key) && inputValue.trim()) {
      e.preventDefault();
      onChange([...tags, inputValue.trim()]);
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue.length === 0 && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const handleDelete = (tagToDelete: string) => {
    onChange(tags.filter((tag) => tag !== tagToDelete));
  };

  return (
<FormControl fullWidth>
  <InputWrapper>
    <FloatingLabel>{label}</FloatingLabel>

    {tags.map((tag, idx) => (
      <TagBox key={idx}>
        <span className="tag-text">{tag}</span>
        <DeleteButton onClick={() => handleDelete(tag)}>×</DeleteButton>
      </TagBox>
    ))}

    <div style={{ position: 'relative', flex: 1 }}>
      <GhostOverlay>
        <span style={{ bottom: '-2px' }}>{inputValue}</span>
        <span className="ghost">{ghostSuggestion}</span>
      </GhostOverlay>
      <StyledInput
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  </InputWrapper>
</FormControl>


  );
};

export default TagsInput;
