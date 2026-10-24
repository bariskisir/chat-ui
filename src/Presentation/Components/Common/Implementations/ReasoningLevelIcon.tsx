import { FC } from 'react';
import { ReasoningEffort } from '../../../../Core/Domain/Enums/ReasoningEffort';

interface IReasoningLevelIconProps
{
  effort: ReasoningEffort;
  size?: number;
  className?: string;
}

const OffPath =
  'M12 2C9.76 2 7.78 3.05 6.5 4.68l1.43 1.43C8.84 4.84 10.32 4 12 4a5 5 0 0 1 5 5c0 1.68-.84 3.16-2.11 4.06l1.42 1.44C17.94 13.21 19 11.24 19 9a7 7 0 0 0-7-7M3.28 4L2 5.27L5.04 8.3C5 8.53 5 8.76 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h5.73l4 4L20 20.72zm3.95 6.5l5.5 5.5H10v-2.42a5 5 0 0 1-2.77-3.08M9 20v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1z';

const DefaultPath =
  'M8 2C11.9 2 15 5.1 15 9C15 11.4 13.8 13.5 12 14.7V17C12 17.6 11.6 18 11 18H5C4.4 18 4 17.6 4 17V14.7C2.2 13.5 1 11.4 1 9C1 5.1 4.1 2 8 2M5 21V20H11V21C11 21.6 10.6 22 10 22H6C5.4 22 5 21.6 5 21M8 4C5.2 4 3 6.2 3 9C3 11.1 4.2 12.8 6 13.6V16H10V13.6C11.8 12.8 13 11.1 13 9C13 6.2 10.8 4 8 4M20.5 14.5V16H19V14.5H20.5M18.5 9.5H17V9C17 7.3 18.3 6 20 6S23 7.3 23 9C23 10 22.5 10.9 21.7 11.4L21.4 11.6C20.8 12 20.5 12.6 20.5 13.3V13.5H19V13.3C19 12.1 19.6 11 20.6 10.4L20.9 10.2C21.3 9.9 21.5 9.5 21.5 9C21.5 8.2 20.8 7.5 20 7.5S18.5 8.2 18.5 9V9.5Z';

const LowPath =
  'M1 11h3v2H1zm9 11c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h-4zm3-21h-2v3h2zM4.9 3.5L3.5 4.9L5.6 7L7 5.6zM20 11v2h3v-2zm-.9-7.5L17 5.6L18.4 7l2.1-2.1zM18 12c0 2.2-1.2 4.2-3 5.2V19c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1v-1.8c-1.8-1-3-3-3-5.2c0-3.3 2.7-6 6-6s6 2.7 6 6M8 12c0 .35.05.68.14 1h7.72c.09-.32.14-.65.14-1c0-2.21-1.79-4-4-4s-4 1.79-4 4';

const MediumPath =
  'M7 5.6L5.6 7L3.5 4.9L4.9 3.5L7 5.6M1 13H4V11H1V13M13 1H11V4H13V1M10 22C10 22.6 10.4 23 11 23H13C13.6 23 14 22.6 14 22V21H10V22M20 11V13H23V11H20M19.1 3.5L17 5.6L18.4 7L20.5 4.9L19.1 3.5M18 12C18 14.2 16.8 16.2 15 17.2V19C15 19.6 14.6 20 14 20H10C9.4 20 9 19.6 9 19V17.2C7.2 16.2 6 14.2 6 12C6 8.7 8.7 6 12 6S18 8.7 18 12M8.56 10H15.44C14.75 8.81 13.5 8 12 8S9.25 8.81 8.56 10Z';

const HighPath =
  'M7 5.6L5.6 7L3.5 4.9l1.4-1.4zM10 22c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1h-4zm-9-9h3v-2H1zM13 1h-2v3h2zm7 10v2h3v-2zm-.9-7.5L17 5.6L18.4 7l2.1-2.1zM18 12c0 2.2-1.2 4.2-3 5.2V19c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1v-1.8c-1.8-1-3-3-3-5.2c0-3.3 2.7-6 6-6s6 2.7 6 6m-6-4c-1 0-1.91.38-2.61 1h5.22C13.91 8.38 13 8 12 8';

const XHighPath =
  'M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63Z';

const Paths: Record<ReasoningEffort, string> =
{
  off: OffPath,
  default: DefaultPath,
  low: LowPath,
  medium: MediumPath,
  high: HighPath,
  xhigh: XHighPath
};

export const ReasoningLevelIcon: FC<IReasoningLevelIconProps> = ({
  effort,
  size = 16,
  className
}) =>
{
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d={Paths[effort]} />
    </svg>
  );
};
