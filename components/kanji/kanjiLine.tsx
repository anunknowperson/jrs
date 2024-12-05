import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';

const KanjiLine = ({ id } :any) => {
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
    <Button component={Link}
    color='#FF00AA'
    href={`/dashboard/kanji/${id}`} h="60px" style={{ border: 'solid 1px white' }} justify="space-between" fullWidth leftSection={
        <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}><span lang="ja">{kanji.characters}</span></Text>
    } rightSection={
        <Stack gap={0} >
            <Text ta="end" size="sm">{primaryReading}</Text>
            <Text ta="end" size="xs">{primaryMeaning}</Text>
        </Stack>
       
    } />

  );
};

export default KanjiLine;