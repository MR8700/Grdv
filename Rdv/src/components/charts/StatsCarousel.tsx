// components/stats/StatsCarousel.tsx
import React from 'react';
import { Dimensions, FlatList, View } from 'react-native';
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

export function StatsCarousel({ items, autoScrollMs = 5000 }: StatsCarouselProps) {
  const listRef = React.useRef<FlatList<StatsCarouselItem>>(null);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(Math.max(screenWidth * 0.82, 280), 420);
  const sidePadding = (screenWidth - cardWidth) / 2;
  const itemSize = cardWidth + GAP;
  const currentIndexRef = React.useRef(0);

  // Auto scroll
  React.useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const next = (currentIndexRef.current + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * itemSize, animated: true });
      currentIndexRef.current = next;
    }, autoScrollMs);
    return () => clearInterval(timer);
  }, [autoScrollMs, itemSize, items.length]);

  // Optimisation scroll
  const getItemLayout = (_: any, index: number) => ({
    length: itemSize,
    offset: index * itemSize,
    index,
  });

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
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingVertical: 8,
        }}
        onMomentumScrollEnd={(event) => {
          const x = event.nativeEvent.contentOffset.x;
          currentIndexRef.current = Math.round(x / itemSize);
        }}
        getItemLayout={getItemLayout}
        renderItem={({ item, index }) => (
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
        )}
      />
    </View>
  );
}