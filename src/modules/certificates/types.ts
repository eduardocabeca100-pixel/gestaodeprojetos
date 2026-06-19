export const certificateStatuses = [
  "Rascunho",
  "Pronto",
  "Emitido",
  "Cancelado",
] as const;

export const certificateLogoPositions = [
  "esquerda",
  "centro",
  "direita",
  "rodape_completo",
] as const;

export const certificateLogoTypes = [
  "realização",
  "apoio",
  "patrocínio",
  "parceria",
  "projeto cultural",
  "instituição",
] as const;

export const certificateFooterLayouts = [
  "compacto",
  "padrao",
  "expandido",
  "categorias",
  "linha_unica",
  "blocos",
] as const;

export const certificatePageOrientations = ["paisagem", "retrato"] as const;

export type CertificateStatus = (typeof certificateStatuses)[number];
export type CertificateLogoPosition = (typeof certificateLogoPositions)[number];
export type CertificateLogoType = (typeof certificateLogoTypes)[number];
export type CertificatePageOrientation = (typeof certificatePageOrientations)[number];
export type CertificateFooterLayout = (typeof certificateFooterLayouts)[number];

export type CertificateTemplate = {
  id: string;
  projectId: string | null;
  name: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  titleColor: string;
  borderColor: string;
  borderEnabled: boolean;
  backgroundImageUrl: string | null;
  logoMainUrl: string | null;
  logoSecondaryUrl: string | null;
  footerLogosEnabled: boolean;
  frontText: string;
  conclusionText: string;
  backTitle: string;
  programContent: string;
  workload: string;
  city: string;
  showStudentCpf: boolean;
  showWorkloadFront: boolean;
  showModality: boolean;
  showProjectName: boolean;
  backColumns: 1 | 2;
  finalBackImageEnabled: boolean;
  finalBackImageUrl: string | null;
  finalBackImagePosition: CertificateLogoPosition;
  finalBackImageWidth: number;
  finalBackImageHeight: number;
  finalBackImageMarginTop: number;
  finalBackImageMarginBottom: number;
  finalBackImageShowOnPdf: boolean;
  finalBackImageKeepAspectRatio: boolean;
  showBackLogos: boolean;
  showBackWorkload: boolean;
  showBackTeacher: boolean;
  showBackRegistry: boolean;
  showBackBookFolio: boolean;
  showBackSignature: boolean;
  pageOrientation: CertificatePageOrientation;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  createdAt: string;
  updatedAt: string;
};

export type CertificateSignature = {
  id: string;
  templateId: string;
  name: string;
  role: string;
  signatureUrl: string | null;
  order: number;
  showOnFront: boolean;
  showOnBack: boolean;
  createdAt: string;
};

export type CertificateSponsorLogo = {
  id: string;
  templateId: string;
  name: string;
  type: CertificateLogoType;
  logoUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
  displayWidthMm: number;
  maxHeightMm: number;
  position: CertificateLogoPosition;
  order: number;
  displayOrder: number;
  size: number;
  showOnFront: boolean;
  showOnBack: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CertificateRecord = {
  id: string;
  projectId: string;
  templateId: string;
  participantId: string;
  certificateNumber: string;
  studentName: string;
  studentDocument: string;
  courseName: string;
  modality: string;
  workload: string;
  city: string;
  issueDate: string;
  status: CertificateStatus;
  pdfUrl: string | null;
  generatedBy: string | null;
  generatedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
};

export type CertificateBatch = {
  id: string;
  projectId: string;
  templateId: string;
  name: string;
  totalCertificates: number;
  pdfUrl: string | null;
  zipUrl: string | null;
  generatedBy: string | null;
  generatedAt: string | null;
  createdAt: string;
};

export type CertificateSettings = {
  logoMainUrl: string | null;
  logoSecondaryUrl: string | null;
  logoInstitutionUrl: string | null;
  logoCiaUrl: string | null;
  sponsorLogosEnabled: boolean;
  primaryColor: string;
  secondaryColor: string;
  borderColor: string;
  titleColor: string;
  titleFont: string;
  bodyFont: string;
  modelName: string;
  pageOrientation: CertificatePageOrientation;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  borderEnabled: boolean;
  borderThickness: number;
  backgroundEnabled: boolean;
  backgroundImageUrl: string | null;
  backgroundOpacity: number;
  frontText: string;
  conclusionText: string;
  showStudentCpf: boolean;
  showCityDate: boolean;
  showModality: boolean;
  showProjectName: boolean;
  showWorkloadFront: boolean;
  showFooterLogos: boolean;
  showFooterFront: boolean;
  showFooterBack: boolean;
  useSameFooterOnBack: boolean;
  showCategoryTitles: boolean;
  showDividers: boolean;
  logoSpacing: number;
  footerMarginTopMm: number;
  footerMarginBottomMm: number;
  footerLayout: CertificateFooterLayout;
  footerHeight: number;
  footerLogoSize: number;
  backTitle: string;
  programContent: string;
  backColumns: 1 | 2;
  showBackWorkload: boolean;
  showBackTeacher: boolean;
  showBackRegistry: boolean;
  showBackBookFolio: boolean;
  showBackSignature: boolean;
  showBackLogos: boolean;
  finalBackImageEnabled: boolean;
  finalBackImageUrl: string | null;
  finalBackImagePosition: CertificateLogoPosition;
  finalBackImageWidth: number;
  finalBackImageHeight: number;
  finalBackImageMarginTop: number;
  finalBackImageMarginBottom: number;
  finalBackImageShowOnPdf: boolean;
  finalBackImageKeepAspectRatio: boolean;
  allow1Signature: boolean;
  allow2Signatures: boolean;
  allow3Signatures: boolean;
  bookLabel: string;
  folioLabel: string;
};
