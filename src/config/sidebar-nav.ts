import {
  IconBuildingSkyscraper,
  IconChartBar,
  IconChartLine,
  IconClipboardCheck,
  IconDeviceDesktop,
  IconFlask,
  IconInbox,
  IconMail,
  IconMailAi,
  IconMessageCircle,
  IconMessageChatbot,
  IconPuzzle,
  IconReport,
  IconShieldCheck,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type NavItem = {
  title: string;
  url: string;
  icon?: ComponentType<{ className?: string }>;
  children?: NavItem[];
};

export type NavSectionConfig = {
  id: string;
  label: string;
  items: NavItem[];
};

export type Hotel = {
  id: string;
  name: string;
};

export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      {
        title: 'Manage Hotels',
        url: '/dashboard/manage-hotels',
        icon: IconBuildingSkyscraper,
        children: [
          { title: 'Organizations', url: '/dashboard/manage-hotels/organizations', icon: IconBuildingSkyscraper },
          { title: 'AI Email Access', url: '/dashboard/manage-hotels/ai-email-access', icon: IconMailAi },
          { title: 'Beta Features', url: '/dashboard/manage-hotels/beta-features', icon: IconFlask },
          { title: 'Chatbots', url: '/dashboard/manage-hotels/chatbots', icon: IconMessageChatbot },
          { title: 'Security', url: '/dashboard/manage-hotels/security', icon: IconShieldCheck },
        ],
      },
      { title: 'Manage Users', url: '/dashboard/manage-users', icon: IconUsers },
      { title: 'Onboarding', url: '/dashboard/onboarding', icon: IconDeviceDesktop },
      { title: 'Email Performance', url: '/dashboard/email-performance', icon: IconChartBar },
      { title: 'Email Training Center', url: '/dashboard/email-training-center', icon: IconFlask },
      { title: 'Report Assessments', url: '/dashboard/report-assessments', icon: IconClipboardCheck },
    ],
  },
  {
    id: 'chatbot',
    label: 'CHATBOT',
    items: [
      { title: 'Training Center', url: '/dashboard/chatbot/training-center', icon: IconMessageChatbot },
    ],
  },
  {
    id: 'email',
    label: 'EMAIL',
    items: [
      { title: 'AI Email Settings', url: '/dashboard/email/ai-settings', icon: IconMail },
    ],
  },
  {
    id: 'general',
    label: 'GENERAL',
    items: [
      { title: 'Analytics', url: '/dashboard/analytics', icon: IconChartLine },
      { title: 'Users', url: '/dashboard/users', icon: IconUser },
    ],
  },
  {
    id: 'beta',
    label: 'BETA FEATURES',
    items: [
      { title: 'Integrations', url: '/dashboard/beta/integrations', icon: IconPuzzle },
      { title: 'Reviews Reports', url: '/dashboard/beta/reviews-reports', icon: IconReport },
      { title: 'Guest Assistant', url: '/dashboard/beta/guest-assistant', icon: IconMessageCircle },
      { title: 'Email Inbox', url: '/dashboard/beta/email-inbox', icon: IconInbox },
    ],
  },
];

