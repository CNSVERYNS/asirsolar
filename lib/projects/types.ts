export type ProjectImage = { id: string; url: string };
export type ManagedProject = {
  id: string; name: string; description: string; startDate: string; endDate: string | null;
  published: boolean; createdAt: string; updatedAt: string; images: ProjectImage[];
};
export type ProjectInput = Pick<ManagedProject, "name" | "description" | "startDate" | "endDate" | "published">;
export const MAX_PROJECT_IMAGES = 12;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
