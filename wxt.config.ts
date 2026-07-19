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
    action: {
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
    },
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
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: { id: 'overlayer@overlayer.app', strict_min_version: '128.0' },
      },
      browser_action: {
        default_icon: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
      },
    }),
  }),
});
