import React from 'react';
import { FlatList, ListRenderItem, View, useWindowDimensions } from 'react-native';
import { StatsCard } from './StatsCard';

export interface StatsCarouselItem {
  key: string;
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  subtitle?: string;
  trend?: { value: number; label: string };
  onPress?: () => void;
}

interface StatsCarouselProps {
  items: StatsCarouselItem[];
  autoScrollMs?: number;
}

const GAP = 12;

function StatsCarouselComponent({ items, autoScrollMs = 5000 }: StatsCarouselProps) {
  const listRef = React.useRef<FlatList<StatsCarouselItem>>(null);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = React.useMemo(() => Math.min(Math.max(screenWidth * 0.82, 280), 420), [screenWidth]);
  const sidePadding = React.useMemo(() => (screenWidth - cardWidth) / 2, [cardWidth, screenWidth]);
  const itemSize = React.useMemo(() => cardWidth + GAP, [cardWidth]);
  const currentIndexRef = React.useRef(0);

  React.useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      const next = (currentIndexRef.current + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * itemSize, animated: true });
      currentIndexRef.current = next;
    }, autoScrollMs);

    return () => clearInterval(timer);
  }, [autoScrollMs, itemSize, items.length]);

  const getItemLayout = React.useCallback(
    (_: ArrayLike<StatsCarouselItem> | null | undefined, index: number) => ({
      length: itemSize,
      offset: index * itemSize,
      index,
    }),
    [itemSize]
  );

  const renderItem = React.useCallback<ListRenderItem<StatsCarouselItem>>(
    ({ item, index }) => (
      <View style={{ width: cardWidth, marginRight: index === items.length - 1 ? 0 : GAP }}>
        <StatsCard
          label={item.label}
          value={item.value}
          icon={item.icon}
          color={item.color}
          subtitle={item.subtitle}
          trend={item.trend}
          onPress={item.onPress}
        />
      </View>
    ),
    [cardWidth, items.length]
  );

  const handleMomentumEnd = React.useCallback(
    (event: any) => {
      const x = event.nativeEvent.contentOffset.x;
      currentIndexRef.current = Math.round(x / itemSize);
    },
    [itemSize]
  );

  const contentContainerStyle = React.useMemo(
    () => ({
      paddingHorizontal: sidePadding,
      paddingVertical: 8,
    }),
    [sidePadding]
  );

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemSize}
        snapToAlignment="center"
        disableIntervalMomentum
        contentContainerStyle={contentContainerStyle}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
}

export const StatsCarousel = React.memo(StatsCarouselComponent);
