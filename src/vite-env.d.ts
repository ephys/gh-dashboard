// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />

declare module 'csstype' {
  interface Properties {
    // Allow any CSS Custom Properties
    [index: `--${string}`]: any;
  }
}
