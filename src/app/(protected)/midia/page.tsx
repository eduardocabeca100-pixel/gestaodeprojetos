import { ExternalLinkCard } from "@/components/media/external-link-card";
import { MediaUpload } from "@/components/media/media-upload";
import { PhotoGallery } from "@/components/media/photo-gallery";
import { VideoLinkForm } from "@/components/media/video-link-form";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { listMediaItems } from "@/modules/media/queries";

export default async function MediaPage() {
  const mediaItems = await listMediaItems();
  const images = mediaItems.filter((item) => !item.type.includes("Link"));
  const links = mediaItems.filter((item) => item.type.includes("Link"));

  return (
    <PageContainer
      title="Mídia, fotos e links"
      description="Fotos, prints, cartazes, banners e links externos de vídeos ou pastas."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
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
