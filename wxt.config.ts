import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      'storage',
      'unlimitedStorage',
      'activeTab',
      'scripting',
      'contextMenus',
      ...(browser === 'firefox' ? [] : ['favicon']),
    ],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [{ resources: ['fonts/*', 'icon/*'], matches: ['<all_urls>'] }],
    commands: {
      'toggle-canvas': {
        suggested_key: { default: 'Alt+Shift+P' },
        description: '__MSG_commandToggleCanvas__',
      },
      'toggle-visibility': {
        suggested_key: { default: 'Alt+Shift+H' },
        description: '__MSG_commandToggleVisibility__',
      },
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: { id: 'overlayer@overlayer.app', strict_min_version: '128.0' },
      },
    }),
  }),
});
