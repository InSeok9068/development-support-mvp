/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

/************************* shoelace.d.ts *************************/
import type * as Shoelace from '@shoelace-style/shoelace';
import type { DefineComponent } from 'vue';

// 노이즈 제거: _로 시작 + 대문자 키 제외
type CleanProps<T> = {
  [K in keyof T as K extends string
    ? K extends `_${string}`
      ? never
      : K extends Uppercase<K>
        ? never
        : K
    : never]?: T[K];
};

// shoelace 컴포넌트 타입 정의
declare module 'vue' {
  export interface GlobalComponents {
    'sl-alert': DefineComponent<CleanProps<Shoelace.SlAlert>>;
    'sl-animated-image': DefineComponent<CleanProps<Shoelace.SlAnimatedImage>>;
    'sl-animation': DefineComponent<CleanProps<Shoelace.SlAnimation>>;
    'sl-avatar': DefineComponent<CleanProps<Shoelace.SlAvatar>>;
    'sl-badge': DefineComponent<CleanProps<Shoelace.SlBadge>>;
    'sl-breadcrumb': DefineComponent<CleanProps<Shoelace.SlBreadcrumb>>;
    'sl-breadcrumb-item': DefineComponent<CleanProps<Shoelace.SlBreadcrumbItem>>;
    'sl-button': DefineComponent<CleanProps<Shoelace.SlButton>>;
    'sl-button-group': DefineComponent<CleanProps<Shoelace.SlButtonGroup>>;
    'sl-card': DefineComponent<CleanProps<Shoelace.SlCard>>;
    'sl-carousel': DefineComponent<CleanProps<Shoelace.SlCarousel>>;
    'sl-carousel-item': DefineComponent<CleanProps<Shoelace.SlCarouselItem>>;
    'sl-checkbox': DefineComponent<CleanProps<Shoelace.SlCheckbox>>;
    'sl-color-picker': DefineComponent<CleanProps<Shoelace.SlColorPicker>>;
    'sl-copy-button': DefineComponent<CleanProps<Shoelace.SlCopyButton>>;
    'sl-details': DefineComponent<CleanProps<Shoelace.SlDetails>>;
    'sl-dialog': DefineComponent<CleanProps<Shoelace.SlDialog>>;
    'sl-divider': DefineComponent<CleanProps<Shoelace.SlDivider>>;
    'sl-drawer': DefineComponent<CleanProps<Shoelace.SlDrawer>>;
    'sl-dropdown': DefineComponent<CleanProps<Shoelace.SlDropdown>>;
    'sl-format-bytes': DefineComponent<CleanProps<Shoelace.SlFormatBytes>>;
    'sl-format-date': DefineComponent<CleanProps<Shoelace.SlFormatDate>>;
    'sl-format-number': DefineComponent<CleanProps<Shoelace.SlFormatNumber>>;
    'sl-icon': DefineComponent<CleanProps<Shoelace.SlIcon>>;
    'sl-icon-button': DefineComponent<CleanProps<Shoelace.SlIconButton>>;
    'sl-image-comparer': DefineComponent<CleanProps<Shoelace.SlImageComparer>>;
    'sl-include': DefineComponent<CleanProps<Shoelace.SlInclude>>;
    'sl-input': DefineComponent<CleanProps<Shoelace.SlInput>>;
    'sl-menu': DefineComponent<CleanProps<Shoelace.SlMenu>>;
    'sl-menu-item': DefineComponent<CleanProps<Shoelace.SlMenuItem>>;
    'sl-menu-label': DefineComponent<CleanProps<Shoelace.SlMenuLabel>>;
    'sl-mutation-observer': DefineComponent<CleanProps<Shoelace.SlMutationObserver>>;
    'sl-option': DefineComponent<CleanProps<Shoelace.SlOption>>;
    'sl-popup': DefineComponent<CleanProps<Shoelace.SlPopup>>;
    'sl-progress-bar': DefineComponent<CleanProps<Shoelace.SlProgressBar>>;
    'sl-progress-ring': DefineComponent<CleanProps<Shoelace.SlProgressRing>>;
    'sl-qr-code': DefineComponent<CleanProps<Shoelace.SlQrCode>>;
    'sl-radio': DefineComponent<CleanProps<Shoelace.SlRadio>>;
    'sl-radio-button': DefineComponent<CleanProps<Shoelace.SlRadioButton>>;
    'sl-radio-group': DefineComponent<CleanProps<Shoelace.SlRadioGroup>>;
    'sl-range': DefineComponent<CleanProps<Shoelace.SlRange>>;
    'sl-rating': DefineComponent<CleanProps<Shoelace.SlRating>>;
    'sl-relative-time': DefineComponent<CleanProps<Shoelace.SlRelativeTime>>;
    'sl-resize-observer': DefineComponent<CleanProps<Shoelace.SlResizeObserver>>;
    'sl-select': DefineComponent<CleanProps<Shoelace.SlSelect>>;
    'sl-skeleton': DefineComponent<CleanProps<Shoelace.SlSkeleton>>;
    'sl-spinner': DefineComponent<CleanProps<Shoelace.SlSpinner>>;
    'sl-split-panel': DefineComponent<CleanProps<Shoelace.SlSplitPanel>>;
    'sl-switch': DefineComponent<CleanProps<Shoelace.SlSwitch>>;
    'sl-tab': DefineComponent<CleanProps<Shoelace.SlTab>>;
    'sl-tab-group': DefineComponent<CleanProps<Shoelace.SlTabGroup>>;
    'sl-tab-panel': DefineComponent<CleanProps<Shoelace.SlTabPanel>>;
    'sl-tag': DefineComponent<CleanProps<Shoelace.SlTag>>;
    'sl-textarea': DefineComponent<CleanProps<Shoelace.SlTextarea>>;
    'sl-tooltip': DefineComponent<CleanProps<Shoelace.SlTooltip>>;
    'sl-tree': DefineComponent<CleanProps<Shoelace.SlTree>>;
    'sl-tree-item': DefineComponent<CleanProps<Shoelace.SlTreeItem>>;
    'sl-visually-hidden': DefineComponent<CleanProps<Shoelace.SlVisuallyHidden>>;
  }
}

export {};
/************************* shoelace.d.ts *************************/
