import React, { useMemo, useState } from 'react';
import { Text, View, ViewStyle, TouchableOpacity, FlatList, Pressable, Animated, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';

export interface DropdownOption {
  label: string;
  value: string;
}

interface AppDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onValueChange: (value: string) => void;
  containerStyle?: ViewStyle;
}

function AppDropdownComponent({ label, value, options, onValueChange, containerStyle }: AppDropdownProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const animValue = useMemo(() => new Animated.Value(0), []);

  const openDropdown = React.useCallback(() => {
    setOpen(true);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animValue]);

  const closeDropdown = React.useCallback(() => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  }, [animValue]);

  const selectedLabel = useMemo(() => options.find((o) => o.value === value)?.label || 'Selectionner', [options, value]);
  const dropdownTranslate = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 0],
      }),
    [animValue]
  );

  const renderItem = React.useCallback(
    ({ item }: { item: DropdownOption }) => {
      const selected = item.value === value;

      return (
        <Pressable
          onPress={() => {
            onValueChange(item.value);
            closeDropdown();
          }}
          style={({ pressed }) => ({
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: pressed || selected ? `${colors.primary}14` : 'transparent',
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          })}
        >
          <Text style={{ color: selected ? colors.primary : colors.text, fontSize: 15, fontWeight: selected ? '800' : '500' }}>
            {item.label}
          </Text>
          {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
        </Pressable>
      );
    },
    [closeDropdown, colors.border, colors.primary, colors.text, onValueChange, value]
  );

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{label}</Text>

      <TouchableOpacity
        onPress={openDropdown}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeDropdown}>
        <Pressable
          onPress={closeDropdown}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
        >
          <Animated.View
            style={{
              opacity: animValue,
              transform: [{ translateY: dropdownTranslate }],
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: '70%',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{label}</Text>
              <TouchableOpacity onPress={closeDropdown} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              renderItem={renderItem}
              initialNumToRender={12}
              maxToRenderPerBatch={16}
              windowSize={5}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

export const AppDropdown = React.memo(AppDropdownComponent);
