import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

export type IconName =
  | 'pulse'
  | 'backstage'
  | 'chats'
  | 'profile'
  | 'vault'
  | 'save'
  | 'alert'
  | 'plus'
  | 'legacy'
  | 'scan'
  | 'more'
  | 'share'
  | 'report'
  | 'block'
  | 'refresh'
  | 'handshake'
  | 'invite'
  | 'adopt'
  | 'settings'
  | 'edit'
  | 'views'
  | 'live'
  | 'call'
  | 'video'
  | 'send'
  | 'attach'
  | 'mic'
  | 'filter'
  | 'link'
  | 'pin'
  | 'qr'
  | 'nfc'
  | 'nearby'
  | 'gallery'
  | 'lock'
  | 'people'
  | 'circles'
  | 'inbox'
  | 'chevron-right'
  | 'close';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export const Icon = ({ name, size = 20, color, strokeWidth = 1.8 }: IconProps) => {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.textPrimary;
  const props = {
    stroke: resolvedColor,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'pulse' ? (
        <>
          <Circle cx="12" cy="12" r="8" {...props} />
          <Path d="M6 12h3l2-4 2 8 2-4h3" {...props} />
        </>
      ) : null}
      {name === 'backstage' ? (
        <>
          <Rect x="4" y="5" width="16" height="5" rx="2" {...props} />
          <Rect x="4" y="12" width="16" height="7" rx="2" {...props} />
        </>
      ) : null}
      {name === 'chats' ? (
        <>
          <Path d="M5 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" {...props} />
        </>
      ) : null}
      {name === 'profile' ? (
        <>
          <Circle cx="12" cy="8" r="3" {...props} />
          <Path d="M5 20c1.8-3 5-4.5 7-4.5s5.2 1.5 7 4.5" {...props} />
        </>
      ) : null}
      {name === 'vault' ? (
        <>
          <Rect x="4" y="4" width="16" height="16" rx="3" {...props} />
          <Circle cx="12" cy="12" r="3" {...props} />
          <Line x1="12" y1="9" x2="12" y2="15" {...props} />
          <Line x1="9" y1="12" x2="15" y2="12" {...props} />
        </>
      ) : null}
      {name === 'save' ? (
        <>
          <Path d="M6 4h12v16l-6-4-6 4V4z" {...props} />
        </>
      ) : null}
      {name === 'alert' ? (
        <>
          <Path d="M12 4l7 14H5l7-14z" {...props} />
          <Line x1="12" y1="9" x2="12" y2="13" {...props} />
          <Circle cx="12" cy="16" r="1" {...props} />
        </>
      ) : null}
      {name === 'plus' ? (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...props} />
          <Line x1="5" y1="12" x2="19" y2="12" {...props} />
        </>
      ) : null}
      {name === 'legacy' ? (
        <>
          <Path d="M12 4l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V8l7-4z" {...props} />
          <Line x1="9" y1="12" x2="15" y2="12" {...props} />
        </>
      ) : null}
      {name === 'scan' ? (
        <>
          <Path d="M4 8V4h4M16 4h4v4M4 16v4h4M20 16v4h-4" {...props} />
          <Line x1="7" y1="12" x2="17" y2="12" {...props} />
        </>
      ) : null}
      {name === 'more' ? (
        <>
          <Circle cx="6" cy="12" r="1.5" {...props} />
          <Circle cx="12" cy="12" r="1.5" {...props} />
          <Circle cx="18" cy="12" r="1.5" {...props} />
        </>
      ) : null}
      {name === 'share' ? (
        <>
          <Circle cx="18" cy="5" r="2" {...props} />
          <Circle cx="6" cy="12" r="2" {...props} />
          <Circle cx="18" cy="19" r="2" {...props} />
          <Line x1="8" y1="11" x2="16" y2="7" {...props} />
          <Line x1="8" y1="13" x2="16" y2="17" {...props} />
        </>
      ) : null}
      {name === 'report' ? (
        <>
          <Path d="M6 4h10l2 2v14H6z" {...props} />
          <Line x1="9" y1="9" x2="15" y2="9" {...props} />
          <Line x1="9" y1="13" x2="15" y2="13" {...props} />
        </>
      ) : null}
      {name === 'block' ? (
        <>
          <Circle cx="12" cy="12" r="8" {...props} />
          <Line x1="7" y1="7" x2="17" y2="17" {...props} />
        </>
      ) : null}
      {name === 'refresh' ? (
        <>
          <Path d="M20 12a8 8 0 1 1-2-5.5" {...props} />
          <Path d="M20 4v5h-5" {...props} />
        </>
      ) : null}
      {name === 'handshake' ? (
        <>
          <Path d="M4 12l4-4 4 4" {...props} />
          <Path d="M20 12l-4-4-4 4" {...props} />
          <Line x1="8" y1="12" x2="16" y2="12" {...props} />
          <Line x1="10" y1="14" x2="14" y2="14" {...props} />
        </>
      ) : null}
      {name === 'invite' ? (
        <>
          <Circle cx="12" cy="12" r="8" {...props} />
          <Line x1="12" y1="8" x2="12" y2="16" {...props} />
          <Line x1="8" y1="12" x2="16" y2="12" {...props} />
        </>
      ) : null}
      {name === 'adopt' ? (
        <>
          <Path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.5-7 9-7 9z" {...props} />
        </>
      ) : null}
      {name === 'settings' ? (
        <>
          <Circle cx="12" cy="12" r="3" {...props} />
          <Path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M6.5 17.5l1.5-1.5M16 8l1.5-1.5" {...props} />
        </>
      ) : null}
      {name === 'edit' ? (
        <>
          <Path d="M4 16l8-8 4 4-8 8H4v-4z" {...props} />
          <Line x1="13" y1="7" x2="17" y2="11" {...props} />
        </>
      ) : null}
      {name === 'views' ? (
        <>
          <Path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" {...props} />
          <Circle cx="12" cy="12" r="2.5" {...props} />
        </>
      ) : null}
      {name === 'live' ? (
        <>
          <Rect x="3" y="6" width="14" height="12" rx="2" {...props} />
          <Path d="M17 9l4-2v10l-4-2" {...props} />
        </>
      ) : null}
      {name === 'call' ? (
        <>
          <Path d="M6 4c1.5 3 3 5 5 7s4 3.5 7 5l3-3c-1.5-1.5-3-2-4.5-2.2l-1.5 1.2c-1.5-0.6-3-1.8-4.2-3S8.6 6.5 8 5l1.2-1.5C9 1.9 8.6 1 7 0.5" {...props} />
        </>
      ) : null}
      {name === 'video' ? (
        <>
          <Rect x="3" y="6" width="14" height="12" rx="2" {...props} />
          <Path d="M17 10l4-2v8l-4-2" {...props} />
        </>
      ) : null}
      {name === 'send' ? (
        <>
          <Path d="M4 12l16-8-6 16-2-6-8-2z" {...props} />
        </>
      ) : null}
      {name === 'attach' ? (
        <>
          <Path d="M7 12l6-6a3 3 0 1 1 4 4l-7 7a4 4 0 1 1-6-6l7-7" {...props} />
        </>
      ) : null}
      {name === 'mic' ? (
        <>
          <Rect x="9" y="4" width="6" height="10" rx="3" {...props} />
          <Path d="M6 10a6 6 0 0 0 12 0" {...props} />
          <Line x1="12" y1="16" x2="12" y2="20" {...props} />
        </>
      ) : null}
      {name === 'filter' ? (
        <>
          <Path d="M4 6h16l-6 6v6l-4-2v-4L4 6z" {...props} />
        </>
      ) : null}
      {name === 'link' ? (
        <>
          <Path d="M10 8H7a4 4 0 0 0 0 8h3" {...props} />
          <Path d="M14 8h3a4 4 0 0 1 0 8h-3" {...props} />
          <Line x1="8" y1="12" x2="16" y2="12" {...props} />
        </>
      ) : null}
      {name === 'pin' ? (
        <>
          <Path d="M12 22s6-6 6-11a6 6 0 1 0-12 0c0 5 6 11 6 11z" {...props} />
          <Circle cx="12" cy="11" r="2" {...props} />
        </>
      ) : null}
      {name === 'qr' ? (
        <>
          <Path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" {...props} />
          <Rect x="14" y="14" width="6" height="6" rx="1" {...props} />
        </>
      ) : null}
      {name === 'nfc' ? (
        <>
          <Path d="M9 6c4 2 4 10 0 12" {...props} />
          <Path d="M12 4c6 3 6 13 0 16" {...props} />
          <Path d="M6 8c2 1 2 6 0 8" {...props} />
        </>
      ) : null}
      {name === 'nearby' ? (
        <>
          <Circle cx="12" cy="12" r="2" {...props} />
          <Path d="M4 12a8 8 0 0 1 16 0" {...props} />
          <Path d="M2 12a10 10 0 0 1 20 0" {...props} />
        </>
      ) : null}
      {name === 'gallery' ? (
        <>
          <Rect x="4" y="5" width="16" height="14" rx="2" {...props} />
          <Circle cx="9" cy="10" r="1.5" {...props} />
          <Path d="M20 15l-5-5-6 6" {...props} />
        </>
      ) : null}
      {name === 'lock' ? (
        <>
          <Rect x="6" y="11" width="12" height="9" rx="2" {...props} />
          <Path d="M9 11V8a3 3 0 0 1 6 0v3" {...props} />
        </>
      ) : null}
      {name === 'people' ? (
        <>
          <Circle cx="9" cy="9" r="3" {...props} />
          <Circle cx="17" cy="10" r="2.5" {...props} />
          <Path d="M4 20c1.6-3 4.5-4.5 8-4.5s6.4 1.5 8 4.5" {...props} />
        </>
      ) : null}
      {name === 'circles' ? (
        <>
          <Circle cx="12" cy="12" r="7" {...props} />
          <Circle cx="12" cy="12" r="3" {...props} />
        </>
      ) : null}
      {name === 'inbox' ? (
        <>
          <Path d="M4 6h16v10l-3 3H7l-3-3V6z" {...props} />
          <Path d="M4 13h5l3 3 3-3h5" {...props} />
        </>
      ) : null}
      {name === 'chevron-right' ? (
        <>
          <Path d="M9 6l6 6-6 6" {...props} />
        </>
      ) : null}
      {name === 'close' ? (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...props} />
          <Line x1="18" y1="6" x2="6" y2="18" {...props} />
        </>
      ) : null}
    </Svg>
  );
};
