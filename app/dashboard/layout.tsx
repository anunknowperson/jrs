'use client';

import { AppShell, Box, Center, Flex } from '@mantine/core';
import { HeaderMegaMenu } from './Header';
import classes from './Layout.module.css';
import { useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const searchParams = useSearchParams();
    const hideHeader = searchParams.get('embed') === '1';

    const mobile = useMediaQuery('(max-width: 1200px)');

    return (
        <AppShell
            header={hideHeader ? undefined : { height: 60 }}
            padding={mobile ? "0px" : "md"}
        >
            {!hideHeader && (
                <AppShell.Header>
                    <HeaderMegaMenu />
                </AppShell.Header>
            )}
            <AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Flex style={{ flex: 1 }}>
                    <Center w="100%">
                        <Box className={classes.body}>
                            {children}
                        </Box>
                    </Center>
                </Flex>
            </AppShell.Main>
        </AppShell>
    )
}