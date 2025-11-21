'use client'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {apiVersion, dataset, projectId, productionDataset} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {schemaProduction} from './src/sanity/schemaTypesProduction'
import {structure} from './src/sanity/structure'
import {structureProduction} from './src/sanity/structureProduction'

export default defineConfig([
  {
    basePath: '/studio',
    projectId,
    dataset,              
    name: 'default-workspace',
    title: 'Blog Workspace',
    subtitle: dataset,
    schema,                
    plugins: [
      structureTool({structure}),        // blog structure
      visionTool({defaultApiVersion: apiVersion}),
    ],
  },
  {
    basePath: '/studio-events',
    projectId,
    dataset: productionDataset,
    name: 'production-workspace',
    title: 'Event Workspace',
    subtitle: productionDataset,
    schema: schemaProduction,          
    plugins: [
      structureTool({structure: structureProduction}),  // event structure
      visionTool({defaultApiVersion: apiVersion}),
    ],
  },
])
