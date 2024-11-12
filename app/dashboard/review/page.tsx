'use client';
import { Button, Center, Group, Input, Stack, Text } from "@mantine/core";
import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import RadicalView from "../../../components/radicals/radicalView";
import { Notification, rem } from '@mantine/core';
import { IconHelpCircle } from "@tabler/icons-react";

interface NextCard {
    fsrsCard: {
        subjectType: 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary';
        subjectId: string;
        type: 'meaning' | 'reading';
        card: any; // You might want to define a more specific type for the card
    };
    subjectData: {
        data: {
            characters: string;
            meanings: Array<{ meaning: string; primary: boolean; accepted_answer: boolean }>;
            readings: Array<{ reading: string; primary: boolean; accepted_answer: boolean }>;
            pronunciation_audios: any;
        };
    };
    omonym: {
        data: {
            readings: Array<{ reading: string; primary: boolean; accepted_answer: boolean }>;
        }
    }
    customUserData: any; // Define a more specific type if needed
}


export default function ReviewPage() {
    const xIcon = <IconHelpCircle style={{ width: rem(20), height: rem(20) }} />;
    const { data: session } = useSession();
    const router = useRouter();
    const [nextCard, setNextCard] = useState<NextCard | null>(null);
    const [remains, setRemains] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isWrongAnswer, setIsWrongAnswer] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [buttonText, setButtonText] = useState('Проверить');
    const [warning, setWarning] = useState('');

    const fetchNextCard = async () => {
        try {
            const response = await fetch('/api/lessons/review');
            if (response.ok) {
                const data = await response.json();
                if (data.totalDueCards === 0) {
                    router.push('/dashboard');
                } else {
                    setNextCard(data.nextCard);
                    setRemains(data.totalDueCards)
                }
            } else {
                console.error('Failed to fetch next card');
            }
        } catch (error) {
            console.error('Error fetching next card:', error);
        }
    };

    useEffect(() => {
        fetchNextCard();
    }, []);

    

    const handleSubmit = async () => {
        if (!nextCard) return;
        if (userAnswer == "") return;
        

        const { subjectId, type } = nextCard.fsrsCard;
        const { meanings, readings } = nextCard.subjectData.data;

        let isCorrect = false;

        if (type === 'meaning') {
            const correctMeanings = meanings.filter(m => m.accepted_answer).map(m => m.meaning.toLowerCase());
            const customSynonyms = nextCard.customUserData?.synonyms.map((syn: string) => syn.toLowerCase()) || [];
            isCorrect = correctMeanings.includes(userAnswer.toLowerCase().trim()) || customSynonyms.includes(userAnswer.toLowerCase().trim());
        } else if (type === 'reading') {
            const correctReadings = readings.filter(r => r.accepted_answer).map(r => r.reading);
            isCorrect = correctReadings.includes(userAnswer.trim());




            if (!isCorrect && warning === '') {
                if (nextCard.fsrsCard.subjectType == "kanji") {
                    const allReadings = readings.map(r => r.reading);
                    var messup = allReadings.includes(userAnswer.trim());

                    if (messup) {
                        setWarning('Кажется, вы перепутали чтение со словом (мы спрашиваем чтение кандзи!)');
                        return;
                    }
                }

                if (nextCard.fsrsCard.subjectType == "vocabulary") {
                    if (nextCard.omonym !== null) {
                        const allReadings = nextCard.omonym.data.readings.map(r => r.reading);
                        var messup = allReadings.includes(userAnswer.trim());

                        if (messup) {
                            setWarning('Кажется, вы перепутали чтение с кандзи (мы спрашиваем чтение слова!)');
                            return;
                        }
                    }

                }


            }

            setWarning('');
        }

        const result = isCorrect ? 'good' : 'bad';

        if (nextCard.fsrsCard.subjectType === "vocabulary" || nextCard.fsrsCard.subjectType === "kana_vocabulary") {
            if ('pronunciation_audios' in nextCard.subjectData.data) {

                var selected_reading = "";

                if (result == 'good' && type === 'reading') {
                    selected_reading = userAnswer.trim();
                } else {
                    if (nextCard.fsrsCard.subjectType === "vocabulary") {
                        var rds = nextCard.subjectData.data.readings.filter((reading: any) =>
                         reading.primary
                        );

                        if (rds.length != 0) {
                            selected_reading = rds[0].reading;
                        }
                    } else {
                        selected_reading = nextCard.subjectData.data.characters;
                    }

                    
                }

                const filteredAudios = nextCard.subjectData.data.pronunciation_audios.filter((audio: any) =>
                    audio.metadata.pronunciation === selected_reading &&
                    audio.content_type === "audio/webm"
                );

                // Function to play random audio from the filtered list
                const playRandomAudio = () => {
                    if (filteredAudios.length === 0) {
                        console.log('No matching audio found.');
                        return;
                    }

                    // Pick a random audio from the filtered list
                    const randomIndex = Math.floor(Math.random() * filteredAudios.length);
                    const randomAudio = filteredAudios[randomIndex];
                    console.log(randomAudio.url);
                    // Create an Audio object and set it to autoplay
                    const audio = new Audio('/files/' + randomAudio.url); // Assuming 'url' holds the audio file link
                    audio.play()
                        .then(() => console.log('Playing random audio:', randomAudio.url))
                        .catch(err => console.error('Error playing audio:', err));
                }

                // Call the function to autoplay a random audio
                playRandomAudio();
            }
        }


        console.log(nextCard);
        try {
            await fetch(`/api/lessons/confirmreview?id=${subjectId}&type=${type}&result=${result}`);
            if (isCorrect) {
                goodAnswer();
            } else {
                badAnswer();
            }
        } catch (error) {
            console.error('Error confirming review:', error);
        }
    };

    const goodAnswer = () => {
        setIsWrongAnswer(false);
        setShowHint(false);
        setButtonText('Далее');
    };

    const badAnswer = () => {
        setIsWrongAnswer(true);
        setButtonText('Далее');
    };

    const handleShowHint = () => {
        setShowHint(true);
    };

    const getHintUrl = () => {
        if (!nextCard) return '';

        const { subjectType, subjectId } = nextCard.fsrsCard;
        switch (subjectType) {
            case 'vocabulary':
            case 'kana_vocabulary':
                return `/dashboard/words/${subjectId}?embed=1`;
            case 'kanji':
                return `/dashboard/kanji/${subjectId}?embed=1`;
            case 'radical':
                return `/dashboard/radicals/${subjectId}?embed=1`;
            default:
                return '';
        }
    };

    const handleNext = () => {
        setUserAnswer('');
        setIsWrongAnswer(false);
        setShowHint(false);
        setButtonText('Проверить');
        fetchNextCard();
    };

    if (!nextCard) {
        return <Text>Loading...</Text>;
    }

    const { characters } = nextCard.subjectData.data;
    var questionType = <div />;

    if (nextCard.fsrsCard.type === 'meaning') {
        if (nextCard.fsrsCard.subjectType === "kanji") {
            questionType = <>Что означает этот <b>кандзи</b>?</>;
        } else if (nextCard.fsrsCard.subjectType === "radical") {
            questionType = <>Как называется этот <b>ключ</b>?</>;
        } else {
            questionType = <>Что означает этот <b>слово</b>?</>;
        }
    } else {
        if (nextCard.fsrsCard.subjectType === "kanji") {
            questionType = <>Как прочитать этот <b>кандзи</b>?</>;
        } else {
            questionType = <>Как прочитать этот <b>слово</b>?</>;
        }
    }




    var bgcolor = 'blue';

    switch (nextCard.fsrsCard.subjectType) {
        case 'radical':
            bgcolor = 'blue';
            break;

        case 'kanji':
            bgcolor = '#FF00AA';
            break;

        case 'vocabulary':
        case 'kana_vocabulary':
            bgcolor = '#aa00ff';
            break;


    }

    return (

        <Stack gap={0} h="100%">
            <Center bg={bgcolor} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <Text c="white">Осталось карт: {remains}</Text>
                </div>
                {nextCard.fsrsCard.subjectType !== 'radical' ?
                    <span style={{ fontSize: '150px', color: 'white' }} lang="ja">{characters}</span> :
                    <RadicalView radical={nextCard.subjectData.data} />
                }



            </Center>
            <Center bg="black">
                <Text c="white">{questionType}</Text>
                {(nextCard.fsrsCard.type === 'reading' && nextCard.fsrsCard.subjectType === "kanji")}
            </Center>

            {(warning !== '') && <Notification icon={xIcon} color="yellow" title="Внимание!">
                {warning}
            </Notification>}

            <Group gap={0}>
                <Input
                    w="90%"
                    placeholder="Ответ..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.currentTarget.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (buttonText === 'Проверить' ? handleSubmit() : handleNext())}
                    error={isWrongAnswer ? true : undefined}

                />
                <Button w="10%" onClick={buttonText === 'Проверить' ? handleSubmit : handleNext}>{buttonText}</Button>
            </Group>

            {buttonText === 'Далее' &&
                <Text c={isWrongAnswer ? "red" : "green"}>
                    {isWrongAnswer ? 'Неверный ответ.' : 'Верный ответ.'} <span onClick={handleShowHint} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Показать объяснения</span>?
                </Text>
            }

            {showHint && (
                <iframe
                    src={getHintUrl()}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                ></iframe>
            )}
        </Stack>
    );
}
