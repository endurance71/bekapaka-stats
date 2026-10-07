/* BeKaPaKa Digital 2.0 — preset Tailwind (wygenerowany). Użycie: presets: [require("./tailwind.preset.cjs")] */
module.exports = {
  "theme": {
    "screens": {
      "tablet": "768px",
      "laptop": "1024px",
      "desktop": "1280px",
      "wide": "1600px"
    },
    "extend": {
      "colors": {
        "black": "#0B0B0B",
        "ink900": "#121212",
        "ink800": "#161616",
        "ink700": "#1F1E1C",
        "ink600": "#2E2C29",
        "ink500": "#3A3632",
        "stone600": "#5C5852",
        "stone400": "#9C978F",
        "stone200": "#D8D4CC",
        "paper": "#F3F1EC",
        "white": "#F7F6F2",
        "pure": "#FFFFFF",
        "red300": "#FF5A6E",
        "red500": "#EF1734",
        "red600": "#D9142F",
        "red700": "#AE1027",
        "gold500": "#F4A816",
        "gold700": "#9A6400",
        "green600": "#1F7A45",
        "green400": "#3DBA6F",
        "navy700": "#0B1E55",
        "navy500": "#173EA5",
        "orange500": "#FF7A18",
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "surface": "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        "text-inverse": "var(--text-inverse)",
        "border": "var(--border)",
        "border-strong": "var(--border-strong)",
        "action": "var(--action)",
        "action-hover": "var(--action-hover)",
        "action-text": "var(--action-text)",
        "link": "var(--link)",
        "link-hover": "var(--link-hover)",
        "accent": "var(--accent)",
        "accent-text": "var(--accent-text)",
        "highlight": "var(--highlight)",
        "focus": "var(--focus)",
        "live": "var(--live)",
        "success": "var(--success)",
        "error": "var(--error)",
        "warning": "var(--warning)",
        "disabled-bg": "var(--disabled-bg)",
        "disabled-text": "var(--disabled-text)"
      },
      "spacing": {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
        "32": "128px"
      },
      "fontFamily": {
        "display": [
          "Barlow Condensed",
          "Arial Narrow",
          "sans-serif"
        ],
        "text": [
          "Barlow",
          "system-ui",
          "sans-serif"
        ]
      },
      "fontSize": {
        "score": [
          "var(--fs-score)",
          {
            "lineHeight": "var(--lh-score)",
            "letterSpacing": "var(--tr-score)"
          }
        ],
        "number": [
          "var(--fs-number)",
          {
            "lineHeight": "var(--lh-number)",
            "letterSpacing": "var(--tr-number)"
          }
        ],
        "display": [
          "var(--fs-display)",
          {
            "lineHeight": "var(--lh-display)",
            "letterSpacing": "var(--tr-display)"
          }
        ],
        "h1": [
          "var(--fs-h1)",
          {
            "lineHeight": "var(--lh-h1)",
            "letterSpacing": "var(--tr-h1)"
          }
        ],
        "h2": [
          "var(--fs-h2)",
          {
            "lineHeight": "var(--lh-h2)",
            "letterSpacing": "var(--tr-h2)"
          }
        ],
        "h3": [
          "var(--fs-h3)",
          {
            "lineHeight": "var(--lh-h3)",
            "letterSpacing": "var(--tr-h3)"
          }
        ],
        "h4": [
          "var(--fs-h4)",
          {
            "lineHeight": "var(--lh-h4)",
            "letterSpacing": "var(--tr-h4)"
          }
        ],
        "h5": [
          "var(--fs-h5)",
          {
            "lineHeight": "var(--lh-h5)",
            "letterSpacing": "var(--tr-h5)"
          }
        ],
        "h6": [
          "var(--fs-h6)",
          {
            "lineHeight": "var(--lh-h6)",
            "letterSpacing": "var(--tr-h6)"
          }
        ],
        "lead": [
          "var(--fs-lead)",
          {
            "lineHeight": "var(--lh-lead)",
            "letterSpacing": "var(--tr-lead)"
          }
        ],
        "body": [
          "var(--fs-body)",
          {
            "lineHeight": "var(--lh-body)",
            "letterSpacing": "var(--tr-body)"
          }
        ],
        "body-sm": [
          "var(--fs-body-sm)",
          {
            "lineHeight": "var(--lh-body-sm)",
            "letterSpacing": "var(--tr-body-sm)"
          }
        ],
        "label": [
          "var(--fs-label)",
          {
            "lineHeight": "var(--lh-label)",
            "letterSpacing": "var(--tr-label)"
          }
        ],
        "meta": [
          "var(--fs-meta)",
          {
            "lineHeight": "var(--lh-meta)",
            "letterSpacing": "var(--tr-meta)"
          }
        ],
        "button": [
          "var(--fs-button)",
          {
            "lineHeight": "var(--lh-button)",
            "letterSpacing": "var(--tr-button)"
          }
        ],
        "caption": [
          "var(--fs-caption)",
          {
            "lineHeight": "var(--lh-caption)",
            "letterSpacing": "var(--tr-caption)"
          }
        ]
      },
      "maxWidth": {
        "container": "1280px",
        "reading": "720px"
      },
      "borderRadius": {
        "none": "0px",
        "xs": "2px",
        "pill": "999px",
        "chamfer": "12px",
        "chamfer-sm": "8px"
      },
      "minHeight": {
        "control-sm": "44px",
        "control-md": "48px",
        "control-lg": "56px"
      },
      "transitionDuration": {
        "instant": "80ms",
        "fast": "160ms",
        "base": "240ms",
        "slow": "400ms",
        "reveal": "600ms"
      },
      "transitionTimingFunction": {
        "out": "cubic-bezier(.2,.7,.2,1)",
        "in-out": "cubic-bezier(.6,0,.3,1)",
        "linear": "linear"
      }
    }
  }
};
