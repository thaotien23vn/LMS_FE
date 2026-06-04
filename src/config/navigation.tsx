import {
    Home,
    Library,
    MessageSquare,
    Calendar,
    type LucideIcon,
} from 'lucide-react';

export interface SubmenuItem {
    label: string;
    path: string;
    icon?: LucideIcon;
    color?: 'red' | 'blue' | 'amber' | 'purple' | 'emerald';
}

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    hasSubmenu?: boolean;
    submenuItems?: SubmenuItem[];
    roles?: ('STUDENT' | 'TEACHER' | 'ADMIN')[];
    isCta?: boolean;
}

export const navigationConfig: NavItem[] = [
    { label: 'Trang chủ', path: '/', icon: Home },
    {
        label: 'Khóa học',
        path: '/courses',
        icon: Library,
        hasSubmenu: true,
    },
    {
        label: 'Lịch học',
        path: '/lich-hoc',
        icon: Calendar,
        roles: ['STUDENT', 'TEACHER', 'ADMIN'],
    },
    {
        label: 'Diễn đàn',
        path: '/forum',
        icon: MessageSquare,
    },
];

