import type { ProGolfer } from '../types';

export const proGolfers: ProGolfer[] = [
  {
    id: 'rory-mcilroy',
    name: 'Rory McIlroy',
    description:
      'Known for his fluid, powerful swing with exceptional hip rotation and shoulder turn. One of the longest drivers on tour.',
    youtubeLinks: [
      {
        url: 'https://www.youtube.com/results?search_query=rory+mcilroy+swing+slow+motion',
        label: 'Slow Motion Swing',
      },
      {
        url: 'https://www.youtube.com/results?search_query=rory+mcilroy+driver+swing+analysis',
        label: 'Driver Analysis',
      },
    ],
    knownMetrics: {
      shoulderTurn: 95,
      hipRotation: 45,
      xFactor: 55,
    },
  },
  {
    id: 'bryson-dechambeau',
    name: 'Bryson DeChambeau',
    description:
      'Physics-driven approach with single-length irons and extreme speed training. Focuses on maximizing clubhead speed through biomechanics.',
    youtubeLinks: [
      {
        url: 'https://www.youtube.com/results?search_query=bryson+dechambeau+swing+slow+motion',
        label: 'Slow Motion Swing',
      },
      {
        url: 'https://www.youtube.com/results?search_query=bryson+dechambeau+speed+training',
        label: 'Speed Training',
      },
    ],
    knownMetrics: {
      shoulderTurn: 92,
      hipRotation: 48,
      xFactor: 52,
    },
  },
  {
    id: 'tiger-woods',
    name: 'Tiger Woods',
    description:
      'One of the greatest ball strikers in history. Known for exceptional shaft lean at impact and unmatched consistency.',
    youtubeLinks: [
      {
        url: 'https://www.youtube.com/results?search_query=tiger+woods+swing+slow+motion',
        label: 'Slow Motion Swing',
      },
      {
        url: 'https://www.youtube.com/results?search_query=tiger+woods+iron+swing+analysis',
        label: 'Iron Analysis',
      },
    ],
    knownMetrics: {
      shoulderTurn: 90,
      hipRotation: 42,
      shaftLean: 12,
      xFactor: 50,
    },
  },
  {
    id: 'scottie-scheffler',
    name: 'Scottie Scheffler',
    description:
      'World #1 with a compact, efficient motion. Exceptional sequencing and consistency under pressure.',
    youtubeLinks: [
      {
        url: 'https://www.youtube.com/results?search_query=scottie+scheffler+swing+slow+motion',
        label: 'Slow Motion Swing',
      },
      {
        url: 'https://www.youtube.com/results?search_query=scottie+scheffler+swing+analysis',
        label: 'Swing Analysis',
      },
    ],
    knownMetrics: {
      shoulderTurn: 88,
      hipRotation: 40,
      xFactor: 48,
    },
  },
  {
    id: 'viktor-hovland',
    name: 'Viktor Hovland',
    description:
      'Norwegian golfer with a modern, athletic swing. Known for consistency and continuous improvement through data-driven practice.',
    youtubeLinks: [
      {
        url: 'https://www.youtube.com/results?search_query=viktor+hovland+swing+slow+motion',
        label: 'Slow Motion Swing',
      },
      {
        url: 'https://www.youtube.com/results?search_query=viktor+hovland+swing+changes',
        label: 'Swing Changes',
      },
    ],
    knownMetrics: {
      shoulderTurn: 91,
      hipRotation: 43,
      xFactor: 51,
    },
  },
];
