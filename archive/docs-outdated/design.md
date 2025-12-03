# JSON design system

This file is structured to be a comprehensive guide for implementing your UI.
—————————————

{
  "designSystemName": "WorkspaceUI",
  "version": "1.1.0",
  "notes": "Comprehensive design system including foundational tokens and component definitions with all proactive additions.",
  "foundations": {
    "colors": {
      "palette": {
        "primary": {
          "100": "#EBF0FF",
          "200": "#C8D7FF",
          "300": "#AECBFF",
          "400": "#88AFFF",
          "500": "#6B94FF",
          "600": "#4B79FF",
          "700": "#3366FF",
          "800": "#1C4DDE"
        },
        "emerald": {
          "100": "#EAFCF1",
          "200": "#C3F5D1",
          "300": "#9EEBAD",
          "400": "#7ADF8E",
          "500": "#56D470",
          "600": "#37C856",
          "700": "#20B042",
          "800": "#139931"
        },
        "orange": {
          "100": "#FFF4E8",
          "200": "#FFE3C2",
          "300": "#FFC999",
          "400": "#FFB370",
          "500": "#FFA24D",
          "600": "#FF8D29",
          "700": "#E67A1B",
          "800": "#CC660A"
        },
        "yellow": {
          "100": "#FFFEEC",
          "200": "#FFF9C7",
          "300": "#FFF3A6",
          "400": "#FFEE80",
          "500": "#FFEA61",
          "600": "#FFD92E",
          "700": "#E6C11F",
          "800": "#CCA813"
        },
        "red": {
          "100": "#FFF5F5",
          "200": "#FFE3E3",
          "300": "#FFAAAA",
          "400": "#FF8B8B",
          "500": "#FF7070",
          "600": "#FF5C5C",
          "700": "#E64747",
          "800": "#CC3333"
        },
        "secondary": {
          "purple": "#6938EF",
          "pink": "#EE46BC",
          "cyan": "#22B9CA",
          "gray": "#667085"
        },
        "neutral": {
          "0": "#FFFFFF",
          "50": "#F9FAFB",
          "100": "#F2F4F7",
          "200": "#E4E7EC",
          "300": "#D0D5DD",
          "400": "#98A2B3",
          "500": "#667085",
          "600": "#475467",
          "700": "#344054",
          "800": "#1D2939",
          "900": "#101828"
        }
      },
      "semantic": {
        "background": {
          "primary": "#FFFFFF",
          "secondary": "#F9FAFB",
          "tertiary": "#F2F4F7",
          "overlay": "#F0F2F5"
        },
        "text": {
          "primary": "#1D2939",
          "secondary": "#667085",
          "tertiary": "#98A2B3",
          "placeholder": "#D0D5DD",
          "onPrimary": "#FFFFFF",
          "link": "#3366FF",
          "danger": "#D92D20",
          "success": "#139931",
          "warning": "#CCA813"
        },
        "border": {
          "primary": "#D0D5DD",
          "secondary": "#E4E7EC",
          "active": "#3366FF"
        },
        "status": {
          "success": {
            "text": "#139931",
            "background": "#F0FDF4"
          },
          "warning": {
            "text": "#CCA813",
            "background": "#FFFCF0"
          },
          "danger": {
            "text": "#CC3333",
            "background": "#FFFBFB"
          },
          "info": {
            "text": "#3366FF",
            "background": "#F0F4FF"
          },
          "neutral": {
            "text": "#667085",
            "background": "#F2F4F7"
          }
        }
      }
    },
    "typography": {
      "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "weights": {
        "regular": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
      },
      "sizes": {
        "xs": { "fontSize": "12px", "lineHeight": "18px" },
        "sm": { "fontSize": "14px", "lineHeight": "20px" },
        "md": { "fontSize": "16px", "lineHeight": "24px" },
        "lg": { "fontSize": "18px", "lineHeight": "28px" },
        "xl": { "fontSize": "20px", "lineHeight": "30px" }
      },
      "roles": {
        "headingXl": {
          "fontSize": "20px",
          "fontWeight": 600,
          "lineHeight": "30px"
        },
        "headingLg": {
          "fontSize": "18px",
          "fontWeight": 600,
          "lineHeight": "28px"
        },
        "headingMd": {
          "fontSize": "16px",
          "fontWeight": 600,
          "lineHeight": "24px"
        },
        "bodyLgRegular": {
          "fontSize": "16px",
          "fontWeight": 400,
          "lineHeight": "24px"
        },
        "bodyMdMedium": {
          "fontSize": "14px",
          "fontWeight": 500,
          "lineHeight": "20px"
        },
        "bodyMdRegular": {
          "fontSize": "14px",
          "fontWeight": 400,
          "lineHeight": "20px"
        },
        "bodySmMedium": {
          "fontSize": "12px",
          "fontWeight": 500,
          "lineHeight": "18px"
        },
        "bodySmRegular": {
          "fontSize": "12px",
          "fontWeight": 400,
          "lineHeight": "18px"
        },
        "link": {
          "fontSize": "14px",
          "fontWeight": 500,
          "color": "#3366FF"
        }
      }
    },
    "spacing": {
      "scale": [
        "0px",
        "4px",
        "8px",
        "12px",
        "16px",
        "20px",
        "24px",
        "32px",
        "40px",
        "48px"
      ],
      "reference": {
        "xxs": "4px",
        "xs": "8px",
        "sm": "12px",
        "md": "16px",
        "lg": "20px",
        "xl": "24px",
        "xxl": "32px"
      }
    },
    "layout": {
      "padding": {
        "card": "16px",
        "widget": "20px",
        "emptyState": "32px"
      },
      "gap": {
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px"
      }
    },
    "borderRadius": {
      "sm": "4px",
      "md": "6px",
      "lg": "8px",
      "xl": "12px",
      "full": "9999px"
    },
    "shadows": {
      "xs": "0px 1px 2px rgba(0, 0, 0, 0.05)",
      "sm": "0px 2px 4px -2px rgba(0, 0, 0, 0.06), 0px 4px 8px -4px rgba(0, 0, 0, 0.1)",
      "md": "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "lg": "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)"
    }
  },
  "components": {
    "button": {
      "baseStyle": {
        "fontFamily": "Inter, sans-serif",
        "fontWeight": 500,
        "borderRadius": "6px",
        "border": "1px solid transparent",
        "cursor": "pointer",
        "transition": "background-color 0.2s, box-shadow 0.2s"
      },
      "sizes": {
        "tiny": { "fontSize": "12px", "padding": "6px 10px" },
        "medium": { "fontSize": "14px", "padding": "10px 16px" },
        "large": { "fontSize": "16px", "padding": "12px 20px" }
      },
      "variants": {
        "primary": {
          "backgroundColor": "#4B79FF",
          "color": "#FFFFFF",
          "hover": { "backgroundColor": "#3366FF" },
          "active": { "backgroundColor": "#1C4DDE" },
          "focus": { "boxShadow": "0px 0px 0px 4px #AECBFF" }
        },
        "secondary": {
          "backgroundColor": "#FFFFFF",
          "color": "#667085",
          "border": "1px solid #D0D5DD",
          "boxShadow": "0px 1px 2px rgba(0, 0, 0, 0.05)",
          "hover": { "backgroundColor": "#F9FAFB" },
          "focus": { "boxShadow": "0px 0px 0px 4px #E4E7EC" }
        },
        "tertiary": {
          "backgroundColor": "transparent",
          "color": "#667085",
          "hover": { "backgroundColor": "#F2F4F7" }
        }
      }
    },
    "buttonGroup": {
      "baseStyle": {
        "display": "flex",
        "border": "1px solid #D0D5DD",
        "borderRadius": "6px",
        "overflow": "hidden"
      },
      "button": {
        "borderRadius": "0px",
        "border": "none",
        "borderRight": "1px solid #D0D5DD",
        "focus": { "boxShadow": "none" },
        "lastChild": { "borderRight": "none" },
        "firstChild": { "borderTopLeftRadius": "6px", "borderBottomLeftRadius": "6px" },
        "lastChild": { "borderTopRightRadius": "6px", "borderBottomRightRadius": "6px" }
      }
    },
    "tag": {
      "baseStyle": {
        "display": "inline-flex",
        "alignItems": "center",
        "padding": "2px 8px",
        "borderRadius": "9999px",
        "fontSize": "12px",
        "fontWeight": 500,
        "lineHeight": "18px"
      },
      "withDot": {
        "dot": {
          "width": "6px",
          "height": "6px",
          "borderRadius": "50%",
          "marginRight": "4px"
        }
      },
      "variants": {
        "success": { "backgroundColor": "#F0FDF4", "color": "#139931", "dotColor": "#37C856" },
        "warning": { "backgroundColor": "#FFFCF0", "color": "#CCA813", "dotColor": "#FFD92E" },
        "danger": { "backgroundColor": "#FFFBFB", "color": "#CC3333", "dotColor": "#FF5C5C" },
        "info": { "backgroundColor": "#F0F4FF", "color": "#3366FF", "dotColor": "#4B79FF" },
        "neutral": { "backgroundColor": "#F2F4F7", "color": "#667085", "dotColor": "#98A2B3" },
        "chip": {
          "backgroundColor": "#F2F4F7",
          "color": "#344054",
          "padding": "4px 10px",
          "borderRadius": "4px",
          "closeIcon": { "marginLeft": "4px", "cursor": "pointer" }
        }
      }
    },
    "card": {
      "baseStyle": {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "8px",
        "border": "1px solid #E4E7EC",
        "boxShadow": "0px 2px 4px -2px rgba(0, 0, 0, 0.06), 0px 4px 8px -4px rgba(0, 0, 0, 0.1)"
      },
      "variants": {
        "default": {
          "padding": "16px"
        },
        "widget": {
          "padding": "20px",
          "borderRadius": "8px"
        },
        "emptyState": {
          "padding": "32px",
          "textAlign": "center",
          "border": "none",
          "borderRadius": "12px",
          "boxShadow": "0px 2px 4px -2px rgba(0, 0, 0, 0.06), 0px 4px 8px -4px rgba(0, 0, 0, 0.1)"
        },
        "notification": {
          "display": "flex",
          "alignItems": "center",
          "padding": "12px 16px",
          "borderRadius": "6px",
          "fontSize": "14px",
          "border": "none",
          "boxShadow": "none"
        },
        "booking": {
          "padding": "16px",
          "borderLeft": "4px solid #D92D20",
          "boxShadow": "none"
        }
      }
    },
    "input": {
      "baseStyle": {
        "backgroundColor": "#FFFFFF",
        "border": "1px solid #D0D5DD",
        "borderRadius": "6px",
        "padding": "10px 14px",
        "fontSize": "14px",
        "color": "#1D2939",
        "boxShadow": "0px 1px 2px rgba(0, 0, 0, 0.05)"
      },
      "states": {
        "hover": { "borderColor": "#C8D7FF" },
        "focus": { "borderColor": "#4B79FF", "boxShadow": "0px 0px 0px 4px #EBF0FF" },
        "disabled": { "backgroundColor": "#F9FAFB", "color": "#98A2B3" }
      }
    },
    "inputWithTags": {
      "container": {
        "baseStyle": {
          "display": "flex",
          "flexWrap": "wrap",
          "alignItems": "center",
          "gap": "6px",
          "backgroundColor": "#FFFFFF",
          "border": "1px solid #D0D5DD",
          "borderRadius": "6px",
          "padding": "10px 14px",
          "boxShadow": "0px 1px 2px rgba(0, 0, 0, 0.05)"
        },
        "focusWithin": {
          "borderColor": "#4B79FF",
          "boxShadow": "0px 0px 0px 4px #EBF0FF"
        }
      },
      "input": {
        "border": "none",
        "outline": "none",
        "boxShadow": "none",
        "padding": "0",
        "flex": "1",
        "minWidth": "100px"
      },
      "tag": {
        "base": "chip"
      }
    },
    "avatar": {
      "baseStyle": {
        "borderRadius": "9999px",
        "overflow": "hidden",
        "display": "inline-block",
        "objectFit": "cover"
      },
      "sizes": {
        "sm": { "width": "24px", "height": "24px" },
        "md": { "width": "32px", "height": "32px" },
        "lg": { "width": "40px", "height": "40px" }
      },
      "avatarGroup": {
        "container": {
          "display": "flex",
          "alignItems": "center"
        },
        "item": {
          "marginLeft": "-8px",
          "border": "2px solid #FFFFFF",
          "borderRadius": "9999px"
        },
        "counter": {
          "fontSize": "14px",
          "fontWeight": 500,
          "color": "#475467",
          "backgroundColor": "#F2F4F7",
          "marginLeft": "-8px",
          "border": "2px solid #FFFFFF",
          "borderRadius": "9999px",
          "padding": "8px",
          "display": "flex",
          "alignItems": "center",
          "justifyContent": "center",
          "height": "32px",
          "width": "32px"
        }
      }
    },
    "tabs": {
      "baseStyle": {
        "display": "inline-flex",
        "alignItems": "center",
        "borderRadius": "6px",
        "backgroundColor": "#F2F4F7",
        "padding": "4px"
      },
      "tab": {
        "base": {
          "padding": "8px 12px",
          "fontSize": "14px",
          "fontWeight": 500,
          "color": "#667085",
          "backgroundColor": "transparent",
          "border": "none",
          "borderRadius": "6px",
          "cursor": "pointer"
        },
        "active": {
          "color": "#1D2939",
          "backgroundColor": "#FFFFFF",
          "boxShadow": "0px 1px 2px rgba(0, 0, 0, 0.05)"
        },
        "hover": {
          "backgroundColor": "#F2F4F7"
        }
      }
    },
    "segmentedControl": {
      "baseStyle": {
        "display": "inline-flex",
        "alignItems": "center",
        "borderRadius": "6px",
        "border": "1px solid #D0D5DD",
        "padding": "2px",
        "backgroundColor": "#FFFFFF"
      },
      "item": {
        "base": {
          "padding": "8px 12px",
          "fontSize": "14px",
          "fontWeight": 500,
          "color": "#667085",
          "backgroundColor": "transparent",
          "border": "none",
          "borderRadius": "4px",
          "cursor": "pointer",
          "display": "flex",
          "alignItems": "center",
          "gap": "6px"
        },
        "active": {
          "color": "#1D2939",
          "backgroundColor": "#F9FAFB",
          "boxShadow": "0px 1px 2px rgba(0, 0, 0, 0.05)"
        },
        "hover": {
          "backgroundColor": "#F2F4F7"
        }
      },
      "variants": {
        "iconOnly": {
          "item": { "padding": "8px" }
        },
        "textOnly": {
          "item": { "padding": "8px 12px" }
        }
      }
    },
    "listItem": {
      "baseStyle": {
        "display": "flex",
        "alignItems": "center",
        "width": "100%",
        "padding": "8px 12px",
        "borderRadius": "6px",
        "cursor": "pointer",
        "hover": {
          "backgroundColor": "#F9FAFB"
        }
      },
      "variants": {
        "reply": {
          "justifyContent": "space-between",
          "avatar": { "marginRight": "12px" },
          "content": { "flex": "1" },
          "name": { "fontSize": "14px", "fontWeight": 500, "color": "#1D2939" },
          "meta": { "fontSize": "12px", "fontWeight": 400, "color": "#667085" },
          "status": { "marginLeft": "16px" }
        },
        "person": {
          "avatar": { "marginRight": "12px" },
          "name": { "fontSize": "14px", "fontWeight": 500, "color": "#1D2939" }
        },
        "menu": {
          "gap": "12px",
          "icon": { "color": "#667085" },
          "text": { "fontSize": "14px", "fontWeight": 500, "color": "#344054" },
          "active": {
            "backgroundColor": "#F9FAFB",
            "icon": { "color": "#1D2939" },
            "text": { "color": "#1D2939" }
          }
        },
        "setting": {
          "justifyContent": "space-between",
          "content": { "display": "flex", "alignItems": "center", "gap": "12px" },
          "icon": { "color": "#667085" },
          "text": { "fontSize": "14px", "fontWeight": 500, "color": "#344054" },
          "subtext": { "fontSize": "12px", "fontWeight": 400, "color": "#667085" },
          "control": { "marginLeft": "16px" }
        }
      }
    },
    "sideNav": {
      "container": {
        "display": "flex",
        "flexDirection": "column",
        "gap": "4px",
        "padding": "16px"
      },
      "item": {
        "extends": "listItem-menu"
      }
    },
    "dropdownMenu": {
      "trigger": {
        "display": "flex",
        "alignItems": "center",
        "gap": "8px",
        "padding": "8px",
        "borderRadius": "6px",
        "cursor": "pointer",
        "hover": { "backgroundColor": "#F9FAFB" }
      },
      "content": {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "8px",
        "border": "1px solid #E4E7EC",
        "boxShadow": "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "padding": "8px",
        "minWidth": "220px"
      },
      "item": {
        "extends": "listItem-menu"
      }
    },
    "switch": {
      "track": {
        "base": {
          "width": "44px",
          "height": "24px",
          "borderRadius": "9999px",
          "transition": "background-color 0.2s",
          "position": "relative",
          "cursor": "pointer"
        },
        "off": { "backgroundColor": "#D0D5DD" },
        "on": { "backgroundColor": "#4B79FF" }
      },
      "thumb": {
        "base": {
          "width": "20px",
          "height": "20px",
          "borderRadius": "50%",
          "backgroundColor": "#FFFFFF",
          "position": "absolute",
          "top": "2px",
          "transition": "transform 0.2s"
        },
        "off": { "transform": "translateX(2px)" },
        "on": { "transform": "translateX(22px)" }
      }
    },
    "icons": {
      "list": [
        "card-view",
        "calendar-view",
        "floorplan-view",
        "my-conversations",
        "my-inbox",
        "start-conversation",
        "search",
        "bell",
        "messages",
        "users",
        "calendar",
        "files",
        "tasks",
        "settings",
        "help",
        "logout",
        "hot-desk",
        "wifi",
        "pending",
        "confirmed",
        "alert",
        "active",
        "closed",
        "waiting",
        "view-all",
        "join-plan",
        "placeholder-image",
        "icon-envelope",
        "icon-basket",
        "icon-user-add",
        "projector",
        "catering",
        "change",
        "remove",
        "make-booking",
        "book-event",
        "buy-product",
        "access-account",
        "apple-calendar",
        "chevron-down",
        "close"
      ]
    }
  }
}

