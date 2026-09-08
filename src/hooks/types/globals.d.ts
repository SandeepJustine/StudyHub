declare global {
  interface Window {
    grecaptcha: {
      render: (
        element: HTMLElement | string,
        params: Record<string, any>
      ) => string | number;
      reset: (widgetId?: string | number) => void;
      getResponse: (widgetId?: string | number) => string;
      ready: (callback: () => void) => void;
    };

    google: {
      translate: {
        TranslateElement: {
          new (
            options: TranslateElementOptions,
            elementId: string
          ): TranslateElementInstance;
          InlineLayout: {
            SIMPLE: string;
            VERTICAL: string;
            HORIZONTAL: string;
          };
        };
      };
      translateElementInit: () => void;
    };
  }

  interface TranslateElementOptions {
    pageLanguage?: string;
    layout?: string;
    includedLanguages?: string;
    excludedLanguages?: string;
    gaTrack?: boolean;
    autoDisplay?: boolean;
    multilanguagePage?: boolean;
  }

  interface TranslateElementInstance {
    focusIn?: () => void;
    showBanner?: () => void;
  }
}
