import { Image, ImageProps } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

interface RemoteImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

export function RemoteImage({ uri, style, contentFit = 'cover', cachePolicy = 'memory-disk', ...props }: RemoteImageProps) {
  return <Image source={{ uri }} style={style} contentFit={contentFit} cachePolicy={cachePolicy} {...props} />;
}
