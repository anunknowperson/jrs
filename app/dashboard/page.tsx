'use client';
import { Box, Button, Center, Group, Stack, Text, Title, Alert } from "@mantine/core";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from "@mantine/hooks";
import { IconAlertCircle } from '@tabler/icons-react';

export default function HomePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [totalDueCards, setTotalDueCards] = useState<number>(0);
    const [remainingLessons, setRemainingLessons] = useState<number>(0);
    const mobile = useMediaQuery('(max-width: 1200px)');

    useEffect(() => {
        fetchReviewCount();
        fetchRemainingLessons();
    }, []);

    const fetchReviewCount = async () => {
        try {
            const response = await fetch('/api/lessons/review');
            if (response.ok) {
                const data = await response.json();
                setTotalDueCards(data.totalDueCards);
            } else {
                console.error('Failed to fetch review count');
            }
        } catch (error) {
            console.error('Error fetching review count:', error);
        }
    };

    const fetchRemainingLessons = async () => {
        try {
            const response = await fetch('/api/lessons/getnext?n=1');
            if (response.ok) {
                const data = await response.json();
                setRemainingLessons(data.total);
            } else {
                console.error('Failed to fetch remaining lessons');
            }
        } catch (error) {
            console.error('Error fetching remaining lessons:', error);
        }
    };

    var Comp = mobile ? Stack : Group;

    return (
        <Stack>
            <Comp grow={mobile ? undefined : true} align="stretch">
                <Box
                    style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%'
                    }}
                >
                    <div>
                        <Title order={3}>Учить</Title>
                        <Text>Осталось уроков на сегодня: {remainingLessons}</Text>
                        {(remainingLessons !== 0 && totalDueCards > 0) && (
                            <Alert icon={<IconAlertCircle size="1rem" />} title="Внимание" color="yellow" mt="md">
                                Сначала завершите все доступные повторения.
                            </Alert>
                        )}
                    </div>
                    <Button
                        fullWidth
                        mt="md"
                        onClick={() => router.push('/dashboard/learn')}
                        disabled={remainingLessons === 0 || totalDueCards > 0}
                    >
                        Перейти к изучению
                    </Button>
                </Box>
                <Box
                    style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%'
                    }}
                >
                    <div>
                        <Title order={3}>Повторение</Title>
                        <Text>Доступно карточек для повторения: {totalDueCards}</Text>
                    </div>
                    <Button
                        fullWidth
                        mt="md"
                        onClick={() => router.push('/dashboard/review')}
                        disabled={totalDueCards === 0}
                    >
                        Перейти к повторению
                    </Button>
                </Box>
            </Comp>
        </Stack>

    );
}