import type { SimpleTFunction } from '#common/ui/hooks/use_translation'

import {
  Braces,
  ClipboardList,
  FileCode,
  History,
  HardDrive,
  KeyRound,
  Layers,
  LayoutDashboard,
  Radio,
  LogOut,
  Palette,
  List,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { NavMainItem, NavUserOptionsGroup } from '#common/ui/types/navigation'

export function getNavUser(t: SimpleTFunction): NavUserOptionsGroup[] {
  return [
    [
      {
        title: t('common.layout.navUser.settings'),
        url: '/settings',
        icon: Settings,
      },
      {
        title: t('common.layout.navUser.adminPanel'),
        url: '/users',
        icon: Shield,
        can: 'manageUsers',
      },
    ],
    [
      {
        title: t('common.layout.navUser.logout'),
        url: '/logout',
        icon: LogOut,
        method: 'post',
      },
    ],
  ]
}

export function getMainNav(t: SimpleTFunction): NavMainItem[] {
  return [
    {
      title: t('common.layout.navMain.dashboard'),
      url: '/dashboard',
    },
    {
      title: t('common.layout.navMain.live'),
      url: '/live',
      icon: Radio,
      can: 'viewLive',
    },
    {
      title: t('common.layout.navMain.preparation'),
      url: '/preparation',
      icon: ClipboardList,
      can: 'viewRundowns',
    },
    {
      title: t('common.layout.navMain.context'),
      url: '/context',
      icon: Braces,
      can: 'viewContext',
    },
  ]
}

export function getAdminNav(t: SimpleTFunction): NavMainItem[] {
  return [
    {
      title: t('common.layout.navMain.dashboard'),
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('common.layout.navMain.administration'),
      items: [
        {
          title: t('common.layout.navMain.users'),
          url: '/users',
          icon: Users,
          can: 'manageUsers',
        },
        {
          title: t('common.layout.navMain.roles'),
          url: '/roles',
          icon: KeyRound,
          can: 'manageRoles',
        },
      ],
    },
    {
      title: t('common.layout.navMain.rundowns'),
      items: [
        {
          title: t('common.layout.navMain.stepTypes'),
          url: '/rundowns/step-types',
          icon: List,
          can: 'manageStepTypes',
        },
      ],
    },
    {
      title: t('common.layout.navMain.media'),
      items: [
        {
          title: t('common.layout.navMain.networkDrives'),
          url: '/media/network-drives',
          icon: HardDrive,
          can: 'manageNetworkDrives',
        },
      ],
    },
    {
      title: t('common.layout.navMain.graphics'),
      items: [
        {
          title: t('common.layout.navMain.layers'),
          url: '/graphics',
          icon: Layers,
          can: 'manageGraphics',
        },
        {
          title: t('common.layout.navMain.cssVariables'),
          url: '/graphics/css-variables',
          icon: Palette,
          can: 'manageGraphics',
        },
      ],
    },
    {
      title: t('common.layout.navMain.context'),
      items: [
        {
          title: t('common.layout.navMain.mutators'),
          url: '/context/mutators',
          icon: FileCode,
          can: 'manageContext',
        },
        {
          title: t('common.layout.navMain.validators'),
          url: '/context/validators',
          icon: ShieldCheck,
          can: 'manageContext',
        },
        {
          title: t('common.layout.navMain.contextVersions'),
          url: '/context/versions',
          icon: History,
          can: 'manageContext',
        },
      ],
    },
  ]
}
