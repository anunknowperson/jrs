import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';

const Word = ({ id }: any) => {
  const [word, setWord] = useState<any>(null);
  const [reps, setReps] = useState<number>(0);

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

  if (!word) return <Button loading>Loading...</Button>;

  let primaryReading = '';

  if ('readings' in word) {
    primaryReading = word.readings.find((reading: any) => reading.primary)?.reading || '';
  } else {
    primaryReading = word.characters;
  }

  const primaryMeaning = word.meanings.find((meaning: any) => meaning.primary)?.meaning;

  return (
    <div style={{ position: 'relative' }}>
      <Button
        component={Link}
        color='#aa00ff'
        href={`/dashboard/words/${id}`}
        h="60px"
        style={{ border: 'solid 1px white' }}
        justify="space-between"
        fullWidth
        leftSection={
          <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}>
            <span lang="ja">{word.characters}</span>
          </Text>
        }
        rightSection={
          <Stack gap={0}>
            <Text ta="end" size="sm">{primaryReading}</Text>
            <Text ta="end" size="xs">{primaryMeaning}</Text>
          </Stack>
        }
      />
      {reps > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '35%',
            right: '50%',
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
    </div>
  );
};

export default Word;
