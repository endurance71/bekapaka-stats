import { PLUGIN_ID } from './pluginId';
import { Images } from '@strapi/icons';

const permissions = [
  { action: 'plugin::upload.read', subject: null },
  { action: 'plugin::upload.assets.update', subject: null },
];

export default {
  register(app) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: Images,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Narzędzia mediów',
      },
      Component: async () => {
        const mod = await import('./pages/App');
        return mod;
      },
      permissions,
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
    });
  },
  bootstrap() {},
  async registerTrads({ locales }) {
    return [];
  },
};
