import { JSDOM } from 'jsdom';

export default async function fetchAsDom(url) {
  const response = await fetch(url);
  const doc = await response.text();
  return new JSDOM(doc).window.document;
}
