declare module 'react-native' {
  import { ComponentType, ReactNode } from 'react';

  export const View: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const TouchableOpacity: ComponentType<any>;
  export const ActivityIndicator: ComponentType<any>;
  export const FlatList: ComponentType<any>;
  export const RefreshControl: ComponentType<any>;
  export const Modal: ComponentType<any>;
  export const TextInput: ComponentType<any>;
  export const Switch: ComponentType<any>;
  export const Animated: {
    View: ComponentType<any>;
    Value: any;
    timing: any;
    sequence: any;
  };
  export const Vibration: any;
  export const Alert: any;
  export const StyleSheet: any;
}

declare namespace Animated {
  export class Value {
    constructor(value: number);
  }
  export function timing(value: any, config: any): any;
  export function sequence(animations: any[]): any;
}