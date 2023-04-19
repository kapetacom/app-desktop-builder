export interface MenuWrapper {
    color: string;
    size: number;
    position: { left: number; right: number };
    menuCategories: MenuCategoryModel[];
}

export enum CategoryState {
    OPEN = 'open',
    CLOSED = 'closed',
}

export interface MenuCategoryModel {
    icon: string;
    index: number;
    color: string;
    animationState: CategoryState;
    menuItem: MenuItem[];
    children: SVGSVGElement[];
}

export interface MenuItem {
    text: string;
    open?: boolean;
    callback: () => boolean|Promise<boolean>;
}

export interface MenuCategoryItem {
    text: string;
    open: boolean;
    icon: string;
    index: number;
    menuItems: MenuItem[];
    onClick?: () => void;
}
