import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

let fontLoaded = false;

function ensureIconFontLoaded() {
  if (fontLoaded) return;
  const iconSet = Ionicons as any;
  iconSet.loadFont?.();
  fontLoaded = true;
}

export function AppIcon({ name, size = 20, color, style }: AppIconProps) {
  React.useEffect(() => {
    ensureIconFontLoaded();
  }, []);

  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
