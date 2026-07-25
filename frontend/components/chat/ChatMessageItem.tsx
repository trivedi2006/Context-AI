'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types';
import { UserMessage } from './UserMessage';
import { AIResponse } from './AIResponse';
import { CitationPopover } from './CitationPopover';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerate?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRegenerate }) => {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <>
      <AIResponse
        message={message}
        onCitationClick={(cit) => setSelectedCitation(cit)}
        onRegenerate={onRegenerate}
      />

      <CitationPopover
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </>
  );
};
