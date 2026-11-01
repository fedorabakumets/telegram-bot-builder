function updateFileSizeCache(client, projectId, file, size) {
  if (!Number.isSafeInteger(size) || size <= 0) return;
  client.setQueriesData({ queryKey: ["/api/projects", projectId, "files"] }, (page) => {
    if (!page?.files) return page;
    return { ...page, files: page.files.map((item) => item.id === file.id && item.source === file.source && item.fileId === file.fileId ? { ...item, fileSize: size } : item) };
  });
}
export {
  updateFileSizeCache
};
