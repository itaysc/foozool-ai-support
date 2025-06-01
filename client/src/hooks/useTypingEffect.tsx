import { useEffect, useState } from 'react';

type AnimationType = 'characters' | 'words';

export function useTypingEffect(
  text: string,
  speed: number = 100,
  animationType: AnimationType = 'characters'
) {
  const [animatedText, setAnimatedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) return;

    const units = animationType === 'words' ? text.split(' ') : text.split('');
    let index = 0;

    setAnimatedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      setAnimatedText((prev) => {
        const newText = index === 0
          ? units[0]
          : animationType === 'words'
          ? `${prev} ${units[index] ? units[index] : ''}`
          : prev + (units[index] ? units[index] : '')
        index++;
        return newText;
      });

      if (index >= units.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, animationType]);

  return { animatedText, isTyping };
}
