import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Code2,
  Cpu,
  Database,
  FileCode2,
  Flame,
  Layers,
  ServerCog,
  Smartphone,
  Wind,
} from "lucide-react";

const DEFAULT_ICON: LucideIcon = Code2;

const techIconMap: Record<string, LucideIcon> = {
  HTML: FileCode2,
  CSS: Wind,
  JavaScript: Braces,
  TypeScript: Braces,
  React: Layers,
  Tailwind: Wind,
  PHP: ServerCog,
  MySQL: Database,
  Firebase: Flame,
  Java: Code2,
  "Android Studio": Cpu,
  Android: Smartphone,
};

export const getModalTechIcon = (tech: string): LucideIcon =>
  techIconMap[tech] ?? DEFAULT_ICON;
