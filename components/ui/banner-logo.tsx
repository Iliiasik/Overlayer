import { cn } from '@/lib/utils';

interface BannerLogoProps {
  className?: string;
}

export function BannerLogo({ className }: BannerLogoProps) {
  return (
    <svg
      viewBox="0 0 624 144"
      role="img"
      aria-label="Overlayer"
      className={cn('h-auto w-full', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0 C205.92 0 411.84 0 624 0 C624 47.52 624 95.04 624 144 C418.08 144 212.16 144 0 144 C0 96.48 0 48.96 0 0 Z "
        fill="var(--banner-line, var(--border))"
        transform="translate(0,0)"
      />
      <path
        d="M0 0 C205.92 0 411.84 0 624 0 C624 47.52 624 95.04 624 144 C418.08 144 212.16 144 0 144 C0 96.48 0 48.96 0 0 Z M9 9 C9 50.58 9 92.16 9 135 C208.98 135 408.96 135 615 135 C615 93.42 615 51.84 615 9 C415.02 9 215.04 9 9 9 Z "
        fill="var(--banner-bg, var(--card))"
        transform="translate(0,0)"
      />
      <path
        d="M0 0 C12.87 0 25.74 0 39 0 C39 2.97 39 5.94 39 9 C41.97 9 44.94 9 48 9 C48 11.97 48 14.94 48 18 C50.97 18 53.94 18 57 18 C57 29.88 57 41.76 57 54 C54.03 54 51.06 54 48 54 C48 56.97 48 59.94 48 63 C45.03 63 42.06 63 39 63 C39 65.97 39 68.94 39 72 C26.13 72 13.26 72 0 72 C0 69.03 0 66.06 0 63 C-2.97 63 -5.94 63 -9 63 C-9 60.03 -9 57.06 -9 54 C-11.97 54 -14.94 54 -18 54 C-18 42.12 -18 30.24 -18 18 C-15.03 18 -12.06 18 -9 18 C-9 15.03 -9 12.06 -9 9 C-6.03 9 -3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(36,33)"
      />
      <path
        d="M0 0 C12.87 0 25.74 0 39 0 C39 2.97 39 5.94 39 9 C41.97 9 44.94 9 48 9 C48 20.88 48 32.76 48 45 C50.97 45 53.94 45 57 45 C57 47.97 57 50.94 57 54 C38.19 54 19.38 54 0 54 C0 51.03 0 48.06 0 45 C-2.97 45 -5.94 45 -9 45 C-9 39.06 -9 33.12 -9 27 C-6.03 27 -3.06 27 0 27 C0 24.03 0 21.06 0 18 C8.91 18 17.82 18 27 18 C27 15.03 27 12.06 27 9 C18.09 9 9.18 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(354,51)"
      />
      <path
        d="M0 0 C9.9 0 19.8 0 30 0 C30 8.91 30 17.82 30 27 C35.94 27 41.88 27 48 27 C48 21.06 48 15.12 48 9 C44.04 9 40.08 9 36 9 C36 6.03 36 3.06 36 0 C46.89 0 57.78 0 69 0 C69 2.97 69 5.94 69 9 C66.03 9 63.06 9 60 9 C60 14.94 60 20.88 60 27 C57.03 27 54.06 27 51 27 C51 32.94 51 38.88 51 45 C47.04 45 43.08 45 39 45 C39 50.94 39 56.88 39 63 C36.03 63 33.06 63 30 63 C30 65.97 30 68.94 30 72 C23.07 72 16.14 72 9 72 C9 66.06 9 60.12 9 54 C12.96 54 16.92 54 21 54 C21 56.97 21 59.94 21 63 C22.98 63 24.96 63 27 63 C27 57.06 27 51.12 27 45 C24.03 45 21.06 45 18 45 C18 39.06 18 33.12 18 27 C15.03 27 12.06 27 9 27 C9 21.06 9 15.12 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(414,51)"
      />
      <path
        d="M0 0 C12.87 0 25.74 0 39 0 C39 2.97 39 5.94 39 9 C41.97 9 44.94 9 48 9 C48 14.94 48 20.88 48 27 C36.12 27 24.24 27 12 27 C12 32.94 12 38.88 12 45 C19.92 45 27.84 45 36 45 C36 42.03 36 39.06 36 36 C39.96 36 43.92 36 48 36 C48 38.97 48 41.94 48 45 C45.03 45 42.06 45 39 45 C39 47.97 39 50.94 39 54 C26.13 54 13.26 54 0 54 C0 51.03 0 48.06 0 45 C-2.97 45 -5.94 45 -9 45 C-9 33.12 -9 21.24 -9 9 C-6.03 9 -3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(498,51)"
      />
      <path
        d="M0 0 C12.87 0 25.74 0 39 0 C39 2.97 39 5.94 39 9 C41.97 9 44.94 9 48 9 C48 14.94 48 20.88 48 27 C36.12 27 24.24 27 12 27 C12 32.94 12 38.88 12 45 C19.92 45 27.84 45 36 45 C36 42.03 36 39.06 36 36 C39.96 36 43.92 36 48 36 C48 38.97 48 41.94 48 45 C45.03 45 42.06 45 39 45 C39 47.97 39 50.94 39 54 C26.13 54 13.26 54 0 54 C0 51.03 0 48.06 0 45 C-2.97 45 -5.94 45 -9 45 C-9 33.12 -9 21.24 -9 9 C-6.03 9 -3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(180,51)"
      />
      <path
        d="M0 0 C9.9 0 19.8 0 30 0 C30 23.76 30 47.52 30 72 C33.96 72 37.92 72 42 72 C42 74.97 42 77.94 42 81 C28.14 81 14.28 81 0 81 C0 78.03 0 75.06 0 72 C2.97 72 5.94 72 9 72 C9 52.2 9 32.4 9 12 C7.02 12 5.04 12 3 12 C3 11.01 3 10.02 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(297,24)"
      />
      <path
        d="M0 0 C9.9 0 19.8 0 30 0 C30 2.97 30 5.94 30 9 C31.98 9 33.96 9 36 9 C36 6.03 36 3.06 36 0 C42.93 0 49.86 0 57 0 C57 5.94 57 11.88 57 18 C48.09 18 39.18 18 30 18 C30 26.91 30 35.82 30 45 C32.97 45 35.94 45 39 45 C39 47.97 39 50.94 39 54 C26.13 54 13.26 54 0 54 C0 51.03 0 48.06 0 45 C2.97 45 5.94 45 9 45 C9 33.12 9 21.24 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(552,51)"
      />
      <path
        d="M0 0 C9.9 0 19.8 0 30 0 C30 2.97 30 5.94 30 9 C31.98 9 33.96 9 36 9 C36 6.03 36 3.06 36 0 C42.93 0 49.86 0 57 0 C57 5.94 57 11.88 57 18 C48.09 18 39.18 18 30 18 C30 26.91 30 35.82 30 45 C32.97 45 35.94 45 39 45 C39 47.97 39 50.94 39 54 C26.13 54 13.26 54 0 54 C0 51.03 0 48.06 0 45 C2.97 45 5.94 45 9 45 C9 33.12 9 21.24 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(234,51)"
      />
      <path
        d="M0 0 C9.9 0 19.8 0 30 0 C30 8.91 30 17.82 30 27 C34.95 27 39.9 27 45 27 C45 21.06 45 15.12 45 9 C42.03 9 39.06 9 36 9 C36 6.03 36 3.06 36 0 C45.9 0 55.8 0 66 0 C66 2.97 66 5.94 66 9 C63.03 9 60.06 9 57 9 C57 14.94 57 20.88 57 27 C54.03 27 51.06 27 48 27 C48 32.94 48 38.88 48 45 C45.03 45 42.06 45 39 45 C39 47.97 39 50.94 39 54 C35.04 54 31.08 54 27 54 C27 51.03 27 48.06 27 45 C24.03 45 21.06 45 18 45 C18 39.06 18 33.12 18 27 C15.03 27 12.06 27 9 27 C9 21.06 9 15.12 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(99,51)"
      />
      <path
        d="M0 0 C4.95 0 9.9 0 15 0 C15 2.97 15 5.94 15 9 C17.97 9 20.94 9 24 9 C24 20.88 24 32.76 24 45 C21.03 45 18.06 45 15 45 C15 47.97 15 50.94 15 54 C10.05 54 5.1 54 0 54 C0 51.03 0 48.06 0 45 C-2.97 45 -5.94 45 -9 45 C-9 33.12 -9 21.24 -9 9 C-6.03 9 -3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--banner-line, var(--border))"
        transform="translate(48,42)"
      />
      <path
        d="M0 0 C4.95 0 9.9 0 15 0 C15 5.94 15 11.88 15 18 C10.05 18 5.1 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="var(--banner-line, var(--border))"
        transform="translate(366,78)"
      />
      <path
        d="M0 0 C2.97 0 5.94 0 9 0 C9 20.79 9 41.58 9 63 C8.01 63 7.02 63 6 63 C6 43.2 6 23.4 6 3 C4.02 3 2.04 3 0 3 C0 2.01 0 1.02 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(300,33)"
      />
      <path
        d="M0 0 C4.95 0 9.9 0 15 0 C15 2.97 15 5.94 15 9 C10.05 9 5.1 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--banner-line, var(--border))"
        transform="translate(510,60)"
      />
      <path
        d="M0 0 C4.95 0 9.9 0 15 0 C15 2.97 15 5.94 15 9 C10.05 9 5.1 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--banner-line, var(--border))"
        transform="translate(192,60)"
      />
      <path
        d="M0 0 C3.96 0 7.92 0 12 0 C12 2.97 12 5.94 12 9 C8.04 9 4.08 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="var(--primary)"
        transform="translate(216,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(561,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(489,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(399,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(243,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(171,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(90,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(72,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 11.88 3 23.76 3 36 C2.01 36 1.02 36 0 36 C0 24.12 0 12.24 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(36,51)"
      />
      <path
        d="M0 0 C2.97 0 5.94 0 9 0 C9 2.97 9 5.94 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="transparent"
        transform="translate(615,135)"
      />
      <path
        d="M0 0 C2.97 0 5.94 0 9 0 C9 2.97 9 5.94 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="transparent"
        transform="translate(0,135)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 8.91 3 17.82 3 27 C2.01 27 1.02 27 0 27 C0 18.09 0 9.18 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(579,69)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 8.91 3 17.82 3 27 C2.01 27 1.02 27 0 27 C0 18.09 0 9.18 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(261,69)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 8.91 3 17.82 3 27 C2.01 27 1.02 27 0 27 C0 18.09 0 9.18 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(441,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 8.91 3 17.82 3 27 C2.01 27 1.02 27 0 27 C0 18.09 0 9.18 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(126,51)"
      />
      <path
        d="M0 0 C2.97 0 5.94 0 9 0 C9 2.97 9 5.94 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="transparent"
        transform="translate(615,0)"
      />
      <path
        d="M0 0 C2.97 0 5.94 0 9 0 C9 2.97 9 5.94 9 9 C6.03 9 3.06 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="transparent"
        transform="translate(0,0)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(423,105)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(450,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(441,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(507,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(462,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(432,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(363,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(345,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(189,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(144,78)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(543,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(471,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(462,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(423,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(225,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(153,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(144,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(108,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(606,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 5.94 3 11.88 3 18 C2.01 18 1.02 18 0 18 C0 12.06 0 6.12 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(288,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(441,114)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(432,105)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(588,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(534,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(498,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(408,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(354,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(336,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(297,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(270,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(234,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(216,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(180,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(135,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(126,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(72,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(36,96)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(543,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(225,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(216,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(81,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(63,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(45,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(27,87)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(354,69)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(525,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(507,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(207,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(189,60)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(588,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(579,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(534,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(498,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(480,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(450,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(414,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(390,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(354,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(270,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(261,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(234,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(216,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(180,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(162,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(135,51)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(81,42)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(63,42)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(45,42)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(27,42)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(72,33)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #fff 30%)"
        transform="translate(36,33)"
      />
      <path
        d="M0 0 C0.99 0 1.98 0 3 0 C3 2.97 3 5.94 3 9 C2.01 9 1.02 9 0 9 C0 6.03 0 3.06 0 0 Z "
        fill="color-mix(in srgb, var(--primary), #000 22%)"
        transform="translate(297,24)"
      />
    </svg>
  );
}
