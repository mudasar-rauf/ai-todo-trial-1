import { AppShell } from '@astryxdesign/core/AppShell';
import { Theme } from '@astryxdesign/core/theme';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { APP_NAME } from './appName';
import { isTasksEnabled } from './flags';
import { TaskScreen } from './tasks/TaskScreen';
import { TaskScreenErrorBoundary } from './tasks/TaskScreenErrorBoundary';

export default function App() {
  return (
    <Theme theme={neutralTheme}>
      <AppShell
        topNav={<TopNav heading={<TopNavHeading heading={APP_NAME} />} />}
        mobileNav={false}
        // The task screen, behind VITE_FF_TASKS (off by default); with the flag off the main region is empty.
        // The boundary sits inside main, so an error in the task screen leaves the banner in place.
        children={
          isTasksEnabled() ? (
            <TaskScreenErrorBoundary>
              <TaskScreen />
            </TaskScreenErrorBoundary>
          ) : null
        }
      />
    </Theme>
  );
}
