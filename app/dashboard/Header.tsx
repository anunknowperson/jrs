'use client';

import {
    HoverCard,
    Group,
    Button,
    UnstyledButton,
    Text,
    SimpleGrid,
    ThemeIcon,
    Anchor,
    Divider,
    Center,
    Box,
    Burger,
    Drawer,
    Collapse,
    ScrollArea,
    rem,
    useMantineTheme,
    Stack,
    MantineTheme,
    ActionIcon,
} from '@mantine/core';
import { MantineLogo } from '@mantinex/mantine-logo';
import { useDisclosure } from '@mantine/hooks';
import {
    IconNotification,
    IconCode,
    IconBook,
    IconChartPie3,
    IconFingerprint,
    IconCoin,
    IconChevronDown,
    IconSearch
} from '@tabler/icons-react';

import classes from './Header.module.css';

import Link from 'next/link';
import { useState } from 'react';

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation';


const getLevelName = (id: number) => {
    if (id == 0) {
        return <div><span lang="ja">快</span> Отдых</div>
    }
    if (id == 1) {
        return <div><span lang="ja">苦</span> Боль</div>
    }
    if (id == 2) {
        return <div><span lang="ja">死</span> Смерть</div>
    }
    if (id == 3) {
        return <div><span lang="ja">地獄</span> Ад</div>
    }
    if (id == 4) {
        return <div><span lang="ja">天国</span> Рай</div>
    }
    if (id == 5) {
        return <div><span lang="ja">現実</span> Реальность</div>
    }

}

const getLevelNumbers = (id: number) => {
    return `Уровни ${id * 10 + 1} - ${(id+1) * 10}`;
}

const createLevelButton = (id: number, href: string, onClose: () => void) => {
    return (
        <Button
            key={id}
            component={Link}
            href={href}
            justify="space-between"
            variant="default"
            leftSection={getLevelName(id)}
            rightSection={<div>{getLevelNumbers(id)}</div>}
            onClick={onClose}
        />
    );
};

const menuWithLevels = (theme: MantineTheme, name: string, href: string) => {
    return <HoverCard width={300} position="bottom" radius="md" shadow="md" withinPortal>
        <HoverCard.Target>
            <a href={href} className={classes.link}>
                <Center inline>
                    <Box component="span" mr={5}>
                        {name}
                    </Box>
                    <IconChevronDown
                        style={{ width: rem(16), height: rem(16) }}
                        color={theme.colors.blue[6]}
                    />
                </Center>
            </a>
        </HoverCard.Target>

        <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
            <Stack>
                <Button.Group orientation="vertical">
                    {[0, 1, 2, 3, 4, 5].map((id) =>
                        createLevelButton(id, `${href}?levels=${id}`, () => { })
                    )}
                </Button.Group>
            </Stack>
        </HoverCard.Dropdown>
    </HoverCard>
}

const createLevelRow = (id: number, onClose: () => void) => {
    return <div key={id}>
        <Text>{getLevelName(id)}</Text>
        <Button.Group mb="sm" w="100%" orientation="horizontal">
            {Array.from({ length: 10 }, (_, number) =>
                <Button key={number} component={Link} variant="default" w="100%" href={`/dashboard/levels/${id * 10 + number + 1}`} onClick={onClose}>
                    {id * 10 + number + 1}
                </Button>
            )}
        </Button.Group>
    </div>
}

const levelsMenu = (theme: MantineTheme) => {
    return <HoverCard position="bottom" radius="md" shadow="md" withinPortal>
        <HoverCard.Target>
            <a href="#" className={classes.link}>
                <Center inline>
                    <Box component="span" mr={5}>
                        Уровни
                    </Box>
                    <IconChevronDown
                        style={{ width: rem(16), height: rem(16) }}
                        color={theme.colors.blue[6]}
                    />
                </Center>
            </a>
        </HoverCard.Target>

        <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
            <Stack>

                {[0, 1, 2, 3, 4, 5].map((id) =>
                    createLevelRow(id, () => { })
                )}

            </Stack>
        </HoverCard.Dropdown>
    </HoverCard>
}

