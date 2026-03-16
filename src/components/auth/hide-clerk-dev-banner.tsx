"use client";

import { useEffect } from "react";

const DEV_TEXT = "development mode";

function hideDevelopmentModeBannerIn(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const text = textNode.textContent?.trim().toLowerCase();
    if (text !== DEV_TEXT) continue;

    let target = textNode.parentElement;
    for (let i = 0; i < 3 && target?.parentElement; i += 1) {
      const parentText = target.parentElement.textContent?.trim().toLowerCase();
      if (parentText === DEV_TEXT) {
        target = target.parentElement;
      } else {
        break;
      }
    }
    if (target) {
      target.style.display = "none";
    }
  }
}

export function HideClerkDevBanner() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    hideDevelopmentModeBannerIn(document.body);

    const observer = new MutationObserver(() => {
      hideDevelopmentModeBannerIn(document.body);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timeout = window.setTimeout(() => {
      observer.disconnect();
    }, 20000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
