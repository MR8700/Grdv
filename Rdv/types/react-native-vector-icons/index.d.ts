declare module 'react-native-vector-icons/Ionicons' {
  import { ComponentType } from 'react';
  import { TextStyle } from 'react-native';
  
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
    [key: string]: any;
  }
  
  const Icon: ComponentType<IconProps>;
  export default Icon;
}

