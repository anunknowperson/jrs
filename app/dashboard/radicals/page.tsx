'use client';
import { Suspense, useEffect, useState } from 'react';
import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMediaQuery } from '@mantine/hooks';

interface Radical {
  id: number;
  characters: string | null;
  character_images: Array<string> | null;
  level: number;
  meanings: Array<{ meaning: string; primary: boolean }>;
  lesson_position: number;
}

const RadicalButton = ({ radical }: { radical: Radical }) => {
  const primaryMeaning = radical.meanings.find(m => m.primary)?.meaning || 'No meaning found';
  const [svgContent, setSvgContent] = useState<string | null>(null);

  
  useEffect(() => {
    if (!radical.characters && radical.character_images?.length) {
      fetch(`/files/${radical.character_images[0]}`)
        .then(response => response.text())
        .then(setSvgContent)
        .catch(error => console.error('Error fetching SVG:', error));
    }
  }, [radical]);

  return (
    <Button
      component={Link}
      href={`/dashboard/radicals/${radical.id}`}
      style={{ height: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Stack>
        {radical.characters ? (
          <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}>
            <span lang="ja">{radical.characters}</span>
          </Text>
        ) : (
          svgContent ? (
            <div
              style={{ width: '2rem', height: '2rem', filter: 'invert(1)' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <Text>Character not available</Text>
          )
        )}
        <Text size="xs" mt={5}>{primaryMeaning}</Text>
      </Stack>
    </Button>
  );
};

const LevelBlock = ({ levelId, radicals, mobile }: { levelId: number; radicals: Radical[], mobile:boolean|undefined }) => {

  const levelRadicals = radicals
    .filter(r => r.level === levelId)
    .sort((a, b) => {
      const primaryMeaningA = a.meanings.find(m => m.primary)?.meaning || '';
      const primaryMeaningB = b.meanings.find(m => m.primary)?.meaning || '';
      return primaryMeaningA.localeCompare(primaryMeaningB);
    });

  return (
    <Stack my="md">
      <Text size="xl">{`Уровень ${levelId}`}</Text>
      <SimpleGrid cols={mobile ? 5 : 10}>
        {levelRadicals.map(radical => (
          <RadicalButton key={radical.id} radical={radical} />
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default function RadicalsPage() {
  const searchParams = useSearchParams();
  const levels = parseInt(searchParams.get('levels') || '0');
  const [radicals, setRadicals] = useState<Radical[]>([]);


  const mobile = useMediaQuery('(max-width: 1200px)');

  useEffect(() => {
    const fetchRadicals = async () => {
      try {
        const response = await fetch(`/api/radicals?levels=${levels}`);
        if (!response.ok) {
          throw new Error('Failed to fetch radicals');
        }
        const data = await response.json();
        setRadicals(data);
      } catch (error) {
        console.error('Error fetching radicals:', error);
      }
    };

    fetchRadicals();
  }, [levels]);

  return (
    <Stack>
      {Array.from({ length: 10 }, (_, number) => (
        <LevelBlock key={number} levelId={levels * 10 + number + 1} radicals={radicals} mobile={mobile} />
      ))}
    </Stack>
  );
}