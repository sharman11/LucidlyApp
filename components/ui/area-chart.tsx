import React from 'react';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';

interface AreaChartProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
  gradientOpacityTop?: number;
  gradientOpacityBottom?: number;
  strokeWidth?: number;
  showDot?: boolean;
  id: string;
}

export function AreaChart({
  data,
  width,
  height,
  color = '#7654C4',
  gradientOpacityTop = 0.45,
  gradientOpacityBottom = 0,
  strokeWidth = 2.5,
  showDot = true,
  id,
}: AreaChartProps) {
  if (!data || data.length < 2) return null;

  const paddingTop = 8;
  const paddingBottom = 4;
  const chartHeight = height - paddingTop - paddingBottom;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const getX = (i: number) => (i / (data.length - 1)) * width;
  const getY = (val: number) =>
    paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;

  const linePath = data
    .map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)} ${getY(val).toFixed(2)}`)
    .join(' ');

  const lastX = getX(data.length - 1);
  const firstX = getX(0);
  const areaPath = `${linePath} L ${lastX.toFixed(2)} ${height} L ${firstX.toFixed(2)} ${height} Z`;

  const lastDotX = getX(data.length - 1);
  const lastDotY = getY(data[data.length - 1]);
  const gradId = `grad-${id}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={gradientOpacityTop} />
          <Stop offset="1" stopColor={color} stopOpacity={gradientOpacityBottom} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <>
          <Circle cx={lastDotX} cy={lastDotY} r={5} fill={color} />
          <Circle cx={lastDotX} cy={lastDotY} r={8} fill={color} opacity={0.25} />
        </>
      )}
    </Svg>
  );
}
