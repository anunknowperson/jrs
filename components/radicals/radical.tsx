import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

const Radical = ({ id }: any) => {
  const [radical, setRadical] = useState<any>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [reps, setReps] = useState<number>(0);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats?subjectId=${id}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setReps(data.reps || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (id) {
      fetchStats();
    }
  }, [id]);

  if (!radical) return <Button loading>Loading...</Button>;

  return (
    <Button
      component={Link}
      href={`/dashboard/radicals/${id}`}
      style={{ 
        height: 'auto', 
        padding: '10px', 
        fontSize: '2rem', 
        lineHeight: 1, 
        position: 'relative' 
      }}
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
      {reps > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '50%',
            width: '1.2rem',
            height: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem'
          }}
        >
          {reps}
        </div>
      )}
    </Button>
  );
};

export default Radical;
