import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  knowledgeBaseSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Modules',
      items: ['opportunity-tracker', 'talent-wall', 'bid-builder'],
    },
  ],
};

export default sidebars;
