'use client';
import { useState, useEffect, Suspense } from 'react';
import { Box, Button, Group, LoadingOverlay } from "@mantine/core";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import RadicalSmall from '../../../components/radicals/radicalSmall';

interface Subject {
  id: string;
  collection: string;
  data: {
    level: number;
    lesson_position: number;
    characters: string;
    // Add other relevant fields
  };
}

export default function LearnPage() {
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/lessons/getnext?n=5');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      } else {
        console.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIframeSrc = (subject: Subject) => {
    const id = subject.id;
    switch (subject.collection) {
      case 'vocabulary':
      case 'kana_vocabulary':
        return `/dashboard/words/${id}?embed=1`;
      case 'kanji':
        return `/dashboard/kanji/${id}?embed=1`;
      case 'radical':
        return `/dashboard/radicals/${id}?embed=1`;
      default:
        return '';
    }
  };

  const handleNextSubject = async () => {
    if (currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
    } else {
      // No more loaded subjects, call the shift API and redirect
      try {
        const response = await fetch('/api/lessons/shift', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            learnedSubjects: subjects.map(subject => ({
              id: subject.id,
              lessonPosition: subject.data.lesson_position
            }))
          }),
        });
        if (response.ok) {
          router.push('/dashboard/review');
        } else {
          console.error('Failed to update lesson positions');
        }
      } catch (error) {
        console.error('Error updating lesson positions:', error);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (status === 'unauthenticated') {
    return <Box>Please sign in to access this page.</Box>;
  }

  const getButtonColor = (subj :string) => {
    var retc = 'blue';

    switch (subj) {
      case 'radical':
        retc = 'blue';
        break;

      case 'kanji':
        retc = '#FF00AA';
        break;

      case 'vocabulary':
      case 'kana_vocabulary':
        retc = '#aa00ff';
        break;
    }

    return retc;
  }

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {subjects.length > 0 && (
        <Box style={{ flex: 1, position: 'relative' }}>
          <iframe
            src={getIframeSrc(subjects[currentSubjectIndex])}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Study Content"
          />
        </Box>
      )}
      <Group
        style={{
          position: 'sticky',
          bottom: 0,
          width: '100%',
          padding: '1rem',
          backgroundColor: 'white',
          borderTop: '1px solid #eaeaea',
        }}
        justify="center">
        {subjects.map((subject, index) => (
          <Button
            key={subject.id}
            variant={currentSubjectIndex === index ? 'filled' : 'light'}
            onClick={() => setCurrentSubjectIndex(index)}
            color={getButtonColor(subject.collection)}
          >
            {subject.collection !== 'radical' ? subject.data.characters : <RadicalSmall radical={subject.data} />}
          </Button>
        ))}
        <Button onClick={handleNextSubject}>
          Далее{' >'}
        </Button>
      </Group>
    </Box>
  );
}