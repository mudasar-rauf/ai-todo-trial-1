import { AppShell } from '@astryxdesign/core/AppShell';
import { Theme } from '@astryxdesign/core/theme';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { APP_NAME } from './appName';
import { isTasksEnabled } from './flags';
import { TaskScreen } from './tasks/TaskScreen';

export default function App() {
  return (
    <Theme theme={neutralTheme}>
      <AppShell
        topNav={<TopNav heading={<TopNavHeading heading={APP_NAME} />} />}
        mobileNav={false}
        // The task screen, behind VITE_FF_TASKS (off by default); with the flag off the main region is empty.
        children={isTasksEnabled() ? <TaskScreen /> : null}
      />
    </Theme>
  );
}
