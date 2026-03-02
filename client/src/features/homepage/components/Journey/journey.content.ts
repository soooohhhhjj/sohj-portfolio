import type { JourneyItemContent } from "./types/journey.types";
import {
  GraduationCap,
  LockKeyholeOpen,
  Puzzle,
  Gavel,
  Drill,
  Telescope,
} from "lucide-react";

const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const journeyContent: JourneyItemContent[] = [
  {
    id: "node1",
    type: "parent",
    icon: LockKeyholeOpen,
    title: "Why IT?",
    modalDetails:
      "I initially chose IT because of the hype and uncertainty about what course to take. What started as a practical decision slowly turned into genuine curiosity as I began understanding how systems and websites are built.",
  },
  {
    id: "node1-c1",
    type: "child",
    title: "Personal Information Website",
    details: "Project introducing HTML and basic CSS.",
    projectExperienceSummary: [
      "I was unexpectedly chosen as the team leader for this project. Since some teammates didn’t have laptops, I volunteered to build the semester website myself using my limited knowledge at the time.",
      "This was where I practiced structuring pages properly and applying core HTML and CSS fundamentals. It was simple, but it taught me responsibility and ownership early on."
    ],
    image: asset("Journey/node1/personal-info.png"),
    techTags: ["HTML", "CSS"],
    highlightTags: ["Basic Fundamentals"],
  },
  {
    id: "node1-c2",
    type: "child",
    title: "Christmas-Themed Forms",
    details: "Project exploring website theming.",
    projectExperienceSummary: [
      "For this project, I explored themed design by researching layouts and styling techniques from various tutorials and references.",
      "I began experimenting with basic JavaScript interactions before fully understanding DOM manipulation. It was largely experimentation, but it helped me connect structure with behavior."
    ],
    image: asset("Journey/node1/christmas-forms.PNG"),
    techTags: ["HTML", "CSS", "JavaScript"],
    highlightTags: ["Themes"],
  },
  {
    id: "node1-c3",
    type: "child",
    title: "Our Interests Website",
    details: "Frameset project using CSS for animations.",
    projectExperienceSummary: [
      "This project focused on adding CSS animations to enhance presentation.",
      "I researched different animation techniques and adapted them into the site. It wasn’t fully original work, but it strengthened my ability to understand and modify existing code."
    ],
    image: asset("Journey/node1/interests-frameset.png"),
    techTags: ["HTML", "CSS", "JavaScript"],
    highlightTags: ["Animations"],
  },

  {
    id: "node2",
    type: "parent",
    icon: Puzzle,
    title: "First Puzzle Piece",
    modalDetails:
      "This was the phase where I genuinely started enjoying programming. While others struggled with fundamentals, I found excitement in seeing even simple programs run successfully. That’s when IT stopped feeling like a random choice and started feeling intentional.",
  },
  {
    id: "node2-c1",
    type: "child",
    title: "Market Square",
    details: "Interactive e-commerce landing page project.",
    projectExperienceSummary: [
      "This was my attempt at building a more complete front-end experience inspired by platforms like Shopee and Carousell.",
      "Although the design was heavily reference-based and not fully original, I combined elements thoughtfully to create a cohesive interface.",
      "It was purely front-end and not responsive, but it was the first time I felt confident in my UI-building abilities."
    ],
    image: asset("Journey/node2/market-square.PNG"),
    techTags: ["HTML", "CSS", "JavaScript"],
    highlightTags: ["UI/UX"],
  },
  {
    id: "node2-c2",
    type: "child",
    title: "NCII Certificate",
    details: "Formal training in IT fundamentals.",
    projectExperienceSummary: [
      "Through formal IT training, I learned hardware assembly, basic networking concepts, client-server setup, and computer servicing.",
      "While hardware troubleshooting isn’t my main interest, this training gave me a foundational understanding of systems beyond software."
    ],
    image: asset("Journey/node2/nc2-certi.PNG"),
    highlightTags: ["Installation", "Configuration", "Basic Networking"],
  },

  {
    id: "node3",
    type: "parent",
    icon: Gavel,
    title: "Backend with Frontend",
    modalDetails:
      "This phase introduced me to backend integration. I began connecting user interfaces to databases and understanding how data flows through an application. It wasn’t clean or structured yet, but it was my first exposure to full-stack thinking.",
  },
  {
    id: "node3-c1",
    type: "child",
    title: "Game Space",
    details: "Backend PHP/MySQL project with a space theme.",
    projectExperienceSummary: [
      "Originally meant to demonstrate basic PHP syntax, I expanded it into a themed CRUD e-commerce-style project.",
      "This was my first real experience integrating front-end interfaces with backend logic and database operations.",
      "The structure was messy, but it helped me understand how server-side processing works."
    ],
    image: asset("Journey/node3/game-space.PNG"),
    techTags: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
  },
  {
    id: "node3-c2",
    type: "child",
    title: "Class Funds",
    details: "Mock banking app built for a classroom setting.",
    projectExperienceSummary: [
      "This Android-based classroom banking simulation was built using Java and Firebase.",
      "While I relied heavily on external assistance to structure parts of the code, I understood the system logic, features, and how data interacted within the application.",
      "It exposed me to mobile development and real-time database integration."
    ],
    image: asset("Journey/node3/class-funds3.jpg"),
    techTags: ["Java", "Firebase", "Android Studio"],
    highlightTags: ["Mobile App"],
  },

  {
    id: "node4",
    type: "parent",
    icon: Drill,
    title: "Fixing Real Problems",
    modalDetails:
      "This stage involved thesis projects and internship exposure. I transitioned from building academic exercises to solving real client problems, handling constraints, debugging under pressure, and collaborating more professionally.",
  },
  {
    id: "node4-c1",
    type: "child",
    title: "System Architecture Thesis",
    details:
      "An inventory management system designed to help the beneficiary reduce stock discrepancies.",
    projectExperienceSummary: [
      "As team leader and main developer, I designed the system architecture, database structure, and built both front-end and backend components.",
      "One major lesson here was prioritization — I spent too much time polishing UI before completing core features, which led to rushed functionality later.",
      "Despite that, I implemented dynamic data generation scripts to simulate multi-year datasets for presentation and analytics purposes."
    ],
    image: asset("Journey/node4/sysarch.PNG"),
    techTags: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
  },
  {
    id: "node4-c2",
    type: "child",
    title: "Capstone Thesis",
    details:
      "A system for the CSS department to centralize freshmen screening data.",
    projectExperienceSummary: [
      "In this project, I was not the main developer but contributed during planning, debugging, and integration stages.",
      "I assisted in resolving logic errors, unintended behaviors, and minor database connection issues.",
      "This experience taught me how to support a project without leading it from the ground up."
    ],
    image: asset("Journey/node4/capstone-thesis.png"),
    techTags: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
  },
  {
    id: "node4-c3",
    type: "internship",
    title: "IT Internship Experience",
    details:
      "IT intern at Transfer It, gaining hands-on experience across departments.",
    projectExperienceSummary: [
      "I rotated across multiple departments, gaining exposure to real operational workflows.",
      "I assisted in CCTV maintenance, printer troubleshooting, driver installation, remote technical support, inventory handling, and documentation.",
      "Later, I joined the creative team to explore AI tools and automation opportunities, supporting workflow improvements and weekly reporting preparation."
    ],
    image: asset("Journey/node4/tit-logo.png"),
    highlightTags: [
      "Hardware Maintenance",
      "Troubleshooting",
      "OS Setup",
      "Remote Support",
      "System Administration",
      "Documentation",
    ],
  },

  {
    id: "node5",
    type: "parent",
    icon: GraduationCap,
    title: "Graduation",
    modalDetails:
      "After graduation, I focused on refining my portfolio and development practices. I began transitioning from purely project-based learning to thinking more about scalability, structure, and professional standards.",
  },
  {
    id: "node5-c1",
    type: "child",
    title: "My First Portfolio",
    details:
      "First attempt at building a portfolio with modern frameworks.",
    projectExperienceSummary: [
      "This was my first serious attempt at using React and Tailwind.",
      "I learned by building and adjusting as I went, which resulted in messy but functional architecture.",
      "Although not scalable, it gave me confidence in working with modern front-end tools."
    ],
    image: asset("Journey/node5/portfolio.PNG"),
    techTags: ["React", "Tailwind", "TypeScript"],
  },
  {
    id: "node5-c2",
    type: "child",
    title: "Portfolio v2",
    details:
      "Improved version of my portfolio focused on structure and scalability.",
    projectExperienceSummary: [
      "This version focused on improving structure, reusability, and component separation.",
      "I began paying more attention to scalability, type safety with TypeScript, and better project organization.",
      "While still imperfect, this project represents my shift toward thinking more like a software engineer rather than just shipping features."
    ],
    image: asset("Journey/node5/portfolio-v2.PNG"),
    techTags: ["React", "Tailwind", "TypeScript"],
  },

  {
  id: "node6",
  type: "parent",
  icon: Telescope,
  title: "Current & Future Builds",
  modalDetails:
    "This is my current phase — identifying real friction points in daily workflows and designing tools to simplify them. Instead of building for grades, I’m now building for efficiency, usability, and long-term scalability. These projects start as personal solutions but are designed with growth potential in mind.",
},

{
  id: "node6-p1",
  type: "placeholder",
  title: "JFCM Website Platform",
  details: "Workflow automation and ministry content platform.",
  modalProblemToAddress:
    "Preparing PowerPoint slides for worship services is repetitive and manual. Lyrics and chords are repeatedly typed and formatted, which is time-consuming and prone to inconsistency. There is also no centralized system for sermon recordings, worship archives, and simbahay resources.",
  modalPlannedFeatureSummary: [
    "Automated lyric-to-slide generator with clean formatting",
    "Chord integration system to avoid manually retyping chords",
    "Centralized homepage for sermon recordings and worship archives",
    "Expandable platform for simbahay announcements and resources",
  ],
},

{
  id: "node6-p2",
  type: "placeholder",
  title: "Sohj's DnD Tools",
  details: "Version-controlled character creation and tracking system.",
  modalProblemToAddress:
    "Character sheets are static and hard to track over time. Changes to skills, features, and stats are not logged clearly, and managing updates during gameplay becomes messy.",
  modalPlannedFeatureSummary: [
    "Character builder with structured skill and feature management",
    "Change log system similar to version control (tracking edits over time)",
    "Session-based tracking for stats, abilities, and progression",
    "Editable, modular skill and feature components",
  ],
},

{
  id: "node6-p3",
  type: "placeholder",
  title: "Personal File Converter",
  details: "High-quality local file conversion tool.",
  modalProblemToAddress:
    "Most online file converters compress or reduce quality, and uploading files repeatedly is inefficient and raises privacy concerns.",
  modalPlannedFeatureSummary: [
    "Local-first file conversion to preserve original quality",
    "Support for multiple file formats (image, document, media)",
    "Batch processing support",
    "Clean UI for quick drag-and-drop workflow",
  ],
},

{
  id: "node6-p4",
  type: "placeholder",
  title: "Sohj's DC Wiki",
  details: "Structured loot and knowledge reference system.",
  modalProblemToAddress:
    "Finding loot details, item information, and references in DeceasedCraft can be inefficient and scattered across multiple sources.",
  modalPlannedFeatureSummary: [
    "Structured searchable database for items and loot",
    "Visual categorization and tagging system",
    "Fast filtering and sorting features",
    "Potential public access for community use",
  ],
},

{
  id: "node6-p5",
  type: "placeholder",
  title: "File Tree System Visualizer",
  details: "Architecture visualization tool for large systems.",
  modalProblemToAddress:
    "Large-scale projects become difficult to understand when file structures grow complex. It becomes harder to see relationships between modules and system flow.",
  modalPlannedFeatureSummary: [
    "Interactive visual representation of project file structures",
    "Dependency mapping between modules",
    "Searchable node-based navigation",
    "Scalable rendering for large repositories",
  ],
},
{
  id: "node6-p6",
  type: "placeholder",
  title: "Visual Job Application Tracker",
  details: "Personal dashboard for tracking applications.",
  modalProblemToAddress:
    "Tracking job applications in spreadsheets feels rigid and uninspiring. I want a more visual and interactive way to manage applications and progress.",
  modalPlannedFeatureSummary: [
    "Kanban-style job tracking board",
    "Application status history and timeline",
    "Notes and interview tracking per company",
    "Analytics dashboard for application trends",
  ],
},
];
