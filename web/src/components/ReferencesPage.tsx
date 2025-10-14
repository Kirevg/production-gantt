import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import NomenclaturePage from './NomenclaturePage';
import CounterpartiesPage from './CounterpartiesPage';
import PersonsPage from './PersonsPage';
import UnitsPage from './UnitsPage';
import NomenclatureKindsPage from './NomenclatureKindsPage';
import ProductsCatalogPage from './ProductsCatalogPage';

interface ReferencesPageProps {
    canEdit: () => boolean;
    canCreate: () => boolean;
    canDelete: () => boolean;
}

const ReferencesPage: React.FC<ReferencesPageProps> = ({
    canEdit,
    canCreate,
    canDelete
}) => {
    const [currentSubTab, setCurrentSubTab] = useState(0);

    const handleSubTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentSubTab(newValue);
    };

    const renderSubTabContent = () => {
        switch (currentSubTab) {
            case 0: // Изделия
                return <ProductsCatalogPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            case 1: // Номенклатура
                return <NomenclaturePage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            case 2: // Контрагенты
                return <CounterpartiesPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            case 3: // Физические лица
                return <PersonsPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            case 4: // Единицы измерения
                return <UnitsPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            case 5: // Виды номенклатуры
                return <NomenclatureKindsPage canEdit={canEdit} canCreate={canCreate} canDelete={canDelete} />;
            default:
                return null;
        }
    };

    return (
        <Box>
            {/* Вложенные вкладки справочников */}
            <Tabs
                value={currentSubTab}
                onChange={handleSubTabChange}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: '#f5f5f5',
                    '& .MuiTab-root': {
                        color: '#666',
                        fontWeight: 500,
                        '&.Mui-selected': {
                            color: '#1976d2',
                            fontWeight: 600,
                        }
                    }
                }}
            >
                <Tab label="Изделия" />
                <Tab label="Номенклатура" />
                <Tab label="Контрагенты" />
                <Tab label="Физические лица" />
                <Tab label="Единицы измерения" />
                <Tab label="Виды номенклатуры" />
            </Tabs>

            {/* Содержимое выбранной вкладки */}
            <Box sx={{ mt: 0 }}>
                {renderSubTabContent()}
            </Box>
        </Box>
    );
};

export default ReferencesPage;

