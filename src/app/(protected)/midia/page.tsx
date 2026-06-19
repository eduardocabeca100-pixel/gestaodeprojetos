import { ExternalLinkCard } from "@/components/media/external-link-card";
import { MediaUpload } from "@/components/media/media-upload";
import { PhotoGallery } from "@/components/media/photo-gallery";
import { VideoLinkForm } from "@/components/media/video-link-form";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { listMediaItems } from "@/modules/media/queries";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const mediaItems = await listMediaItems();
  const images = mediaItems.filter((item) => !item.type.includes("Link"));
  const links = mediaItems.filter((item) => item.type.includes("Link"));

  return (
    <PageContainer
      title="Mídia, fotos e links"
      description="Fotos, prints, cartazes, banners e links externos de vídeos ou pastas."
    >
      <ProjectScopeBanner projectId={projectId} />
      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionCard title="Galeria" description="Fotos e imagens selecionáveis para dossiê.">
          <PhotoGallery items={images} />
        </SectionCard>
        <div className="space-y-4">
          <SectionCard title="Upload de imagem">
            <MediaUpload />
          </SectionCard>
          <SectionCard title="Link externo">
            <VideoLinkForm />
          </SectionCard>
        </div>
      </div>
      <SectionCard title="Links cadastrados">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.map((item) => (
            <ExternalLinkCard key={item.id} item={item} />
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
