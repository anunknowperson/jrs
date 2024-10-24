import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

const RadicalView = ({ radical } :any) => {
  const [svgContent, setSvgContent] = useState<any>(null);


  useEffect(() => {
    if (radical && !radical.characters && radical.character_images?.length) {
      fetch(`/files/${radical.character_images[0]}`)
        .then(response => response.text())
        .then(setSvgContent)
        .catch(error => console.error('Error fetching SVG:', error));
    }
  }, [radical]);

  if (!radical) return <Button loading>Loading...</Button>;

  return (
    radical.characters ? (
        <span style={{ fontSize: '150px', color: 'white' }} lang="ja">{radical.characters}</span>
      ) : (
        svgContent ? (
          <div
            style={{ 
              width: '5rem', 
              height: '5rem', 
              filter: 'invert(1)'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <span style={{ fontSize: '1rem' }}>Character not available</span>
        )
      )
  );
};

export default RadicalView;