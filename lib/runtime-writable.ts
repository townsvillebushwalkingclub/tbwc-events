/** True only when local/CI tools may write data/ or public/event-covers/. */
export function isRuntimeFilesystemWritable(): boolean {
  return process.env.VERCEL !== '1'
}
