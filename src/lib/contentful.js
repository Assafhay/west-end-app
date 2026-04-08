import { createClient } from 'contentful';

export const contentfulClient = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function fetchPosts() {
  const res = await contentfulClient.getEntries({
    content_type: 'post',
    order: '-fields.dateISO',
  });
  return res.items.map(normalizePost);
}

export async function fetchPostBySlug(slug) {
  const res = await contentfulClient.getEntries({
    content_type: 'post',
    'fields.slug': slug,
    limit: 1,
  });
  if (res.items.length === 0) return null;
  return normalizePost(res.items[0]);
}

function normalizePost(item) {
  return {
    id: item.sys.id,
    ...item.fields,
  };
}
