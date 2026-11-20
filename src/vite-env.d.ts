/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Turns the task screen on when "true". Off by default. */
  readonly VITE_FF_TASKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
