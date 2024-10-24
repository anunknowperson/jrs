import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Stack, Text } from '@mantine/core';

const RadicalLine = ({ id } :any) => {
  const [radical, setRadical] = useState<any>(null);

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

  if (!radical) return <Button loading>Loading...</Button>;

  const primaryMeaning = radical.meanings.find((meaning :any) => meaning.primary)?.meaning;

  return (
    <Button component={Link}
    href={`/dashboard/radicals/${id}`} h="60px" style={{ border: 'solid 1px white' }} justify="space-between" fullWidth leftSection={
        <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}><span lang="ja">{radical.characters}</span></Text>
    } rightSection={
        <Stack gap={0} >
            <Text ta="end" size="xs">{primaryMeaning}</Text>
        </Stack>
       
    } />

  );
};

export default RadicalLine;