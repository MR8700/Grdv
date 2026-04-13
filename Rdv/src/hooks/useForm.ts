import { useCallback, useMemo } from 'react';
import { DefaultValues, FieldValues, Resolver, useForm, UseFormReturn } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export interface UseFormOptions<T extends FieldValues> {
  schema?: yup.ObjectSchema<any>;
  defaultValues?: DefaultValues<T> | (() => DefaultValues<T>);
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'all';
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
}

export function useFormWithValidation<T extends FieldValues>(
  options: UseFormOptions<T> = {}
): UseFormReturn<T> & {
  resetForm: (values?: DefaultValues<T>) => void;
} {
  const { schema, defaultValues, mode = 'onSubmit', reValidateMode = 'onChange' } = options;

  // ✅ Resolver memoisé pour éviter les recalculs inutiles
  const resolver: Resolver<T> | undefined = useMemo(
    () => (schema ? (yupResolver(schema) as Resolver<T>) : undefined),
    [schema]
  );

  // ✅ Initialisation du formulaire
  const form = useForm<T>({
    resolver,
    defaultValues: typeof defaultValues === 'function' ? defaultValues() : defaultValues,
    mode,
    reValidateMode,
  });

  // ✅ Reset flexible : peut utiliser des valeurs spécifiques ou valeurs par défaut
  const resetForm = useCallback(
    (values?: DefaultValues<T>) => {
      form.reset(values ?? (typeof defaultValues === 'function' ? defaultValues() : defaultValues));
    },
    [defaultValues, form]
  );

  return {
    ...form,
    resetForm,
  };
}