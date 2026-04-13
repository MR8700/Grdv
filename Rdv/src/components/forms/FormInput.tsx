// components/forms/FormInput.tsx
import React from 'react';
import { AppInput } from '../ui/AppInput';
import { Controller, Control } from 'react-hook-form';

interface FormInputProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export const FormInput = ({
  name,
  control,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightPress,
}: FormInputProps) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <AppInput
          label={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          error={error?.message}
          rightIcon={rightIcon}
          onRightPress={onRightPress}
        />
      )}
    />
  );
};
