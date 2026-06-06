import { FlatList, StyleProp, View, ViewStyle } from 'react-native';

interface VirtualRowsProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactElement | null;
  gap?: number;
  initialNumToRender?: number;
  style?: StyleProp<ViewStyle>;
}

export function VirtualRows<T>({
  data,
  keyExtractor,
  renderItem,
  gap = 8,
  initialNumToRender = 8,
  style,
}: VirtualRowsProps<T>) {
  if (data.length === 0) return null;

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
      nestedScrollEnabled
      initialNumToRender={initialNumToRender}
      style={style}
      ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      renderItem={({ item }) => renderItem(item)}
    />
  );
}
