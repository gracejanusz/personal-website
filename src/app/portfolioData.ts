import imgImage4 from "@/imports/MaskGroup/8dc43825e332b5baf24aa8ee9ccc9c29b248c6dd.png";
import imgScreenshot20260731At53832Pm1 from "@/imports/MaskGroup/717261b94f22d4dda62cbf7ffc956df63e8fc8f9.png";
import imgScreenshot20260731At53208Pm1 from "@/imports/MaskGroup/a414cc36ec188732145fe3720042842317df0d18.png";
import imgImg45851 from "@/imports/MaskGroup/ebf4942885ec966f20323a6b76da999ad3de7616.png";
import imgImg39401 from "@/imports/MaskGroup/b5e82ec68228d80e91587fc56f2fcded0dbbbdf3.png";
import imgWhpk from "@/imports/MaskGroup/whpk.png";
import imgMireview from "@/imports/MaskGroup/mireview.png";
import imgHandsInDashboard from "@/imports/MaskGroup/HandsIn-dashboard.png";
import imgHandsInLesson from "@/imports/MaskGroup/HandsIn-Lesson.png";
import imgEntrepreneurship from "@/imports/MaskGroup/entrepreneurship.jpg";
import imgMusic from "@/imports/MaskGroup/music.jpg";
import imgBand from "@/imports/MaskGroup/band.jpeg";
import imgWebOpsPrimary from "@/imports/MaskGroup/861D34AD-C5C1-401B-A83B-A7D15CE64584_1_102_o.jpeg";
import imgProjectsPrimary from "@/imports/MaskGroup/D9376180-4DF1-4950-B035-088523E476F7_1_105_c.jpeg";
import imgPhotosPrimary from "@/app/photos/4674BD32-C046-413F-A70C-0549CCBA6938_1_105_c.jpeg";

export type Tag = {
  label: string;
  href?: string;
};

export type Project = {
  id: string;
  title: string;
  subtitle: string;
  index: string;
  images: string[];
  primaryImage: string;
  description: string;
  tags: Tag[];
  href?: string;
};

export const projects: Project[] = [
  {
    id: "webops-it",
    title: "WEB OPS / IT",
    subtitle: "",
    index: "001",
    primaryImage: imgWebOpsPrimary,
    images: [imgWebOpsPrimary, imgScreenshot20260731At53208Pm1, imgScreenshot20260731At53832Pm1, imgImg45851],
    description:
      "IT and web operations across Milken Institute and Matrix Group — frontend for sites with 50k+ monthly visitors, Microsoft 365 for 500 staff, security audits, Ghost Inspector regression suites, and GitLab CI/CD. Also technical support for 500+ faculty and staff at UChicago Arts & Humanities.",
    tags: [
      { label: "Cybersecurity" },
      { label: "Infrastructure" },
      { label: "GitLab CI/CD" },
      { label: "Security" },
    ],
  },
  {
    id: "projects",
    title: "PROJECTS",
    subtitle: "",
    index: "002",
    primaryImage: imgProjectsPrimary,
    images: [imgProjectsPrimary, imgHandsInDashboard, imgHandsInLesson],
    description:
      "A chronological record of builds — Craps, crypto modelling, ASL Learning WebApp, MyGrotonApp, ZebraSales, and data structures work.",
    tags: [
      { label: "Timeline" },
      { label: "ML" },
      { label: "Web" },
      { label: "iOS" },
    ],
    href: "/projects",
  },
  {
    id: "entrepreneurship",
    title: "ENTREPRENEURSHIP",
    subtitle: "",
    index: "003",
    primaryImage: imgEntrepreneurship,
    images: [imgEntrepreneurship],
    description:
      "CEO and Technical Founder of HandsIn — ASL e-learning with real-time sign detection (PyTorch, OpenCV, MediaPipe). 2nd Place at UChicago College New Venture Challenge; 4th at Booth MBA Social NVC; Polsky Summer Launch.",
    tags: [
      { label: "HandsIn", href: "https://handsinlearning.co" },
      { label: "PyTorch" },
      { label: "NVC", href: "https://polsky.uchicago.edu/2026/02/27/7-startups-to-compete-for-investment-at-the-202-college-new-venture-challenge/" },
      { label: "Polsky" },
    ],
  },
  {
    id: "web-design",
    title: "WEB DESIGN",
    subtitle: "",
    index: "004",
    primaryImage: imgWhpk,
    images: [imgWhpk, imgMireview, imgHandsInDashboard, imgHandsInLesson],
    description:
      "Upkeep and content population for milkenreview.org, whpk.org, and handsinlearning.co — maintaining live editorial, radio, and product surfaces and keeping all three sites populated and current.",
    tags: [
      { label: "milkenreview.org", href: "https://milkenreview.org" },
      { label: "whpk.org", href: "https://whpk.org" },
      { label: "handsinlearning.co", href: "https://handsinlearning.co" },
    ],
  },
  {
    id: "music",
    title: "MUSIC",
    subtitle: "",
    index: "005",
    primaryImage: imgMusic,
    images: [imgMusic, imgBand],
    description:
      "Music production, djing, photography, and concerts.",
    tags: [
      { label: "Spotify", href: "https://open.spotify.com/artist/20PjwBPVaxFWUmtgHTEtHn?si=0o5A5tUlT9qFPVm-sS6eYQ" },
      { label: "SoundCloud", href: "https://soundcloud.com/grace-131551047" },
      { label: "WHPK", href: "https://whpk.org" },
    ],
  },
  {
    id: "photos",
    title: "PHOTOS",
    subtitle: "",
    index: "006",
    primaryImage: imgPhotosPrimary,
    images: [imgPhotosPrimary, imgImg39401, imgImage4, imgImg45851],
    description:
      "Photographic documentation and visual archive — high-contrast field captures, digitised and preserved as part of an ongoing personal practice.",
    tags: [
      { label: "Photography" },
      { label: "Archive" },
      { label: "B&W" },
      { label: "Field" },
    ],
    href: "/photos",
  },
];

export const projectsById = Object.fromEntries(
  projects.map((p) => [p.id, p]),
) as Record<string, Project>;
