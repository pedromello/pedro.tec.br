import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    seoTitle: z.string().max(65).optional(),
    seoDescription: z.string().max(165).optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    coverAlt: z.string(),
    sourceUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
