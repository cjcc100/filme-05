export const STREAM_PROXY_BASE =
  'https://stream-proxy.claudineiindiocjcc.workers.dev/stream?file=';

export function getStreamUrl(fileName: string) {
  return `${STREAM_PROXY_BASE}${encodeURIComponent(fileName)}`;
}
