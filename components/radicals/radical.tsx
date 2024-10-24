import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

const Radical = ({ id } :any) => {
  const [radical, setRadical] = useState<any>(null);
  const [svgContent, setSvgContent] = useState<any>(null);

  useEffect(() => {
    const fetchRadical = async () => {
      try {
        const response = await fetch(`/api/radicals?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch radical');
        const data = await response.json();
        setRadical(data);
      } catch (error) {
        console.error('Error fetching radical:', error);
      }
    };

    fetchRadical();
  }, [id]);

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
    <Button
      component={Link}
      href={`/dashboard/radicals/${id}`}
      style={{ height: 'auto', padding: '10px', fontSize: '2rem', lineHeight: 1 }}
    >
      {radical.characters ? (
        <span lang="ja">{radical.characters}</span>
      ) : (
        svgContent ? (
          <div
            style={{ 
              width: '2rem', 
              height: '2rem', 
              filter: 'invert(1)'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <span style={{ fontSize: '1rem' }}>Character not available</span>
        )
      )}
    </Button>
  );
};

export default Radical;