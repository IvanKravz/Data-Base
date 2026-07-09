// EditComments.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../EditFacilityPage.css';

interface EditCommentsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function EditComments({
  value,
  onChange,
  placeholder = 'Добавьте комментарии к объекту...',
  rows = 6,
  disabled = false,
}: EditCommentsProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Подсчёт количества строк в тексте
  const getLineCount = useCallback((text: string) => {
    if (!text) return 1;
    return text.split('\n').length;
  }, []);

  // Обновление номеров при изменении текста
  useEffect(() => {
    setLineCount(getLineCount(value));
  }, [value, getLineCount]);

  // Синхронизация прокрутки между textarea и номерами
  const handleScroll = useCallback(() => {
    if (textareaRef.current && numbersRef.current) {
      numbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Обработчик изменения текста
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Генерация номеров строк
  const renderNumbers = useCallback(() => {
    const numbers = [];
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(
        <div key={i} className="ep-edit-comments-line-number">
          {i}
        </div>
      );
    }
    return numbers;
  }, [lineCount]);

  return (
    <div className="ep-edit-comments-container">
      <div className="ep-edit-comments-numbers" ref={numbersRef}>
        {renderNumbers()}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="ep-edit-comments-textarea"
      />
    </div>
  );
}