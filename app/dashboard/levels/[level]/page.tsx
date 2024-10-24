'use client';

import { SimpleGrid, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useEffect, useState } from "react";
import Radical from "../../../../components/radicals/radical";
import Kanji from "../../../../components/kanji/kanji";
import Word from "../../../../components/words/word";

const LevelBlock = ({ DataComponent, data, mobile, sortFunc } :any) => {

    const levelData = data
        .sort(sortFunc);

    return (
        <Stack my="md">
            <SimpleGrid cols={mobile ? 5 : 10}>
                {data.map((obj :any) => (
                    <DataComponent key={obj.id} id={obj.id} />
                ))}
            </SimpleGrid>
        </Stack>
    );
};

export default function LevelPage({ params }: { params: { level: string } }) {
    const [radicals, setRadicals] = useState([]);
    const [kanji, setKanji] = useState([]);
    const [words, setWords] = useState([]);

    const mobile = useMediaQuery('(max-width: 1200px)');

    useEffect(() => {
        const fetchRadicals = async () => {
            try {
                const response = await fetch(`/api/radicals?level=${params.level}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch radicals');
                }
                const data = await response.json();

                setRadicals(data);
            } catch (error) {
                console.error('Error fetching radicals:', error);
            }
        };

        const fetchKanji = async () => {
            try {
                const response = await fetch(`/api/kanji?level=${params.level}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch kanji');
                }
                const data = await response.json();

                setKanji(data);
            } catch (error) {
                console.error('Error fetching kanji:', error);
            }
        };

        const fetchWords = async () => {
            try {
                const response = await fetch(`/api/words?level=${params.level}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch words');
                }
                const data = await response.json();

                setWords(data);
            } catch (error) {
                console.error('Error fetching words:', error);
            }
        };

        fetchRadicals();
        fetchKanji();
        fetchWords();
    }, [params.level]);

    return (
        <Stack>
            <Text size="xl" mt={5}>Радикалы (Ключи)</Text>
            <LevelBlock DataComponent={Radical} data={radicals} mobile={mobile} sortFunc={(a :any, b :any) => {
                const primaryMeaningA = a.meanings.find((m :any) => m.primary)?.meaning || '';
                const primaryMeaningB = b.meanings.find((m :any) => m.primary)?.meaning || '';
                return primaryMeaningA.localeCompare(primaryMeaningB);
            }} />

            <Text size="xl" mt={5}>Кандзи</Text>
            <LevelBlock DataComponent={Kanji} data={kanji} mobile={mobile} sortFunc={(a :any, b :any) => {
                return a.primary_meaning.localeCompare(b.primary_meaning);
            }} />

            <Text size="xl" mt={5}>Слова</Text>
            <Stack gap={1} w="100%">
                {words.sort((a :any, b :any) => {
                    return a.primary_meaning.localeCompare(b.primary_meaning);
                }).map((val :any, id) => <Word key={id} id={val.id} />)}
            </Stack>
        </Stack>
    );
}