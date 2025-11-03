import React from 'react';
import { TextField } from '@mui/material';
import { formatPhoneInput } from '../utils/phoneUtils';

// Компонент для ввода телефона с маской
const PhoneInput = React.forwardRef<HTMLInputElement, {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    sx?: object;
}>(({ value, onChange, placeholder, required, sx }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneInput(e.target.value);
        onChange(formatted);
    };

    return (
        <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder || "+7 999 999-99-99"}
            required={required}
            sx={sx}
            ref={ref}
            value={value}
            onChange={handleChange}
            inputProps={{
                maxLength: 18 // +7 999 999-99-99
            }}
        />
    );
});

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;

