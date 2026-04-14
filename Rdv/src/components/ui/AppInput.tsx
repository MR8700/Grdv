import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, interpolateColor } from 'react-native-reanimated';

import { useTheme } from '../../store/ThemeContext';
import { Toast } from './AppAlert';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  required?: boolean;
  historyEnabled?: boolean;
}

function AppInputComponent({
  label,
  error,
  containerStyle,
  rightIcon,
  onRightPress,
  required,
  onChangeText,
  value,
  style,
  placeholder,
  historyEnabled = true,
  ...props
}: AppInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const stringValue = value === undefined || value === null ? '' : String(value);
  const sensitiveInput =
    props.secureTextEntry ||
    String(props.textContentType || '').toLowerCase().includes('password') ||
    String(props.autoComplete || '').toLowerCase().includes('password') ||
    props.editable === false;
  const historyActive = historyEnabled && !sensitiveInput;
  const historyActionRef = React.useRef(false);
  const [history, setHistory] = useState<{ stack: string[]; index: number }>({
    stack: [stringValue],
    index: 0,
  });

  const labelAnim = useSharedValue(stringValue ? 1 : 0);
  const focusAnim = useSharedValue(0);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(labelAnim.value, [0, 1], [10, -14]) },
      { scale: interpolate(labelAnim.value, [0, 1], [1, 0.78]) },
    ],
    color: interpolateColor(labelAnim.value, [0, 1], [colors.textMuted, colors.primary]),
  }));

  const containerAnim = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : interpolateColor(focusAnim.value, [0, 1], [colors.border, colors.primary]),
    borderWidth: interpolate(focusAnim.value, [0, 1], [1, 2]),
    transform: [{ scale: interpolate(focusAnim.value, [0, 1], [1, 1.01]) }],
  }));

  const onFocus = React.useCallback(() => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 180 });
    labelAnim.value = withTiming(1, { duration: 180 });
  }, [focusAnim, labelAnim]);

  const onBlur = React.useCallback(() => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 180 });

    if (!stringValue) {
      labelAnim.value = withTiming(0, { duration: 180 });
    }
  }, [focusAnim, labelAnim, stringValue]);

  React.useEffect(() => {
    const hasValue = stringValue.length > 0;
    labelAnim.value = withTiming(hasValue || focused ? 1 : 0, { duration: 140 });
  }, [focused, labelAnim, stringValue]);

  React.useEffect(() => {
    if (!historyActive) return;
    if (historyActionRef.current) {
      historyActionRef.current = false;
      return;
    }

    setHistory((prev) => {
      if (prev.stack[prev.index] === stringValue) return prev;
      const base = prev.stack.slice(0, prev.index + 1);
      const nextStack = [...base, stringValue];
      if (nextStack.length > 60) nextStack.shift();
      return { stack: nextStack, index: nextStack.length - 1 };
    });
  }, [historyActive, stringValue]);

  const applyHistory = React.useCallback(
    (type: 'undo' | 'redo') => {
      if (!historyActive || !onChangeText) return;
      const nextIndex = type === 'undo' ? history.index - 1 : history.index + 1;
      if (nextIndex < 0 || nextIndex >= history.stack.length) return;
      const nextValue = history.stack[nextIndex];
      historyActionRef.current = true;
      setHistory((prev) => ({ ...prev, index: nextIndex }));
      onChangeText(nextValue);
      Toast.info('Historique', type === 'undo' ? 'Retour de saisie' : 'Avance de saisie', 1200);
    },
    [history.index, history.stack, historyActive, onChangeText]
  );

  const controlsVisible = historyActive && focused;
  const canUndo = controlsVisible && history.index > 0;
  const canRedo = controlsVisible && history.index < history.stack.length - 1;
  const rightPadding = (controlsVisible ? 66 : 0) + (rightIcon ? 42 : 0);

  return (
    <View style={[{ marginBottom: 22 }, containerStyle]}>
      <Animated.View
        style={[
          {
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingTop: 22,
            paddingBottom: 10,
            backgroundColor: colors.surface,
            position: 'relative',
            minHeight: 64,
            shadowColor: '#000',
            shadowOpacity: focused ? 0.08 : 0.04,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: focused ? 4 : 2,
          },
          containerAnim,
        ]}
      >
        <Animated.Text
          style={[
            {
              position: 'absolute',
              left: 16,
              top: 22,
              fontSize: 15,
              fontWeight: '500',
              letterSpacing: 0.2,
            },
            labelStyle,
          ]}
        >
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Animated.Text>

        <TextInput
          {...props}
          value={stringValue}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={focused ? placeholder : undefined}
          placeholderTextColor={colors.textLight}
          style={[
            {
              fontSize: 15,
              color: colors.text,
              marginTop: 6,
              padding: 0,
              paddingRight: rightPadding,
            },
            style,
          ]}
        />

        {controlsVisible ? (
          <View
            style={{
              position: 'absolute',
              right: rightIcon ? 54 : 12,
              top: 20,
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <TouchableOpacity
              onPress={() => applyHistory('undo')}
              disabled={!canUndo}
              style={{
                borderRadius: 8,
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canUndo ? `${colors.primary}18` : `${colors.border}40`,
                borderWidth: 1,
                borderColor: canUndo ? `${colors.primary}22` : colors.border,
              }}
            >
              <Ionicons name="arrow-undo" size={14} color={canUndo ? colors.primary : colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => applyHistory('redo')}
              disabled={!canRedo}
              style={{
                borderRadius: 8,
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canRedo ? `${colors.primary}18` : `${colors.border}40`,
                borderWidth: 1,
                borderColor: canRedo ? `${colors.primary}22` : colors.border,
              }}
            >
              <Ionicons name="arrow-redo" size={14} color={canRedo ? colors.primary : colors.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={{
              position: 'absolute',
              right: 12,
              top: 22,
              padding: 6,
              borderRadius: 8,
            }}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: 12,
            marginTop: 6,
            marginLeft: 4,
            fontWeight: '500',
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export const AppInput = React.memo(AppInputComponent);
