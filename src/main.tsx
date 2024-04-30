import { BaseStyles, ThemeProvider, useTheme } from '@primer/react';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppConfigurationProvider } from './app-configuration.tsx';
import { DevopsAvatarProvider } from './devops-avatar-provider.tsx';
import { Layout } from './layout.tsx';
import './main.scss';
import { Dashboard } from './pages/dashboard.tsx';
import { Settings } from './pages/settings.tsx';
import { UrqlProvider } from './urql/urql.provider.tsx';

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <AppConfigurationProvider>
      <UrqlProvider>
        <DevopsAvatarProvider>
          <ThemeProvider colorMode="dark" nightScheme="dark" dayScheme="light">
            <RootThemeSync />
            <BaseStyles>
              <HashRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/d/:tabSlug" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </HashRouter>
            </BaseStyles>
          </ThemeProvider>
        </DevopsAvatarProvider>
      </UrqlProvider>
    </AppConfigurationProvider>
  </React.StrictMode>,
);

function RootThemeSync() {
  const { colorMode, nightScheme } = useTheme();

  useEffect(() => {
    document.documentElement.dataset.colorMode = colorMode;
    document.documentElement.dataset.darkTheme = nightScheme;
  }, [colorMode, nightScheme]);

  return null;
}
