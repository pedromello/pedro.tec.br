import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const root = process.cwd();
const postsDirectory = path.join(root, 'src', 'content', 'blog');
const publicDirectory = path.join(root, 'public');
const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='));
const limit = limitArgument ? Number(limitArgument.split('=')[1]) : Infinity;

const sharedAssets = [
  ['https://pedro.tec.br/wp-content/uploads/2025/01/logo.png', 'brand/logo.png'],
  ['https://pedro.tec.br/wp-content/uploads/2025/06/IMG_2635-e1751128264602-640x640.jpg', 'brand/pedro-dubai.jpg'],
  ['https://pedro.tec.br/wp-content/uploads/2025/06/PedroMello_CV_2025.pdf', 'PedroMello_CV_2025.pdf'],
];

function decodeEntities(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function yamlString(value) {
  return JSON.stringify(value ?? '');
}

function normalizeFileName(url, fallback = 'image') {
  const parsed = new URL(url);
  const original = decodeURIComponent(path.basename(parsed.pathname)) || fallback;
  return original
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function download(url, relativePath) {
  const destination = path.join(publicDirectory, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return `/${relativePath.replaceAll('\\', '/')}`;
}

function primaryCategory(categories) {
  const values = new Set(categories.map((category) => category.toLowerCase()));
  if (values.has('defi') || values.has('rwa') || values.has('lending protocols')) {
    return 'FinTech & DeFi';
  }
  if (values.has('manifold')) return 'Building Manifold';
  if (values.has('ai')) return 'AI & Applied Research';
  return 'Software Engineering';
}

const turndown = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx',
});
turndown.use(gfm);
turndown.remove(['script', 'style', 'form']);
turndown.addRule('wordpressCodeBlock', {
  filter(node) {
    return node.nodeName === 'PRE';
  },
  replacement(_content, node) {
    const code = node.querySelector?.('code');
    const languageClass = code?.getAttribute('class') || node.getAttribute('class') || '';
    const language = languageClass.match(/language-([a-z0-9_-]+)/i)?.[1] || '';
    const value = (code?.textContent || node.textContent || '').replace(/^\n+|\n+$/g, '');
    const fence = value.includes('```') ? '````' : '```';
    return `\n\n${fence}${language}\n${value}\n${fence}\n\n`;
  },
});

async function migratePost(post) {
  const slug = post.slug;
  const terms = post._embedded?.['wp:term'] || [];
  const categories = (terms[0] || []).map((term) => decodeEntities(term.name));
  const tags = (terms[1] || []).map((term) => decodeEntities(term.name));
  const feature = post._embedded?.['wp:featuredmedia']?.[0];
  const assetDirectory = `images/posts/${slug}`;
  let cover = '';

  if (feature?.source_url) {
    const extension = path.extname(new URL(feature.source_url).pathname) || '.jpg';
    cover = await download(feature.source_url, `${assetDirectory}/cover${extension.toLowerCase()}`);
  }

  let html = post.content.rendered;
  const imageUrls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((url) => url.startsWith('http'));

  const replacements = new Map();
  for (const [index, imageUrl] of [...new Set(imageUrls)].entries()) {
    const fileName = normalizeFileName(imageUrl, `image-${index + 1}.jpg`);
    try {
      const localUrl = await download(imageUrl, `${assetDirectory}/${fileName}`);
      replacements.set(imageUrl, localUrl);
    } catch (error) {
      console.warn(`Removing unavailable remote image: ${imageUrl}`);
      replacements.set(imageUrl, '');
    }
  }

  for (const [remoteUrl, localUrl] of replacements) {
    if (localUrl) {
      html = html.replaceAll(remoteUrl, localUrl);
    } else {
      html = html.replace(new RegExp(`<img[^>]+src=["']${remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi'), '');
    }
  }

  html = html
    .replaceAll('https://pedro.tec.br/', '/')
    .replace(/<div class="wp-block-spacer"[^>]*>.*?<\/div>/gis, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/gis, '');

  let markdown = turndown.turndown(html)
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\)(?=\s+["'])/g, ')')
    .trim();

  markdown = markdown.replace(/^## Table of Contents[\s\S]*?(?=^## |^\*\*Author)/m, '').trim();

  const title = decodeEntities(post.title.rendered);
  const excerpt = decodeEntities(post.excerpt.rendered).replace(/^Table of Contents\s*/i, '').trim();
  const markdownSummary = markdown
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const description = (excerpt || markdownSummary).slice(0, 200).replace(/\s+\S*$/, '').trim() + ((excerpt || markdownSummary).length > 200 ? '…' : '');
  const allTags = [...new Set([...categories, ...tags].filter((tag) => tag !== 'Uncategorized'))];
  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `publishedAt: ${post.date.slice(0, 10)}`,
    `updatedAt: ${post.modified.slice(0, 10)}`,
    `category: ${yamlString(primaryCategory(categories))}`,
    `tags: ${JSON.stringify(allTags)}`,
    `cover: ${yamlString(cover)}`,
    `coverAlt: ${yamlString(feature?.alt_text || title)}`,
    `sourceUrl: ${yamlString(post.link)}`,
    'draft: false',
    '---',
    '',
  ].join('\n');

  await fs.mkdir(postsDirectory, { recursive: true });
  await fs.writeFile(path.join(postsDirectory, `${slug}.md`), `${frontmatter}${markdown}\n`, 'utf8');
  console.log(`Migrated: ${slug}`);
}

async function main() {
  for (const [url, relativePath] of sharedAssets) {
    await download(url, relativePath);
  }

  const response = await fetch('https://pedro.tec.br/wp-json/wp/v2/posts?per_page=100&_embed=1');
  if (!response.ok) throw new Error(`WordPress API failed: ${response.status}`);
  const posts = await response.json();
  const selected = posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  for (const post of selected) await migratePost(post);
  console.log(`Finished: ${selected.length} post(s)`);
}

await main();
