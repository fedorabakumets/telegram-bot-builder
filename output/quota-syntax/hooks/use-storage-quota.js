import { useQuery } from "@tanstack/react-query";
function useStorageQuota(projectId) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "storage-quota"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/storage-quota`);
      if (!res.ok) throw new Error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u0432\u043E\u0442\u044B \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430");
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 15e3
  });
  return {
    s3UsedBytes: data?.s3UsedBytes ?? 0,
    totalUsedBytes: data?.totalUsedBytes ?? data?.usedBytes ?? 0,
    usedBytes: data?.usedBytes ?? 0,
    limitBytes: data?.limitBytes ?? null,
    quotaExceeded: data?.quotaExceeded ?? false,
    isLoading
  };
}
export {
  useStorageQuota
};
