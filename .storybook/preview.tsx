import type { Preview } from "@storybook/react-vite"

import { withLocale } from "./decorators/with-locale"
import { withQueryClient } from "./decorators/with-query-client"
import { withRouter } from "./decorators/with-router"
import { withTheme } from "./decorators/with-theme"
// Tailwind v4, the design tokens from `@theme inline` and the font — the same file the
// application loads.
import "../src/styles.css"

const preview: Preview = {
  // The first entry is the innermost. Locale and theme sit outside because they act on
  // the document and must be in place before the story renders.
  decorators: [withQueryClient, withRouter, withTheme, withLocale],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    viewport: {
      options: {
        phone: {
          name: "Phone",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Wide",
          styles: { width: "1280px", height: "900px" },
          type: "desktop",
        },
      },
    },
  },

  initialGlobals: {
    locale: "de",
    theme: "light",
    // Mobile-first is not a statement of intent: score entry happens at the edge of the
    // court, so the phone is the default view.
    viewport: { value: "phone", isRotated: false },
  },

  globalTypes: {
    locale: {
      description: "Language",
      toolbar: {
        icon: "globe",
        dynamicTitle: true,
        items: [
          { value: "de", title: "Deutsch" },
          { value: "en", title: "English" },
        ],
      },
    },
    theme: {
      description: "Appearance",
      toolbar: {
        icon: "sun",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
}

export default preview
