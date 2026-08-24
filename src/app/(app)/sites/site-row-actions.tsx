"use client";

import { RowActions } from "@/components/row-actions";
import { deleteSiteAction } from "./actions";

export function SiteRowActions({ siteId, siteName }: { siteId: string; siteName: string }) {
  return (
    <RowActions
      editHref={`/sites/${siteId}/edit`}
      deleteAction={deleteSiteAction.bind(null, siteId)}
      deleteConfirmMessage={`Supprimer le site "${siteName}" ? Cette action est irréversible.`}
    />
  );
}
