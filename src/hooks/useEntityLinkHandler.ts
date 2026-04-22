import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function entityLinkUrl(type: string, id: string): string | null {
  switch (type) {
    case "spell":
      return `/decks/spells/${id}`;
    case "ability":
      return `/decks/abilities/${id}`;
    case "artifact":
      return `/decks/artifacts/${id}`;
    case "unit":
      return `/units/${id}`;
    case "hero":
      return `/heroes/${id}`;
    case "rule":
      return `/rules/${id}`;
    case "field":
      return `/map-elements/${id}`;
    case "event":
      return `/events/${id}`;
    case "astrologer":
      return `/events/${id}`;
    case "war_machine":
      return `/decks/warmachines/${id}`;
    case "town_building": {
      const townId = id.split("_")[0];
      return townId ? `/towns/${townId}` : null;
    }
    default:
      return null;
  }
}

/**
 * Returns an onClick handler for containers that use dangerouslySetInnerHTML
 * with content produced by renderGlyphs(). Intercepts clicks on `.entity-link`
 * spans and navigates to the corresponding card route.
 */
export function useEntityLinkHandler() {
  const navigate = useNavigate();
  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest<HTMLElement>(".entity-link");
      if (!link) return;
      const type = link.dataset.entityType;
      const id = link.dataset.entityId;
      if (!type || !id) return;
      const url = entityLinkUrl(type, id);
      if (!url) return;
      event.preventDefault();
      event.stopPropagation();
      navigate(url);
    },
    [navigate],
  );
}
