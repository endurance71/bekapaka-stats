import { ReactNode } from 'react';
import PageContainer from '../../shared/ui/PageContainer';
import { CardGrid, MainAside } from '../../shared/ui/PageLayout';

interface DashboardLayoutProps {
    header: ReactNode;
    hero: ReactNode;
    main: ReactNode;
    sidebar?: ReactNode;
}

/** Start: nagłówek → rząd kart (równe wysokości, kolumny wg szerokości) → treść + kolumna boczna. */
export default function DashboardLayout({ header, hero, main, sidebar }: DashboardLayoutProps) {
    return (
        <PageContainer>
            {header}
            <CardGrid min={340}>{hero}</CardGrid>
            {sidebar ? <MainAside aside={sidebar}>{main}</MainAside> : main}
        </PageContainer>
    );
}
