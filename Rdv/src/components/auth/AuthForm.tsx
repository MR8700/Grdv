import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { AppButton } from '../ui/AppButton';
import { FormInput } from '../forms/FormInput';
import { PasswordFieldAnimated } from '../forms/PasswordFieldAnimated';
import { AppDropdown, DropdownOption } from '../shared/AppDropdown';
import { AuthFormData } from '../../types/models.types';
import { pickImageFromLibrary } from '../../utils/mediaPicker';

export type { AuthFormData } from '../../types/models.types';

type RegisterRole = 'patient' | 'medecin' | 'secretaire';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading: boolean;
  onSwitchMode?: () => void;
  registerRole?: RegisterRole;
  serviceOptions?: DropdownOption[];
}

const BLOOD_GROUP_OPTIONS: DropdownOption[] = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
];

const loginSchema = yup.object({
  login: yup.string().required('Identifiant requis'),
  password: yup.string().min(6, 'Minimum 8 caractères').required('Mot de passe requis'),
  photo_asset: yup.mixed().optional(),
});

function buildRegisterSchema(role: RegisterRole) {
  return yup.object({
    login: yup.string().required('Identifiant requis'),
    nom: yup.string().required('Nom requis'),
    prenom: yup.string().required('Prénom requis'),
    email: yup.string().email('Email invalide').required('Email requis'),
    password: yup
      .string()
      .required('Mot de passe requis')
      .min(8, 'Minimum 8 caracteres')
      .matches(/[A-Z]/, 'Une majuscule requise')
      .matches(/[a-z]/, 'Une minuscule requise')
      .matches(/[0-9]/, 'Un chiffre requis')
      .matches(/[^A-Za-z0-9]/, 'Un caractere special requis'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
      .required('Confirmation requise'),
    code_rpps:
      role === 'medecin'
        ? yup.string().required('Le code RPPS est requis')
        : yup.string().optional(),
    specialite_principale: yup.string().optional(),
    id_service_affecte: yup.string().optional(),
    id_services_affectes:
      role === 'secretaire'
        ? yup.array().of(yup.string().required()).min(1, 'Selectionnez au moins un service')
        : yup.array().of(yup.string().required()).optional(),
    num_secu_sociale: yup.string().optional(),
    groupe_sanguin: yup.string().optional(),
    photo_path: yup.string().optional(),
    photo_asset: yup.mixed().optional(),
  });
}

export const AuthForm = ({
  mode,
  onSubmit,
  loading,
  onSwitchMode,
  registerRole = 'patient',
  serviceOptions = [],
}: AuthFormProps) => {
  const { colors } = useTheme();
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const schema = useMemo(
    () => (mode === 'login' ? loginSchema : buildRegisterSchema(registerRole)),
    [mode, registerRole]
  );

  const { control, handleSubmit, reset, watch, setValue } = useForm<AuthFormData>({
    resolver: yupResolver(schema as any),
    defaultValues: {
      login: '',
      password: '',
      nom: '',
      prenom: '',
      email: '',
      confirmPassword: '',
      photo_path: '',
      code_rpps: '',
      specialite_principale: '',
      id_service_affecte: '',
      id_services_affectes: [],
      num_secu_sociale: '',
      groupe_sanguin: undefined,
      type_user: registerRole,
      photo_asset: undefined,
    },
  });

  const photoPreview = watch('photo_path');
  const selectedServiceIds = watch('id_services_affectes') || [];

  React.useEffect(() => {
    setValue('type_user', registerRole);
    if (registerRole !== 'secretaire') {
      setValue('id_services_affectes', []);
      setValue('id_service_affecte', '');
    }
  }, [registerRole, setValue]);

  const pickProfilePhoto = async () => {
    try {
      setPhotoError(null);
      const asset = await pickImageFromLibrary();
      if (!asset) return;

      setValue('photo_path', asset.uri, { shouldDirty: true, shouldTouch: true });
      setValue('photo_asset', asset as any, { shouldDirty: true });
    } catch (err: any) {
      setPhotoError(err?.message ?? 'Impossible de selectionner cette photo.');
    }
  };

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      id_service_affecte: data.id_services_affectes?.[0] || '',
      type_user: registerRole,
    } as AuthFormData);
    if (mode === 'register') {
      reset({
        login: '',
        password: '',
        nom: '',
        prenom: '',
        email: '',
        confirmPassword: '',
        photo_path: '',
        code_rpps: '',
        specialite_principale: '',
        id_service_affecte: '',
        id_services_affectes: [],
        num_secu_sociale: '',
        groupe_sanguin: undefined,
        type_user: registerRole,
        photo_asset: undefined,
      });
      onSwitchMode?.();
    }
  });

  const toggleService = (serviceId: string) => {
    const nextValues = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((value) => value !== serviceId)
      : [...selectedServiceIds, serviceId];

    setValue('id_services_affectes', nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('id_service_affecte', nextValues[0] || '', { shouldDirty: true });
  };

  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </Text>

      <FormInput
        name="login"
        control={control as any}
        label="Identifiant"
        placeholder="Ex: jean.mare"
        autoCapitalize="none"
      />

      {mode === 'register' && (
        <>
          <FormInput name="nom" control={control as any} label="Nom" placeholder="Ex: MARE" />
          <FormInput name="prenom" control={control as any} label="Prénom" placeholder="Ex: Jean" />
          <FormInput
            name="email"
            control={control as any}
            label="Email"
            placeholder="Ex: jean.mare@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Photo de profil optionnelle</Text>
            <TouchableOpacity
              onPress={pickProfilePhoto}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${colors.primary}18`,
                }}
              >
                <Ionicons name="image-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  Galerie native via react-native-image-picker
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {photoPreview ? (
            <View
              style={{
                marginTop: -8,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Image source={{ uri: photoPreview }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
            </View>
          ) : null}
          {photoError ? (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 16 }}>{photoError}</Text>
          ) : null}

          {registerRole === 'medecin' && (
            <>
              <FormInput
                name="code_rpps"
                control={control as any}
                label="Code RPPS"
                placeholder="Numero RPPS"
                autoCapitalize="none"
              />
              <FormInput
                name="specialite_principale"
                control={control as any}
                label="Specialité principale"
                placeholder="Ex: Cardiologie"
              />
            </>
          )}

          {registerRole === 'secretaire' && (
            <Controller
              control={control as any}
              name="id_services_affectes"
              render={({ fieldState: { error } }) => (
                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>
                    Services affectes
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                    Un sécrétaire peut être rattaché à un ou plusieurs services.
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {serviceOptions.map((service) => {
                      const selected = selectedServiceIds.includes(service.value);

                      return (
                        <TouchableOpacity
                          key={service.value}
                          onPress={() => toggleService(service.value)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? `${colors.primary}18` : colors.surfaceAlt,
                          }}
                        >
                          <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: '700' }}>
                            {service.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {error?.message ? (
                    <Text style={{ color: colors.danger, marginTop: 8, fontSize: 12 }}>{error.message}</Text>
                  ) : null}
                </View>
              )}
            />
          )}

          {registerRole === 'patient' && (
            <>
              <FormInput
                name="num_secu_sociale"
                control={control as any}
                label="Numero de sécurité sociale"
                placeholder="Optionnel"
                autoCapitalize="none"
              />
              <Controller
                control={control as any}
                name="groupe_sanguin"
                render={({ field: { value, onChange } }) => (
                  <AppDropdown
                    label="Groupe sanguin"
                    value={value || ''}
                    onValueChange={onChange}
                    options={[{ label: 'Non renseigné', value: '' }, ...BLOOD_GROUP_OPTIONS]}
                  />
                )}
              />
            </>
          )}
        </>
      )}

      <Controller
        control={control as any}
        name="password"
        render={({ field: { value, onChange } }) => (
          <PasswordFieldAnimated
            value={value || ''}
            onChangeText={onChange}
            showChecklist={mode === 'register'}
            label="Mot de passe"
          />
        )}
      />

      {mode === 'register' && (
        <FormInput
          name="confirmPassword"
          control={control as any}
          label="Confirmer votre mot de passe"
          placeholder="Retapez votre mot de passe"
          secureTextEntry
        />
      )}

      <AppButton
        label={mode === 'login' ? 'Se connecter' : "S'inscrire"}
        onPress={submit}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: 12 }}
      />

      {onSwitchMode && (
        <TouchableOpacity onPress={onSwitchMode} style={{ marginTop: 14 }}>
          <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '700' }}>
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