export const HOTELS: Hotel[] = [
  { id: '123joffeloff', name: '123Joffeloff' },
  { id: 'seaside-resort', name: 'Seaside Resort' },
  { id: 'mountain-lodge', name: 'Mountain Lodge' },
  { id: 'grand-palace', name: 'Grand Palace Hotel' },
  { id: 'azure-bay', name: 'Azure Bay Resort' },
  { id: 'cedar-inn', name: 'Cedar Inn' },
  { id: 'harbor-view', name: 'Harbor View Suites' },
  { id: 'royal-orchid', name: 'Royal Orchid' },
  { id: 'maplewood', name: 'Maplewood Retreat' },
  { id: 'sunset-beach', name: 'Sunset Beach Hotel' },
  { id: 'ivory-tower', name: 'Ivory Tower Hotel' },
  { id: 'silver-pines', name: 'Silver Pines Lodge' },
  { id: 'emerald-valley', name: 'Emerald Valley Inn' },
  { id: 'crystal-springs', name: 'Crystal Springs Resort' },
  { id: 'oceanic-grand', name: 'Oceanic Grand' },
  { id: 'the-windsor', name: 'The Windsor' },
  { id: 'lakeside-manor', name: 'Lakeside Manor' },
  { id: 'blue-horizon', name: 'Blue Horizon Resort' },
  { id: 'sandstone-plaza', name: 'Sandstone Plaza' },
  { id: 'aurora-heights', name: 'Aurora Heights Hotel' },
  { id: 'cobalt-suites', name: 'Cobalt Suites' },
  { id: 'meadowbrook', name: 'Meadowbrook Hotel' },
  { id: 'the-regency', name: 'The Regency' },
  { id: 'palm-grove', name: 'Palm Grove Resort' },
  { id: 'evergreen-lodge', name: 'Evergreen Lodge' },
  { id: 'summit-peak', name: 'Summit Peak Hotel' },
  { id: 'coastal-breeze', name: 'Coastal Breeze Inn' },
  { id: 'desert-rose', name: 'Desert Rose Hotel' },
  { id: 'willow-creek', name: 'Willow Creek Resort' },
  { id: 'the-madison', name: 'The Madison' },
  { id: 'heritage-house', name: 'Heritage House' },
  { id: 'vista-del-mar', name: 'Vista Del Mar' },
  { id: 'golden-sands', name: 'Golden Sands Resort' },
  { id: 'northern-lights', name: 'Northern Lights Hotel' },
  { id: 'the-belvedere', name: 'The Belvedere' },
  { id: 'riverside-suites', name: 'Riverside Suites' },
  { id: 'moonstone-bay', name: 'Moonstone Bay' },
  { id: 'highland-manor', name: 'Highland Manor' },
  { id: 'the-carlton', name: 'The Carlton' },
  { id: 'tropic-palms', name: 'Tropic Palms' },
  { id: 'birchwood-inn', name: 'Birchwood Inn' },
  { id: 'the-kensington', name: 'The Kensington' },
  { id: 'seashell-retreat', name: 'Seashell Retreat' },
  { id: 'ruby-crown', name: 'Ruby Crown Hotel' },
  { id: 'stonebridge', name: 'Stonebridge Hotel' },
  { id: 'the-avalon', name: 'The Avalon' },
  { id: 'coral-reef', name: 'Coral Reef Resort' },
  { id: 'whispering-pines', name: 'Whispering Pines' },
  { id: 'the-fairmont', name: 'The Fairmont' },
  { id: 'glacier-peak', name: 'Glacier Peak Lodge' },
  { id: 'sapphire-shores', name: 'Sapphire Shores' },
  { id: 'the-monarch', name: 'The Monarch' },
  { id: 'orchard-hills', name: 'Orchard Hills Inn' },
  { id: 'baywatch-hotel', name: 'Baywatch Hotel' },
  { id: 'the-metropolitan', name: 'The Metropolitan' },
  { id: 'lavender-fields', name: 'Lavender Fields Hotel' },
  { id: 'the-continental', name: 'The Continental' },
  { id: 'pinecrest-resort', name: 'Pinecrest Resort' },
  { id: 'the-savoy', name: 'The Savoy' },
  { id: 'oakwood-lodge', name: 'Oakwood Lodge' },
  { id: 'marina-grand', name: 'Marina Grand' },
  { id: 'the-sheraton-west', name: 'The Sheraton West' },
  { id: 'amberleaf-inn', name: 'Amberleaf Inn' },
  { id: 'the-hilltop', name: 'The Hilltop' },
  { id: 'starlight-suites', name: 'Starlight Suites' },
  { id: 'old-mill-hotel', name: 'Old Mill Hotel' },
  { id: 'the-westbrook', name: 'The Westbrook' },
  { id: 'bamboo-garden', name: 'Bamboo Garden Resort' },
  { id: 'cliffside-retreat', name: 'Cliffside Retreat' },
  { id: 'the-plaza-royal', name: 'The Plaza Royal' },
  { id: 'twilight-cove', name: 'Twilight Cove' },
  { id: 'the-grandview', name: 'The Grandview' },
  { id: 'ferngully-lodge', name: 'Ferngully Lodge' },
  { id: 'dunes-resort', name: 'Dunes Resort' },
  { id: 'the-ambassador', name: 'The Ambassador' },
  { id: 'silverlake-inn', name: 'Silverlake Inn' },
  { id: 'the-waverley', name: 'The Waverley' },
  { id: 'redwood-manor', name: 'Redwood Manor' },
  { id: 'pebble-beach', name: 'Pebble Beach Hotel' },
  { id: 'the-clarendon', name: 'The Clarendon' },
  { id: 'seabreeze-suites', name: 'Seabreeze Suites' },
  { id: 'mountain-mist', name: 'Mountain Mist Lodge' },
  { id: 'the-arlington', name: 'The Arlington' },
  { id: 'magnolia-manor', name: 'Magnolia Manor' },
  { id: 'alpine-chalet', name: 'Alpine Chalet Hotel' },
  { id: 'the-worthington', name: 'The Worthington' },
  { id: 'tide-pool-inn', name: 'Tide Pool Inn' },
  { id: 'the-palladium', name: 'The Palladium' },
  { id: 'windmill-cove', name: 'Windmill Cove' },
  { id: 'cypress-gardens', name: 'Cypress Gardens' },
  { id: 'the-stratford', name: 'The Stratford' },
  { id: 'frosthaven-lodge', name: 'Frosthaven Lodge' },
  { id: 'paradise-cay', name: 'Paradise Cay Resort' },
  { id: 'the-lancaster', name: 'The Lancaster' },
  { id: 'hillcrest-hotel', name: 'Hillcrest Hotel' },
  { id: 'moonlight-bay', name: 'Moonlight Bay' },
  { id: 'the-davenport', name: 'The Davenport' },
  { id: 'whitepine-resort', name: 'Whitepine Resort' },
  { id: 'the-kingsley', name: 'The Kingsley' },
  { id: 'rosewood-inn', name: 'Rosewood Inn' },
];
