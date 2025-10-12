import React from 'react';
import { Button } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface VolumeButtonProps extends Omit<React.ComponentProps<typeof Button>, 'color' | 'sx'> {
    color?: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'cyan';
    children: React.ReactNode;
    htmlFor?: string;
    sx?: SxProps<Theme>;
}

const VolumeButton: React.FC<VolumeButtonProps> = ({
    color = 'blue',
    children,
    sx = {},
    htmlFor,
    ...props
}) => {
    const getColorStyles = (color: string): SxProps<Theme> => {
        switch (color) {
            case 'green':
                return {
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: '2px solid #388e3c',
                    '&:hover': {
                        backgroundColor: '#45a049'
                    },
                    '&.Mui-disabled': {
                        backgroundColor: '#4caf50',
                        color: 'white',
                        opacity: 0.6
                    }
                };
            case 'red':
                return {
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: '2px solid #d32f2f',
                    '&:hover': {
                        backgroundColor: '#e53935'
                    }
                };
            case 'blue':
                return {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: '2px solid #1565c0',
                    '&:hover': {
                        backgroundColor: '#1565c0'
                    }
                };
            case 'orange':
                return {
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: '2px solid #f57c00',
                    '&:hover': {
                        backgroundColor: '#f57c00'
                    }
                };
            case 'purple':
                return {
                    backgroundColor: '#9c27b0',
                    color: 'white',
                    border: '2px solid #7b1fa2',
                    '&:hover': {
                        backgroundColor: '#7b1fa2'
                    }
                };
            case 'cyan':
                return {
                    backgroundColor: '#00bcd4',
                    color: 'white',
                    border: '2px solid #0097a7',
                    '&:hover': {
                        backgroundColor: '#0097a7'
                    }
                };
            default:
                return {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: '2px solid #1565c0',
                    '&:hover': {
                        backgroundColor: '#1565c0'
                    }
                };
        }
    };

    const volumeStyles: SxProps<Theme> = {
        fontSize: '14px',
        textTransform: 'none',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        minWidth: '120px',
        height: '40px', // Фиксированная высота для всех кнопок
        padding: '8px 16px', // Фиксированный padding
        '&:hover': {
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-1px)'
        },
        '&:active': {
            transform: 'none !important',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2) !important'
        },
        '&:focus': {
            outline: 'none !important'
        },
        transition: 'all 0.2s ease-in-out'
    };


    return (
        <Button
            {...props}
            sx={[
                volumeStyles,
                getColorStyles(color),
                ...(Array.isArray(sx) ? sx : [sx])
            ]}
        >
            {children}
        </Button>
    );
};

export default VolumeButton;
