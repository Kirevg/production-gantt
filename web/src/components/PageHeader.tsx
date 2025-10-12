import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, width: '100%' }}>
            <Typography variant="h4">
                {title}
            </Typography>
            {children}
        </Box>
    );
};

export default PageHeader;
