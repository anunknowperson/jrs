'use client';
import { useState, useEffect, Suspense } from 'react';
import { Stack, TextInput, Button, Group } from "@mantine/core";
import { useSession, signOut, signIn } from "next-auth/react";
import { notifications } from '@mantine/notifications';


export default function ProfilePage() {
    const { data: session } = useSession();
    const [maximumLessonsPerDay, setMaximumLessonsPerDay] = useState('');
    const [lessonsPerSession, setLessonsPerSession] = useState('');


    useEffect(() => {
        // Fetch user profile data when component mounts
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            setMaximumLessonsPerDay(data.maximumLessonsPerDay.toString());
            setLessonsPerSession(data.lessonsPerSession.toString());
        }
    };

    const handleSave = async () => {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                maximumLessonsPerDay: parseInt(maximumLessonsPerDay),
                lessonsPerSession: parseInt(lessonsPerSession)
            })
        });

        if (response.ok) {
            notifications.show({
                title: 'Success',
                message: 'Profile updated successfully',
                color: 'green'
            });
        } else {
            notifications.show({
                title: 'Error',
                message: 'Failed to update profile',
                color: 'red'
            });
        }
    };

    return (
            <Stack>
                <TextInput
                    label="Максимум уроков в день"
                    value={maximumLessonsPerDay}
                    onChange={(e) => setMaximumLessonsPerDay(e.target.value)}
                    type="number"
                />
                <TextInput
                    label="Уроков в одной пачке"
                    value={lessonsPerSession}
                    onChange={(e) => setLessonsPerSession(e.target.value)}
                    type="number"
                />

                <Button onClick={handleSave}>Сохранить настройки</Button>
                <Button onClick={async () => { await signOut(); signIn() }} color="gray">Выйти из профиля</Button>

            </Stack>
    );
}