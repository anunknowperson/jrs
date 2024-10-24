'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Text, Stack, Paper, Alert, SimpleGrid, TextInput, Button, Textarea, Chip, Group } from '@mantine/core';
import Kanji from '../../../../components/kanji/kanji';
import { useMediaQuery } from '@mantine/hooks';
import HighlightedText from '../../../../components/HighlightedText';
import { useSession } from 'next-auth/react';
import { debounce } from 'lodash';
import RadicalSmall from '../../../../components/radicals/radicalSmall';

interface Radical {
  slug: string;
  level: number;
  characters: string;
  meanings: { meaning: string; primary: boolean }[];
  meaning_mnemonic: string;
  amalgamation_subject_ids: [number];
}

interface UserCustomData {
  synonyms: string[];
  mnemonic: string;
}

export default function RadicalPage({ params }: { params: { id: string } }) {
  const [radical, setRadical] = useState<Radical | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCustomData, setUserCustomData] = useState<UserCustomData>({ synonyms: [], mnemonic: '' });
  const [newSynonym, setNewSynonym] = useState('');
  const mobile = useMediaQuery('(max-width: 1200px)');
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radicalResponse, userDataResponse] = await Promise.all([
          fetch(`/api/radicals?id=${params.id}`),
          session ? fetch(`/api/radicals/userdata?radicalId=${params.id}`) : Promise.resolve(null)
        ]);

        if (!radicalResponse.ok) {
          throw new Error('Failed to fetch radical data');
        }

        const radicalData = await radicalResponse.json();
        setRadical(radicalData);

        if (userDataResponse && userDataResponse.ok) {
          const userData = await userDataResponse.json();
          setUserCustomData(userData);
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      }
    };

    fetchData();
  }, [params.id, session]);

  const updateUserData = async (newData: Partial<UserCustomData>) => {
    try {
      const response = await fetch('/api/radicals/userdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radicalId: params.id,
          ...userCustomData,
          ...newData
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update user data');
      }
  
      setUserCustomData(prev => ({ ...prev, ...newData }));
    } catch (err) {
      console.error(err);
      setError('Failed to update user data');
    }
  };

  const handleAddSynonym = async () => {
    if (!newSynonym.trim()) return;
    await updateUserData({ synonyms: [...userCustomData.synonyms, newSynonym.toLowerCase().trim()] });
    setNewSynonym('');
  };

  const handleRemoveSynonym = async (synonymToRemove: string) => {
    const newSynonyms = userCustomData.synonyms.filter(s => s !== synonymToRemove);
    await updateUserData({ synonyms: newSynonyms });
  };

  const debouncedUpdateMnemonic = useCallback(
    debounce((newMnemonic: string, synonyms: string[]) => {
      updateUserData({ mnemonic: newMnemonic, synonyms });
    }, 500),
    []
  );

  const handleMnemonicChange = (newMnemonic: string) => {
    setUserCustomData(prev => ({ ...prev, mnemonic: newMnemonic }));
    debouncedUpdateMnemonic(newMnemonic, userCustomData.synonyms);
  };  

  if (error) {
    return (
      <Container size="sm" mt="xl">
        <Alert color="red" title="Error">{error}</Alert>
      </Container>
    );
  }

  if (!radical) {
    return (
      <Container size="sm" mt="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container mt="xl">
      <Stack >
        
        
        
        <Paper bg="#00aaff" shadow="xs" p="md">
          <Stack  >
            <Title c="white" order={1}><Group><RadicalSmall radical={radical}/> - {radical.meanings[0].meaning}</Group></Title>
            <Text  c="white" size="xl">Ключ</Text>
            <Text  c="white" ><strong>Уровень:</strong> {radical.level}</Text>
          </Stack>
        </Paper>

        <Paper shadow="xs" p="md">
          <Title order={3} mb="sm">Значения</Title>
          {radical.meanings.map((meaning, index) => (
            <Text key={index}>
              {meaning.meaning} {meaning.primary && "(основное)"}
            </Text>
          ))}
        </Paper>

        {session && (
          <Paper shadow="xs" p="md">
            <Title order={3} mb="sm">Пользовательские синонимы</Title>
            <Chip.Group>
              {userCustomData.synonyms.map((synonym, index) => (
                <Chip mb="sm" key={index} checked={false} onClick={() => handleRemoveSynonym(synonym)}>
                  {synonym}
                </Chip>
              ))}
            </Chip.Group>
            <TextInput  mt="sm"
              placeholder="Добавить синоним"
              value={newSynonym}
              onChange={(e) => setNewSynonym(e.currentTarget.value)}
            />
            <Button onClick={handleAddSynonym} mt="sm">Добавить</Button>
          </Paper>
        )}

        <Paper shadow="xs" p="md">
          <Title order={3} mb="sm">Мнемоника значений</Title>
          <HighlightedText>{radical.meaning_mnemonic}</HighlightedText>
        </Paper>

        {session && (
          <Paper shadow="xs" p="md">
            <Title order={3} mb="sm">Пользовательская мнемоника</Title>
            <Textarea
              value={userCustomData.mnemonic}
              onChange={(e) => handleMnemonicChange(e.currentTarget.value)}
              minRows={3}
            />
          </Paper>
        )}

        <Paper shadow="xs" p="md">
          <Title order={3} mb="sm">Используется в кандзи</Title>
          <SimpleGrid spacing={1} cols={mobile ? 5 : 10}>
            {radical.amalgamation_subject_ids.map((val, id) => <Kanji key={id} id={val}/>)}
          </SimpleGrid>
        </Paper>
      </Stack>
    </Container>
  );
}