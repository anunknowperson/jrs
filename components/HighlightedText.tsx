import React from 'react';
import { Text } from '@mantine/core';

const HighlightedText = ({ children }:any) => {
  const parts = children.split(/(<radical>.*?<\/radical>|<kanji>.*?<\/kanji>|<vocabulary>.*?<\/vocabulary>|<ja>.*?<\/ja>|<reading>.*?<\/reading>)/);

  return (
    <Text>
      {parts.map((part:any, index:any) => {
        if (part.startsWith('<radical>')) {
          return (
            <span key={index} style={{ backgroundColor: '#00aaff', color: 'white' }}>
              {part.replace(/<\/?radical>/g, '')}
            </span>
          );
        } else if (part.startsWith('<kanji>')) {
          return (
            <span key={index} style={{ backgroundColor: '#ff00aa', color: 'white' }}>
              {part.replace(/<\/?kanji>/g, '')}
            </span>
          );
        }  else if (part.startsWith('<vocabulary>')) {
          return (
            <span key={index} style={{ backgroundColor: '#aa00ff', color: 'white' }}>
              {part.replace(/<\/?vocabulary>/g, '')}
            </span>
          );
        } else if (part.startsWith('<ja>')) {
          return (
            <span key={index} style={{  }}>
              {part.replace(/<\/?ja>/g, '')}
            </span>
          );
        } else if (part.startsWith('<reading>')) {
          return (
            <span key={index} style={{ backgroundColor: '#555', color: 'white'  }}>
              {part.replace(/<\/?reading>/g, '')}
            </span>
          );
        } else {
          return part;
        }
      })}
    </Text>
  );
};

export default HighlightedText;