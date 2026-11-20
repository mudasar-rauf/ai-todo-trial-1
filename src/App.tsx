import { AppShell } from '@astryxdesign/core/AppShell';
import { Theme } from '@astryxdesign/core/theme';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { APP_NAME } from './appName';

export default function App() {
  return (
    <Theme theme={neutralTheme}>
      <AppShell
        topNav={<TopNav heading={<TopNavHeading heading={APP_NAME} />} />}
        mobileNav={false}
        // The task screen mounts here (a later issue); until then the main region is empty.
        children={null}
      />
    </Theme>
  );
}
