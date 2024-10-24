'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Text, Stack, Paper, Alert, Pill, Group, SimpleGrid, Chip, TextInput, Button, Textarea } from '@mantine/core';
import React from 'react';

import Radical from '../../../../components/radicals/radical';
import HighlightedText from '../../../../components/HighlightedText';
import Word from '../../../../components/words/word';
import { useMediaQuery } from '@mantine/hooks';
import Kanji from '../../../../components/kanji/kanji';
import Hint from '../../../../components/Hint';
import { debounce } from 'lodash';
import { useSession } from 'next-auth/react';

interface Kanji {
    slug: string;
    level: number;
    characters: string;
    readings: { type: string, reading: string }[];
    meanings: { meaning: string; primary: boolean }[];
    meaning_mnemonic: string;
    reading_mnemonic: string;
    component_subject_ids: [number];
    amalgamation_subject_ids: [number];
    visually_similar_subject_ids: [number];
    meaning_hint: string;
    reading_hint: string;
}

const PillWrapper = ({ items, getContent }: { items: any[], getContent: (item: any) => string }) => (
    items.map((item, index) => (
        <React.Fragment key={index}>
            <Pill>{getContent(item)}</Pill>
            {index < items.length - 1 ? " " : ""}
        </React.Fragment>
    ))
);

interface UserCustomData {
    synonyms: string[];
    meaningMnemonic: string;
    readingMnemonic: string;
}

