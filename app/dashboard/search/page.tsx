'use client';

import { TextInput, ActionIcon, useMantineTheme, rem, Stack, Text } from '@mantine/core';
import { IconSearch, IconArrowRight } from '@tabler/icons-react';
import { useState, useEffect, Suspense } from 'react';
import Kanji from '../../../components/kanji/kanji';
import Radical from '../../../components/radicals/radical';
import Word from '../../../components/words/word';
import KanjiLine from '../../../components/kanji/kanjiLine';
import RadicalLine from '../../../components/radicals/radicalLine';

function InputWithButton({ textEntered } :any) {
    const theme = useMantineTheme();
    const [value, setValue] = useState('');

    return (
        <TextInput
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            radius="xl"
            size="md"
            placeholder="Поиск по сайту"
            rightSectionWidth={42}
            leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
            rightSection={
                <ActionIcon onClick={() => { textEntered(value) }} size={32} radius="xl" color={theme.primaryColor} variant="filled">
                    <IconArrowRight style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                </ActionIcon>
            }
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    textEntered(value);
                }
            }}
        />
    );
}
export default function SearchPage() {
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const search = async (query: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError('An error occurred while searching. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const sortedResults = searchResults.sort((a:any, b:any) => {
        const order: any  = { radical: 1, kanji: 2, vocabulary: 3 };
        return order[a.type] - order[b.type];
    });

    return <>
            <InputWithButton textEntered={search} />

            <Stack gap='1px' mt="15px">
                {isLoading && <Text>Loading...</Text>}
                {error && <Text color="red">{error}</Text>}
                {sortedResults.map((result :any, index) => {
                    switch(result.type) {
                        case 'radical':
                            return <RadicalLine key={index} id={result.id} />;
                        case 'kanji':
                            return <KanjiLine key={index} id={result.id} />;
                        case 'vocabulary':
                            return <Word key={index} id={result.id} />;
                        default:
                            return null;
                    }
                })}
            </Stack>
        </>
    
}