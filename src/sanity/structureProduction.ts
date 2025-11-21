import type {StructureResolver} from 'sanity/structure'

export const structureProduction: StructureResolver = (S) =>
  S.list()
    .title('Events')
    .items([
      S.documentTypeListItem('event').title('Events'), // matches your event schema
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && !['event'].includes(item.getId()!),
      ),
    ])