export default function KanjiPage({ params }: { params: { id: string } }) {
    const [kanji, setKanji] = useState<Kanji | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [synonyms, setSynonyms] = useState<string[]>([]);
    const [meaningMnemonic, setMeaningMnemonic] = useState('');
    const [readingMnemonic, setReadingMnemonic] = useState('');
    const [newSynonym, setNewSynonym] = useState('');
    const mobile = useMediaQuery('(max-width: 1200px)');
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kanjiResponse, userDataResponse] = await Promise.all([
                    fetch(`/api/kanji?id=${params.id}`),
                    session ? fetch(`/api/kanji/userdata?kanjiId=${params.id}`) : Promise.resolve(null)
                ]);

                if (!kanjiResponse.ok) {
                    throw new Error('Failed to fetch kanji data');
                }

                const kanjiData = await kanjiResponse.json();
                setKanji(kanjiData);

                if (userDataResponse && userDataResponse.ok) {
                    const userData = await userDataResponse.json();
                    setSynonyms(userData.synonyms || []);
                    setMeaningMnemonic(userData.meaningMnemonic || '');
                    setReadingMnemonic(userData.readingMnemonic || '');
                }
            } catch (err) {
                setError('An error occurred while fetching data');
                console.error(err);
            }
        };

        fetchData();
    }, [params.id, session]);

    const updateUserData = async (field: string, value: any) => {
        try {
            const response = await fetch('/api/kanji/userdata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kanjiId: params.id,
                    [field]: value
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update user data');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update user data');
        }
    };

    const handleMeaningMnemonicChange = (value: string) => {
        setMeaningMnemonic(value);
        debouncedUpdateMnemonic('meaningMnemonic', value);
    };

    const handleReadingMnemonicChange = (value: string) => {
        setReadingMnemonic(value);
        debouncedUpdateMnemonic('readingMnemonic', value);
    };

    const debouncedUpdateMnemonic = useCallback(
        debounce((field: string, value: string) => {
            updateUserData(field, value);
        }, 500),
        []
    );

    const handleAddSynonym = async () => {
        if (!newSynonym.trim()) return;
        const updatedSynonyms = [...synonyms, newSynonym.toLowerCase().trim()];
        setSynonyms(updatedSynonyms);
        await updateUserData('synonyms', updatedSynonyms);
        setNewSynonym('');
    };

    const handleRemoveSynonym = async (synonymToRemove: string) => {
        const updatedSynonyms = synonyms.filter(s => s !== synonymToRemove);
        setSynonyms(updatedSynonyms);
        await updateUserData('synonyms', updatedSynonyms);
    };

    if (error) {
        return (
            <Container size="sm" mt="xl">
                <Alert color="red" title="Error">
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!kanji) {
        return (
            <Container size="sm" mt="xl">
                <Text>Loading...</Text>
            </Container>
        );
    }

    return (
        <Container mt="xl">
            <Stack>


                <Paper bg="#ff00aa" shadow="xs" p="md">
                    <Stack>
                        <Title c="white" order={1}>{kanji.characters} - {kanji.meanings[0].meaning}</Title>
                        <Text c="white" size="xl">Кандзи</Text>
                        <Text c="white"><strong>Уровень:</strong> {kanji.level}</Text>
                    </Stack>
                </Paper>



                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Комбинация радикалов</Title>
                    <Group>
                        {kanji.component_subject_ids.map((val, index) => (
                            <React.Fragment key={val}>
                                <Radical id={val} />
                                {index < kanji.component_subject_ids.length - 1 && (
                                    <Text component="span" size="xl" w="bold"> + </Text>
                                )}
                            </React.Fragment>
                        ))}
                    </Group>
                </Paper>

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Значения</Title>
                    <PillWrapper
                        items={kanji.meanings}
                        getContent={(meaning) => `${meaning.meaning}${meaning.primary ? " (основное)" : ""}`}
                    />
                </Paper>

                {session && (
                    <Paper shadow="xs" p="md">
                        <Title order={3} mb="sm">Пользовательские синонимы</Title>
                        <Chip.Group>
                            {synonyms.map((synonym, index) => (
                                <Chip mb="sm" key={index} checked={false} onClick={() => handleRemoveSynonym(synonym)}>
                                    {synonym}
                                </Chip>
                            ))}
                        </Chip.Group>
                        <TextInput
                            mt="sm"
                            placeholder="Добавить синоним"
                            value={newSynonym}
                            onChange={(e) => setNewSynonym(e.currentTarget.value)}
                        />
                        <Button onClick={handleAddSynonym} mt="sm">Добавить</Button>
                    </Paper>
                )}

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Мнемоника значений</Title>
                    <HighlightedText>{kanji.meaning_mnemonic}</HighlightedText>
                    <div style={{ marginBottom: '10px' }}></div>
                    <Hint><HighlightedText>{kanji.meaning_hint}</HighlightedText></Hint>
                    {session && (
                        <>
                            <Title order={4} mt="md" mb="sm">Пользовательская мнемоника значений</Title>
                            <Textarea
                                value={meaningMnemonic}
                                onChange={(e) => handleMeaningMnemonicChange(e.currentTarget.value)}
                                minRows={3}
                            />
                        </>
                    )}
                </Paper>

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Чтения</Title>
                    <Text>
                        On{"\'"}yomi: <PillWrapper
                            items={kanji.readings.filter(reading => reading.type === "onyomi")}
                            getContent={(reading) => reading.reading}
                        />
                    </Text>
                    <Text>
                        Kun{"\'"}yomi: <PillWrapper
                            items={kanji.readings.filter(reading => reading.type === "kunyomi")}
                            getContent={(reading) => reading.reading}
                        />
                    </Text>
                    <Text>
                        Nanori: <PillWrapper
                            items={kanji.readings.filter(reading => reading.type === "nanori")}
                            getContent={(reading) => reading.reading}
                        />
                    </Text>
                </Paper>

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Мнемоника чтений</Title>
                    <HighlightedText>{kanji.reading_mnemonic}</HighlightedText>
                    <div style={{ marginBottom: '10px' }}></div>
                    <Hint><HighlightedText>{kanji.reading_hint}</HighlightedText></Hint>
                    {session && (
                        <>
                            <Title order={4} mt="md" mb="sm">Пользовательская мнемоника чтений</Title>
                            <Textarea
                                value={readingMnemonic}
                                onChange={(e) => handleReadingMnemonicChange(e.currentTarget.value)}
                                minRows={3}
                            />
                        </>
                    )}
                </Paper>

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Похожие кандзи</Title>
                    <SimpleGrid spacing={1} cols={mobile ? 5 : 10}>
                        {kanji.visually_similar_subject_ids.map((val, id) => <Kanji key={id} id={val} />)}
                    </SimpleGrid>
                </Paper>

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Используется в словах</Title>
                    <Stack gap={1} w="100%">
                        {kanji.amalgamation_subject_ids.map((val, id) => <Word key={id} id={val} />)}
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}