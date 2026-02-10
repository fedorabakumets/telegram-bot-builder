// client/src/types/ansi-to-react.d.ts
declare module 'ansi-to-react' {
  import { Component } from 'react';

  interface AnsiProps {
    children: string;
    className?: string;
    linkify?: boolean | 'detect' | 'never';
    useClasses?: boolean;
  }

  export default class Ansi extends Component<AnsiProps> {}
}