// Feature flags: build-time environment variables named VITE_FF_<FEATURE>, on only when "true".

/** The task screen (#4 and the features built on it). Off unless VITE_FF_TASKS is "true". */
export function isTasksEnabled(): boolean {
  return import.meta.env.VITE_FF_TASKS === 'true';
}
