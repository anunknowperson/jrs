import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';

const Word = ({ id } :any) => {
  const [word, setWord] = useState<any>(null);

  useEffect(() => {
    const fetchWord = async () => {
      try {
        const response = await fetch(`/api/words?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch word');
        const data = await response.json();
        setWord(data);
      } catch (error) {
        console.error('Error fetching word:', error);
      }
    };

    fetchWord();
  }, [id]);

  if (!word) return <Button loading>Loading...</Button>;

  var primaryReading = '';

  if ('readings' in word) {
    primaryReading = word.readings.find((reading :any)=> reading.primary)?.reading;
  } else {
    primaryReading = word.characters;
  }


  const primaryMeaning = word.meanings.find((meaning :any)=> meaning.primary)?.meaning;

  return (
    <Button component={Link}
    color='#aa00ff'
    href={`/dashboard/words/${id}`} h="60px" style={{ border: 'solid 1px white' }} justify="space-between" fullWidth leftSection={
        <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}><span lang="ja">{word.characters}</span></Text>
    } rightSection={
        <Stack gap={0} >
            <Text ta="end" size="sm">{primaryReading}</Text>
            <Text ta="end" size="xs">{primaryMeaning}</Text>
        </Stack>
       
    } />

  );
};

export default Word;