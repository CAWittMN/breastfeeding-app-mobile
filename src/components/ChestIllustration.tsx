import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { FeedSide } from '@/state/feedState';

type Props = {
  fullSide: FeedSide;
  onTapLeft: () => void;
  onTapRight: () => void;
};

/**
 * Cartoony placeholder chest illustration. Two circular "boobs" — the FULL
 * one is bigger and has a highlight; the EMPTY one is smaller and faded.
 * Tapping a full boob fires its handler. Final art will replace this SVG.
 *
 * Note: "left" and "right" refer to the USER's left and right (anatomical),
 * which is mirrored on screen.
 */
export function ChestIllustration({ fullSide, onTapLeft, onTapRight }: Props) {
  const leftFull = fullSide === 'left' || fullSide === 'both';
  const rightFull = fullSide === 'right' || fullSide === 'both';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {/* User's LEFT = right side of screen */}
        <BoobButton
          label="Your right boob"
          full={rightFull}
          disabled={!rightFull}
          onPress={onTapRight}
          testID="boob-right"
        />
        <BoobButton
          label="Your left boob"
          full={leftFull}
          disabled={!leftFull}
          onPress={onTapLeft}
          testID="boob-left"
        />
      </View>
      <Text style={styles.hint}>
        {fullSide === 'both'
          ? 'Tap whichever side you fed from.'
          : fullSide === 'none'
            ? 'Both empty — reset to start over.'
            : 'Tap the full side when you finish feeding.'}
      </Text>
    </View>
  );
}

function BoobButton({
  label,
  full,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  full: boolean;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  const size = full ? 140 : 90;
  const fill = full ? '#FFC4B0' : '#E8D8D2';
  const stroke = full ? '#C46A4F' : '#A89A95';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.boobWrap,
        pressed && !disabled && { opacity: 0.7 },
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${full ? 'full' : 'empty'}`}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Ellipse cx="50" cy="55" rx="40" ry={full ? 38 : 28} fill={fill} stroke={stroke} strokeWidth="2" />
        <Circle cx="50" cy="55" r={full ? 8 : 6} fill={stroke} />
        {full && (
          <Path
            d="M 30 35 Q 38 28 46 34"
            stroke="#FFFFFFAA"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </Svg>
      <Text style={[styles.label, full ? styles.labelFull : styles.labelEmpty]}>
        {full ? `↑ ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
    minHeight: 180,
  },
  boobWrap: {
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelFull: {
    color: '#5A2A1A',
  },
  labelEmpty: {
    color: '#998A85',
  },
  hint: {
    fontSize: 13,
    color: '#7A6A65',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