export function HeaderMegaMenu() {
    const router = useRouter();

    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

    const { data } = useSession();

    const [openedDropdown, setOpenedDropdown] = useState<string | null>(null);

    const theme = useMantineTheme();

    const toggleDropdown = (dropdown: string) => {
        setOpenedDropdown(openedDropdown === dropdown ? null : dropdown);
    };

    const mobileLevelsMenu = (theme: MantineTheme) => {
        return (
            <>
                <UnstyledButton className={classes.link} onClick={() => toggleDropdown('levels')}>
                    <Center inline>
                        <Box component="span" mr={5}>
                            Уровни
                        </Box>
                        <IconChevronDown
                            style={{ width: rem(16), height: rem(16) }}
                            color={theme.colors.blue[6]}
                        />
                    </Center>
                </UnstyledButton>
                <Collapse in={openedDropdown === 'levels'}>
                    {[0, 1, 2, 3, 4, 5].map((id) => createLevelRow(id, closeDrawer))}
                </Collapse>
            </>
        );
    };

    const mobileMenuWithLevels = (theme: MantineTheme, name: string, href: string, dropdown: string) => {
        return (
            <>
                <UnstyledButton className={classes.link} onClick={() => toggleDropdown(dropdown)}>
                    <Center inline>
                        <Box component="span" mr={5}>
                            {name}
                        </Box>
                        <IconChevronDown
                            style={{ width: rem(16), height: rem(16) }}
                            color={theme.colors.blue[6]}
                        />
                    </Center>
                </UnstyledButton>
                <Collapse in={openedDropdown === dropdown}>
                    <Button.Group orientation="vertical">
                        {[0, 1, 2, 3, 4, 5].map((id) => createLevelButton(id, href, closeDrawer))}
                    </Button.Group>
                </Collapse>
            </>
        );
    };


    return (
        <Box>
            <header className={classes.header}>
                <Group justify="space-between" h="100%">
                    <MantineLogo size={30} />

                    <Group h="100%" gap={0} visibleFrom="sm">
                        <a href="/dashboard/" className={classes.link}>
                            Учить
                        </a>
                        {levelsMenu(theme)}
                        {menuWithLevels(theme, "Радикалы", '/dashboard/radicals')}
                        {menuWithLevels(theme, "Кандзи", '/dashboard/kanji')}
                        {menuWithLevels(theme, "Слова", '/dashboard/words')}
                        <ActionIcon component={Link}
                            href={`/dashboard/search`} variant="transparent">
                            <IconSearch style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </Group>
                    {(() => {

                        if (data) {
                            return <Group visibleFrom="sm">
                                <Button onClick={() => { router.push('/dashboard/profile') }} variant="default">Профиль</Button>
                            </Group>
                        } else {
                            return <Group visibleFrom="sm">
                                <Button onClick={() => { signIn() }} variant="default">Войти</Button>
                            </Group>
                        }
                    })()
                    }
                    <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
                </Group>
            </header>

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title="Навигация"
                hiddenFrom="sm"
                zIndex={1000000}
            >
                <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
                    <Divider my="sm" />

                    <a href="/dashboard/" className={classes.link} onClick={closeDrawer}>
                        Учить
                    </a>
                    {mobileLevelsMenu(theme)}
                    {mobileMenuWithLevels(theme, "Радикалы", '/dashboard/radicals', 'radicals')}
                    {mobileMenuWithLevels(theme, "Кандзи", '/dashboard/kanji', 'kanji')}
                    {mobileMenuWithLevels(theme, "Слова", '/dashboard/words', 'vocab')}

                    <UnstyledButton
                        component={Link}
                        href={`/dashboard/search`}
                        className={classes.link}
                        onClick={closeDrawer}
                    >
                        <Center inline>
                            <Box component="span" mr={5}>
                                Поиск
                            </Box>
                            <IconSearch
                                style={{ width: rem(16), height: rem(16) }}
                                color={theme.colors.blue[6]}
                            />
                        </Center>
                    </UnstyledButton>

                    <Divider my="sm" />
                    {(() => {
                        if (data) {
                            return <Button w="100%" onClick={() => {closeDrawer(); router.push('/dashboard/profile') }} variant="default">Профиль</Button>
                        } else {
                            return <Button w="100%" onClick={() => {closeDrawer(); signIn() }} variant="default">Войти</Button>
                        }
                    })()}
                </ScrollArea>
            </Drawer>
        </Box>
    );
}
