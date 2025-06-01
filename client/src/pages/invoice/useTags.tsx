import { useState, useEffect, useCallback } from "react";
import invoiceStore from "../../stores/invoice.store";

export interface Tag {
    id: string;
    label: string;
    value: string;
}

export function useTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTagsSuggestions() {
      const suggestions = await invoiceStore.getTags();
      setTagSuggestions(['supplier one', 'overdue', 'assigned']);
      // setTagSuggestions(suggestions);
    }
    fetchTagsSuggestions();
  }, []);

  const handleTagsChange = useCallback((newTags: string[]) => {
    setTags(newTags)
  }, [])



  return {
    tags,
    tagSuggestions,
    handleTagsChange,
  };
}

export default useTags;