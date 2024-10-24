'use client';
import { Suspense, useEffect, useState } from 'react';
import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMediaQuery } from '@mantine/hooks';

interface Kanji {
    id: number;
    characters: string;
    level: number;
    primary_meaning: string;
    lesson_position: number;
}

const KanjiButton = ({ kanji }: { kanji: Kanji }) => {
    return (
        <Button
            component={Link}
            href={`/dashboard/kanji/${kanji.id}`}
            color='#FF00AA'
            style={{  height: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Stack>
                <Text size="xl" style={{ fontSize: '2rem', lineHeight: 1 }}><span lang="ja">{kanji.characters}</span></Text>
                <Text size="xs" mt={5}>{kanji.primary_meaning}</Text>
            </Stack>
        </Button >
    );
};

const LevelBlock = ({ levelId, kanjis, mobile }: { levelId: number; kanjis: Kanji[], mobile:boolean|undefined }) => {
    const levelKanjis = kanjis
        .filter(r => r.level === levelId)
        .sort((a, b) => {
            return a.primary_meaning.localeCompare(b.primary_meaning);
        });

    return (
        <Stack my="md">
            <Text size="xl">{`Уровень ${levelId}`}</Text>
            <SimpleGrid cols={mobile ? 5 : 10}>
                {levelKanjis.map((kanji) => (
                    <KanjiButton key={kanji.id} kanji={kanji} />
                ))}
            </SimpleGrid>
        </Stack>
    );
};

export default function KanjisPage() {
    const searchParams = useSearchParams();
    const levels = parseInt(searchParams.get('levels') || '0');
    const [kanjis, setKanjis] = useState<Kanji[]>([]);

    
    const mobile = useMediaQuery('(max-width: 1200px)');

    useEffect(() => {
        const fetchKanjis = async () => {
            try {
                const response = await fetch(`/api/kanji?levels=${levels}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch kanjis');
                }
                const data = await response.json();
                setKanjis(data);
            } catch (error) {
                console.error('Error fetching kanjis:', error);
            }
        };

        fetchKanjis();
    }, [levels]);

    return (
        <Stack>
            {Array.from({ length: 10 }, (_, number) => (
                <LevelBlock key={number} levelId={levels * 10 + number + 1} kanjis={kanjis} mobile={mobile} />
            ))}
        </Stack>
    );
}