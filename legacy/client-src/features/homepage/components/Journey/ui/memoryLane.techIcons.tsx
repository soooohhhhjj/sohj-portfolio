import type { JSX } from 'react';
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

const ICON_SIZE = "text-[9px]";
const ICON_MARGIN_RIGHT = "mr-[2px]";

export const techIconMap: Record<string, JSX.Element> = {
  HTML: <FaHtml5 className={`text-orange-500 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  CSS: <FaCss3Alt className={`text-blue-500 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  JavaScript: <IoLogoJavascript className={`text-yellow-400 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  React: <FaReact className={`text-cyan-400 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  GitHub: <FaGithub className={`text-gray-300 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  Bootstrap: <FaBootstrap className={`text-purple-400 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  NodeJS: <FaNodeJs className={`text-green-500 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  PHP: <FaPhp className={`text-indigo-400 ${ICON_SIZE} mr-[4px]`} />,
  Java: <FaJava className={`text-red-500 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,
  Android: <FaAndroid className={`text-green-400 ${ICON_SIZE} ${ICON_MARGIN_RIGHT}`} />,

  'Android Studio': <FaAndroid className="text-[#3DDC84] mr-[3px]" />,
  Firebase: (
    <img
      src="https://www.svgrepo.com/show/353735/firebase.svg"
      alt="Firebase"
      className="w-2 h-2 mr-[2px]"
    />
  ),
  MySQL: (
    <img
      src="https://www.svgrepo.com/show/303251/mysql-logo.svg"
      alt="MySQL"
      className="w-2 h-2 mr-[4px]"
    />
  ),
  Tailwind: (
    <img
      src="https://www.svgrepo.com/show/354431/tailwindcss-icon.svg"
      alt="Tailwind CSS"
      className="w-2 h-2 mr-[3px]"
    />
  ),
  TypeScript: (
    <img
      src="https://logo.svgcdn.com/logos/typescript-icon.svg"
      alt="TypeScript"
      className="w-2 h-2 mr-[3px]"
    />
  ),
};


