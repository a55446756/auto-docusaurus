import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'FiOS',
  tagline: 'See more. Bid more. Win more.',
  favicon: 'img/favicon.ico',

  url: 'https://fios.eolassolutions.com.au',
  baseUrl: '/',

  organizationName: 'eolas-solutions',
  projectName: 'fios-website',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'knowledge-base',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/fios-social-card.jpg',
    navbar: {
      title: '',
      logo: {
        alt: 'FiOS Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          label: 'About',
          position: 'left',
          activeBaseRegex: '^/never-match-this$',
        },
        {
          to: '/',
          label: 'Solutions',
          position: 'left',
          activeBaseRegex: '^/never-match-this$',
        },
        {
          to: '/story',
          label: 'Our Story',
          position: 'left',
        },
        {
          to: '/',
          label: 'Getting Started',
          position: 'left',
          activeBaseRegex: '^/never-match-this$',
        },
        {
          to: '/',
          label: 'Book a Demo',
          position: 'right',
          className: 'navbar-cta',
          activeBaseRegex: '^/never-match-this$',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Platform',
          items: [
            {
              label: 'About',
              to: '/',
            },
            {
              label: 'Solutions',
              to: '/',
            },
            {
              label: 'Our Story',
              to: '/story',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Knowledge Base',
              to: '/knowledge-base/intro',
            },
            {
              label: 'Getting Started',
              to: '/',
            },
          ],
        },
        {
          title: 'Contact',
          items: [
            {
              label: 'Book a Demo',
              to: '/',
            },
            {
              label: 'Email Us',
              href: 'mailto:fios@eolassolutions.com.au',
            },
          ],
        },
      ],
      copyright: `Built in Canberra by consultants, for consultants. © ${new Date().getFullYear()} Eolas Solutions.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
