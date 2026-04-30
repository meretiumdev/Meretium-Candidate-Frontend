export const MOCK_PROFILE = {
  fullName: 'Sarah Johnson',
  initial: 'S',
  headline: 'Senior Product Designer specializing in design systems and user-centered experiences',
  location: 'London, UK',
  experienceLabel: '8 years experience',
  isOpenToWork: true,
  email: 'sarahjohnson@gmail.com',
  phone: '+1-437-876-876',
  about:
    'Passionate product designer with a track record of shipping impactful features used by millions. I thrive at the intersection of design, technology, and human psychology.',
};

export const MOCK_EXPERIENCES = [
  {
    id: '1',
    role: 'Senior Product Designer',
    company: 'Stripe',
    duration: '2021 - Present · 3 years',
    bullets: [
      'Led design for new payment dashboard, increasing merchant satisfaction by 35%',
      'Established design system used across 12 product teams',
      'Mentored 4 junior designers, 2 promoted to mid-level',
    ],
  },
  {
    id: '2',
    role: 'Product Designer',
    company: 'Airbnb',
    duration: '2018 - 2021 · 3 years',
    bullets: [
      'Redesigned host onboarding flow, reducing drop-off by 28%',
      'Shipped mobile-first booking experience reaching 10M+ users',
      'Collaborated with engineers on React component library',
    ],
  },
  {
    id: '3',
    role: 'UX Designer',
    company: 'Figma',
    duration: '2016 - 2018 · 2 years',
    bullets: [
      'Designed prototyping features used by 500k+ designers',
      'Conducted user research with 100+ design teams',
      "Contributed to Figma's public design system documentation",
    ],
  },
];

export const MOCK_SKILL_GROUPS = [
  {
    title: 'Core Skills',
    skills: [
      { id: 'product-design', name: 'Product Design', hot: false },
      { id: 'design-systems', name: 'Design Systems', hot: false },
      { id: 'user-research', name: 'User Research', hot: false },
      { id: 'prototyping', name: 'Prototyping', hot: false },
    ],
  },
  {
    title: 'Tools & Technologies',
    skills: [
      { id: 'figma', name: 'Figma', hot: false },
      { id: 'react', name: 'React', hot: false },
      { id: 'typescript', name: 'TypeScript', hot: false },
      { id: 'sketch', name: 'Sketch', hot: false },
    ],
  },
  {
    title: 'Soft Skills',
    skills: [
      { id: 'leadership', name: 'Leadership', hot: false },
      { id: 'communication', name: 'Communication', hot: false },
      { id: 'problem-solving', name: 'Problem Solving', hot: false },
      { id: 'collaboration', name: 'Collaboration', hot: false },
    ],
  },
];
