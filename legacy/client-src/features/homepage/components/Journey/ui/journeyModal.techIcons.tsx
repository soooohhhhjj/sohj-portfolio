import type { JSX } from 'react';
import { Code2 } from 'lucide-react';
import {
  FaAndroid,
  FaBootstrap,
  FaCss3Alt,
  FaGithub,
  FaHtml5,
  FaJava,
  FaNodeJs,
  FaPhp,
  FaReact,
} from 'react-icons/fa';
import { IoLogoJavascript } from 'react-icons/io5';

const iconClass = "h-4 w-4";
const imageClass = "h-4 w-4 object-contain";

const journeyModalTechIconMap: Record<string, JSX.Element> = {
  HTML: <FaHtml5 className={`${iconClass} text-orange-500`} />,
  CSS: <FaCss3Alt className={`${iconClass} text-blue-500`} />,
  JavaScript: <IoLogoJavascript className={`${iconClass} text-yellow-400`} />,
  TypeScript: (
    <img
      src="https://www.svgrepo.com/show/354478/typescript-icon.svg"
      alt="TypeScript"
      className={imageClass}
    />
  ),
  React: <FaReact className={`${iconClass} text-cyan-400`} />,
  Tailwind: (
    <img
      src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg"
      alt="Tailwind CSS"
      className={imageClass}
    />
  ),
  GitHub: <FaGithub className={`${iconClass} text-gray-200`} />,
  Bootstrap: <FaBootstrap className={`${iconClass} text-purple-400`} />,
  NodeJS: <FaNodeJs className={`${iconClass} text-green-500`} />,
  "Node.js": <FaNodeJs className={`${iconClass} text-green-500`} />,
  PHP: <FaPhp className={`${iconClass} text-indigo-300`} />,
  Java: <FaJava className={`${iconClass} text-red-500`} />,
  Android: <FaAndroid className={`${iconClass} text-green-400`} />,
  "Android Studio": <FaAndroid className={`${iconClass} text-[#3DDC84]`} />,
  Firebase: (
    <img
      src="https://www.svgrepo.com/show/353735/firebase.svg"
      alt="Firebase"
      className={imageClass}
    />
  ),
  MySQL: (
    <img
      src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg"
      alt="MySQL"
      className={imageClass}
    />
  ),
};

export const getJourneyModalTechIcon = (tech: string): JSX.Element =>
  journeyModalTechIconMap[tech] ?? <Code2 className="h-4 w-4 text-white/80" />;
