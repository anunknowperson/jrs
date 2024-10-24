import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';

const Kanji = ({ id }: any) => {
  const [kanji, setKanji] = useState<any>(null);

  useEffect(() => {
    const fetchKanji = async () => {
      try {
        const response = await fetch(`/api/kanji?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch kanji');
        const data = await response.json();
        setKanji(data);
      } catch (error) {
        console.error('Error fetching kanji:', error);
      }
    };

    fetchKanji();
  }, [id]);

  if (!kanji) return <Button loading>Loading...</Button>;

  const primaryReading = kanji.readings.find((reading :any) => reading.primary)?.reading;
  const primaryMeaning = kanji.meanings.find((meaning :any) => meaning.primary)?.meaning;

  return (
    <Button
      component={Link}
      href={`/dashboard/kanji/${id}`}
      color='#FF00AA'
      style={{ height: 'auto', padding: '10px', width: 'auto' }}
    >
      <Stack gap={0} align="center">
        <Text lang="ja" style={{ fontSize: '2rem', lineHeight: 1 }}>
          {kanji.characters}
        </Text>
        <Text size="sm">{primaryReading}</Text>
        <Text size="xs">{primaryMeaning}</Text>
      </Stack>
    </Button>
  );
};

export default Kanji;