'use client';
import { Suspense, useEffect, useState } from 'react';
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Words {
    id: number;
    characters: string;
    level: number;
    primary_meaning: string;
    primary_reading: string;
    lesson_position: number;
}

const WordsButton = ({ words }: { words: Words }) => {
    return (
        <Button
            component={Link}
            color='#aa00ff'
            href={`/dashboard/words/${words.id}`} h="60px" style={{ border: 'solid 1px white' }} justify="space-between" fullWidth leftSection={
                <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}><span lang="ja">{words.characters}</span></Text>
            } rightSection={
                <Stack gap={0} >
                    <Text ta="end" size="xs">{words.primary_reading}</Text>
                    <Text ta="end" size="xs">{words.primary_meaning}</Text>
                </Stack>

            } />
    );
};

const LevelBlock = ({ levelId, wordss }: { levelId: number; wordss: Words[] }) => {
    const levelWordss = wordss
        .filter(r => r.level === levelId)
        .sort((a, b) => {
            return a.primary_meaning.localeCompare(b.primary_meaning);
        });

    return (
        <Stack my="md">
            <Text size="xl">{`Уровень ${levelId}`}</Text>
            <Button.Group orientation="vertical">
                {levelWordss.map((words) => (
                    <WordsButton key={words.id} words={words} />
                ))}
            </Button.Group>
        </Stack>
    );
};

export default function WordsPage() {
    const searchParams = useSearchParams();
    const levels = parseInt(searchParams.get('levels') || '0');
    const [wordss, setWordss] = useState<Words[]>([]);

    useEffect(() => {
        const fetchWordss = async () => {
            try {
                const response = await fetch(`/api/words?levels=${levels}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch words');
                }
                const data = await response.json();
                setWordss(data);
            } catch (error) {
                console.error('Error fetching words:', error);
            }
        };

        fetchWordss();
    }, [levels]);

    return (<Stack>
                {Array.from({ length: 10 }, (_, number) => (
                    <LevelBlock key={number} levelId={levels * 10 + number + 1} wordss={wordss} />
                ))}
            </Stack>
    );
}