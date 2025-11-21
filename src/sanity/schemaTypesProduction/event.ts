import {defineField, defineType} from 'sanity'

export const event = defineType({
  name: 'event',           // matches structureProduction
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',      // includes both date and time
    }),
    defineField({
      name: 'hosts',
      title: 'Hosts',
      type: 'array',
      of: [{ type: 'string' }],  // multiple hosts
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'summary',
      title: 'Summary (Short Summary of the Event)',
      type: 'text',
    }),
    defineField({
      name: 'information',
      title: 'Information (Detailed Description of the Event)',
      type: 'blockContent',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      date: 'date',
    },
    prepare(selection) {
      const { title, date } = selection
      return {
        title,
        subtitle: date ? new Date(date).toLocaleString() : undefined,
        media: selection.media,
      }
    },
  },
})
