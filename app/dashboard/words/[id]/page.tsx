'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Text, Stack, Paper, Alert, Pill, Group, Chip, TextInput, Button, Textarea } from '@mantine/core';
import React from 'react';

import Radical from '../../../../components/radicals/radical';
import HighlightedText from '../../../../components/HighlightedText';
import Kanji from '../../../../components/kanji/kanji';
import Link from 'next/link';
import { debounce } from 'lodash';
import { useMediaQuery } from '@mantine/hooks';
import { useSession } from 'next-auth/react';

interface Word {
    slug: string;
    level: number;
    characters: string;
    readings: { reading: string; primary: boolean }[];
    meanings: { meaning: string; primary: boolean }[];
    meaning_mnemonic: string;
    reading_mnemonic: string;
    context_sentences: { ja: string, en: string }[];
    component_subject_ids: [number];
    parts_of_speech: [string];
    pronunciation_audios: {
        url: string;
        metadata: {
            gender: string;
            source_id: number;
            pronunciation: string;
            voice_actor_id: number;
            voice_actor_name: string;
            voice_description: string;
        };
        content_type: string;
    }[];
}

interface UserCustomData {
    synonyms: string[];
    meaningMnemonic: string;
    readingMnemonic: string;
}

const PillWrapper = ({ items, getContent }: { items: any[], getContent: (item: any) => string }) => (
    items.map((item, index) => (
        <React.Fragment key={index}>
            <Pill>{getContent(item)}</Pill>
            {index < items.length - 1 ? " " : ""}
        </React.Fragment>
    ))
);

const AudioPlayer = ({ url, metadata }: any) => (
    <Group>
        <Text size="sm">{metadata.voice_actor_name} ({metadata.voice_description}):</Text>
        <audio controls>
            <source src={`/files/${url}`} type={metadata.content_type} />
            Your browser does not support the audio element.
        </audio>
    </Group>
);

export default function WordPage({ params }: { params: { id: string } }) {
    const [word, setWord] = useState<Word | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [synonyms, setSynonyms] = useState<string[]>([]);
    const [meaningMnemonic, setMeaningMnemonic] = useState('');
    const [readingMnemonic, setReadingMnemonic] = useState('');
    const [newSynonym, setNewSynonym] = useState('');
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [wordResponse, userDataResponse] = await Promise.all([
                    fetch(`/api/words?id=${params.id}`),
                    session ? fetch(`/api/words/userdata?wordId=${params.id}`) : Promise.resolve(null)
                ]);

                if (!wordResponse.ok) {
                    throw new Error('Failed to fetch word data');
                }

                const wordData = await wordResponse.json();
                setWord(wordData);

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
            const response = await fetch('/api/words/userdata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wordId: params.id,
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

    if (error) {
        return (
            <Container size="sm" mt="xl">
                <Alert color="red" title="Error">
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!word) {
        return (
            <Container size="sm" mt="xl">
                <Text>Loading...</Text>
            </Container>
        );
    }

    return (
        <Container mt="xl">
            <Stack>


                <Paper bg="#aa00ff" shadow="xs" p="md">


                    <Stack>
                        <Title c="white" order={1}>{word.characters} - {word.meanings[0].meaning}</Title>

                        <Text c="white" size="xl">Слово</Text>
                        <Text c="white"> <strong>Уровень:</strong> {word.level}</Text>
                        <Text c="white" ><strong>Часть речи:</strong> <PillWrapper
                            items={word.parts_of_speech}
                            getContent={(parts_of_speech) => parts_of_speech}
                        /></Text>
                    </Stack>
                </Paper>





                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Значения</Title>
                    <PillWrapper
                        items={word.meanings}
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
                    <Title order={3} mb="sm">Объяснение значений</Title>
                    <HighlightedText>{word.meaning_mnemonic}</HighlightedText>
                    {session && (
                        <>
                            <Title order={4} mt="md" mb="sm">Заметка</Title>
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

                    {(() => {

                        if ('readings' in word) {
                            return word.readings.map((reading, index) => (
                                <Stack key={index} mb="md">
                                    <Group>
                                        <Pill>{reading.reading}{reading.primary ? " (основное)" : ""}</Pill>
                                    </Group>
                                    {word.pronunciation_audios
                                        .filter(audio =>
                                            audio.metadata.pronunciation === reading.reading &&
                                            audio.content_type === "audio/webm"
                                        )
                                        .map((audio, audioIndex) => (
                                            <AudioPlayer key={audioIndex} url={audio.url} metadata={audio.metadata} />
                                        ))
                                    }
                                </Stack>
                            ))
                        } else {
                            return <Stack mb="md">
                                <Group>
                                    <Pill>{(word as any).characters}</Pill>
                                </Group>
                                {(word as any).pronunciation_audios
                                    .filter((audio: any) =>
                                        audio.metadata.pronunciation === (word as any).characters &&
                                        audio.content_type === "audio/webm"
                                    )
                                    .map((audio: any, audioIndex: any) => (
                                        <AudioPlayer key={audioIndex} url={audio.url} metadata={audio.metadata} />
                                    ))
                                }
                            </Stack>
                        }

                    })()}

                </Paper>

                {('reading_mnemonic' in word) &&
                    <Paper shadow="xs" p="md">
                        <Title order={3} mb="sm">Объяснение чтений</Title>
                        <HighlightedText>{word.reading_mnemonic}</HighlightedText>
                        {session && (
                            <>
                                <Title order={4} mt="md" mb="sm">Заметка</Title>
                                <Textarea
                                    value={readingMnemonic}
                                    onChange={(e) => handleReadingMnemonicChange(e.currentTarget.value)}
                                    minRows={3}
                                />
                            </>
                        )}
                    </Paper>}

                <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">В контексте</Title>

                    Использование можно смотреть <Link href={`https://wanikani.com/vocabulary/${word.characters}`}>здесь</Link>.

                    {word.context_sentences.map((val, id) => <div key={id}>
                        <Text pt="sm">{val.ja}</Text>
                        <Text >{val.en}</Text>
                    </div>)}
                </Paper>


                {('component_subject_ids' in word) && <Paper shadow="xs" p="md">
                    <Title order={3} mb="sm">Комбинация кандзи</Title>
                    <Group>
                        {word.component_subject_ids.map((val, index) => (
                            <React.Fragment key={val}>
                                <Kanji id={val} />
                                {index < word.component_subject_ids.length - 1 && (
                                    <Text component="span" size="xl" w="bold"> + </Text>
                                )}
                            </React.Fragment>
                        ))}
                    </Group>
                </Paper>}

            </Stack>
        </Container>
    );
}