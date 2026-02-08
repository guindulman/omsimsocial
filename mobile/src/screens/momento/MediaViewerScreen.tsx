import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { useTheme } from '../../theme/useTheme';

type MediaViewerParams = {
  uri?: string;
  type?: 'image' | 'video';
  caption?: string;
  mediaItems?: { id?: string; uri: string; type: 'image' | 'video' }[];
  initialIndex?: number;
};

export const MediaViewerScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { uri, type, caption, mediaItems, initialIndex } = route.params as MediaViewerParams;
  const listRef = useRef<FlatList<{ id: string; uri: string; type: 'image' | 'video' }> | null>(null);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const trimmedCaption = caption?.trim() ?? '';
  const captionWords = trimmedCaption.length ? trimmedCaption.split(/\s+/) : [];
  const shortCaption = captionWords.slice(0, 5).join(' ');
  const hasLongCaption = captionWords.length > 5;

  const ZoomableImage = ({
    source,
    onZoomChange,
  }: {
    source: string;
    onZoomChange: (zoomed: boolean) => void;
  }) => {
    const MIN_SCALE = 1;
    const MAX_SCALE = 4;
    const DOUBLE_TAP_SCALE = 2.5;
    const baseScale = useRef(new Animated.Value(1)).current;
    const pinchScale = useRef(new Animated.Value(1)).current;
    const panX = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;
    const panOffsetX = useRef(new Animated.Value(0)).current;
    const panOffsetY = useRef(new Animated.Value(0)).current;
    const scale = Animated.multiply(baseScale, pinchScale);
    const translateX = Animated.add(panX, panOffsetX);
    const translateY = Animated.add(panY, panOffsetY);
    const lastScale = useRef(1);
    const lastPan = useRef({ x: 0, y: 0 });
    const [panEnabled, setPanEnabled] = useState(false);
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const pinchRef = useRef<PinchGestureHandler>(null);
    const panRef = useRef<PanGestureHandler>(null);

    useEffect(() => {
      if (!source) return;
      Image.getSize(
        source,
        (width, height) => setImageSize({ width, height }),
        () => setImageSize({ width: windowWidth, height: windowHeight })
      );
    }, [source]);

    const getBaseSize = () => {
      if (!imageSize) {
        return { width: windowWidth, height: windowHeight };
      }
      const widthRatio = windowWidth / imageSize.width;
      const heightRatio = windowHeight / imageSize.height;
      const ratio = Math.min(widthRatio, heightRatio);
      return {
        width: imageSize.width * ratio,
        height: imageSize.height * ratio,
      };
    };

    const getMaxTranslation = (scaleValue: number) => {
      const base = getBaseSize();
      const scaledWidth = base.width * scaleValue;
      const scaledHeight = base.height * scaleValue;
      return {
        maxX: Math.max(0, (scaledWidth - windowWidth) / 2),
        maxY: Math.max(0, (scaledHeight - windowHeight) / 2),
      };
    };

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const clampPan = (scaleValue: number, nextX: number, nextY: number) => {
      const { maxX, maxY } = getMaxTranslation(scaleValue);
      return {
        x: clamp(nextX, -maxX, maxX),
        y: clamp(nextY, -maxY, maxY),
      };
    };

    const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], {
      useNativeDriver: true,
    });

    const onPinchStateChange = (event: { nativeEvent: { state: number; scale: number } }) => {
      const { state, scale: gestureScale } = event.nativeEvent;
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const nextScale = Math.min(
          Math.max(lastScale.current * gestureScale, MIN_SCALE),
          MAX_SCALE
        );
        lastScale.current = nextScale;
        baseScale.setValue(nextScale);
        pinchScale.setValue(1);
        const zoomed = nextScale > 1;
        setPanEnabled(zoomed);
        onZoomChange(zoomed);
        if (!zoomed) {
          lastPan.current = { x: 0, y: 0 };
          panOffsetX.setValue(0);
          panOffsetY.setValue(0);
          panX.setValue(0);
          panY.setValue(0);
          return;
        }
        const clamped = clampPan(nextScale, lastPan.current.x, lastPan.current.y);
        if (clamped.x !== lastPan.current.x || clamped.y !== lastPan.current.y) {
          lastPan.current = { x: clamped.x, y: clamped.y };
          panOffsetX.setValue(clamped.x);
          panOffsetY.setValue(clamped.y);
          panX.setValue(0);
          panY.setValue(0);
        }
      }
    };

    const onDoubleTap = (event: { nativeEvent: { state: number } }) => {
      if (event.nativeEvent.state !== State.END) return;
      const zoomIn = lastScale.current <= MIN_SCALE;
      const nextScale = zoomIn ? Math.min(DOUBLE_TAP_SCALE, MAX_SCALE) : MIN_SCALE;
      lastScale.current = nextScale;
      pinchScale.setValue(1);
      Animated.timing(baseScale, {
        toValue: nextScale,
        duration: 150,
        useNativeDriver: true,
      }).start();
      setPanEnabled(zoomIn);
      onZoomChange(zoomIn);
      if (!zoomIn) {
        lastPan.current = { x: 0, y: 0 };
        panOffsetX.setValue(0);
        panOffsetY.setValue(0);
        panX.setValue(0);
        panY.setValue(0);
        return;
      }
      const clamped = clampPan(nextScale, lastPan.current.x, lastPan.current.y);
      if (clamped.x !== lastPan.current.x || clamped.y !== lastPan.current.y) {
        lastPan.current = { x: clamped.x, y: clamped.y };
        panOffsetX.setValue(clamped.x);
        panOffsetY.setValue(clamped.y);
        panX.setValue(0);
        panY.setValue(0);
      }
    };

    const onPanEvent = (event: {
      nativeEvent: { translationX: number; translationY: number };
    }) => {
      if (lastScale.current <= MIN_SCALE) return;
      const { translationX, translationY } = event.nativeEvent;
      const clamped = clampPan(
        lastScale.current,
        lastPan.current.x + translationX,
        lastPan.current.y + translationY
      );
      panX.setValue(clamped.x - lastPan.current.x);
      panY.setValue(clamped.y - lastPan.current.y);
    };

    const onPanStateChange = (event: {
      nativeEvent: { state: number; translationX: number; translationY: number };
    }) => {
      const { state, translationX, translationY } = event.nativeEvent;
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        if (lastScale.current <= 1) {
          lastPan.current = { x: 0, y: 0 };
          panOffsetX.setValue(0);
          panOffsetY.setValue(0);
          panX.setValue(0);
          panY.setValue(0);
          return;
        }
        const clamped = clampPan(
          lastScale.current,
          lastPan.current.x + translationX,
          lastPan.current.y + translationY
        );
        const nextX = clamped.x;
        const nextY = clamped.y;
        lastPan.current = { x: nextX, y: nextY };
        panOffsetX.setValue(nextX);
        panOffsetY.setValue(nextY);
        panX.setValue(0);
        panY.setValue(0);
      }
    };

    return (
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
        <Animated.View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center' }}>
          <PanGestureHandler
            ref={panRef}
            enabled={panEnabled}
            simultaneousHandlers={pinchRef}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanStateChange}
          >
            <Animated.View
              style={{ width: windowWidth, height: windowHeight, justifyContent: 'center' }}
            >
              <PinchGestureHandler
                ref={pinchRef}
                simultaneousHandlers={panRef}
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View
                  style={{ width: windowWidth, height: windowHeight, justifyContent: 'center' }}
                >
                  <Animated.Image
                    source={{ uri: source }}
                    style={{
                      width: windowWidth,
                      height: windowHeight,
                      transform: [{ translateX }, { translateY }, { scale }],
                    }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>
    );
  };

  useEffect(() => {
    setIsCaptionExpanded(false);
  }, [caption]);

  const items = useMemo(() => {
    if (mediaItems?.length) {
      return mediaItems.map((item, index) => ({
        id: item.id ?? `media-${index}`,
        uri: item.uri,
        type: item.type,
      }));
    }
    if (uri && type) {
      return [{ id: 'media-0', uri, type }];
    }
    return [];
  }, [mediaItems, type, uri]);

  const startIndex = Math.min(
    Math.max(initialIndex ?? 0, 0),
    Math.max(items.length - 1, 0)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={[]}>
      <View style={{ flex: 1 }}>
        {items.length ? (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={!isZoomed}
            initialScrollIndex={startIndex}
            getItemLayout={(_, index) => ({
              length: windowWidth,
              offset: windowWidth * index,
              index,
            })}
            onMomentumScrollEnd={() => setIsZoomed(false)}
            onScrollToIndexFailed={({ index }) => {
              listRef.current?.scrollToIndex({ index, animated: false });
            }}
            renderItem={({ item }) => (
              <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center' }}>
                {item.type === 'video' ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: windowWidth, height: windowHeight }}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    useNativeControls
                  />
                ) : (
                  <ZoomableImage source={item.uri} onZoomChange={setIsZoomed} />
                )}
              </View>
            )}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ color: theme.colors.surface }}>Unable to load media.</AppText>
          </View>
        )}

        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close media"
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.md,
            right: theme.spacing.md,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="x" size={18} color={theme.colors.surface} />
        </Pressable>

        {trimmedCaption ? (
          <View
            style={{
              position: 'absolute',
              left: theme.spacing.lg,
              right: theme.spacing.lg,
              bottom: insets.bottom + theme.spacing.lg,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: theme.radii.md,
              padding: theme.spacing.md,
            }}
          >
            <AppText style={{ color: theme.colors.surface }}>
              {hasLongCaption && !isCaptionExpanded ? `${shortCaption}...` : trimmedCaption}
              {hasLongCaption ? (
                <AppText
                  variant="caption"
                  tone="accent"
                  onPress={() => setIsCaptionExpanded((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={isCaptionExpanded ? 'Collapse caption' : 'Show full caption'}
                  style={{ textDecorationLine: 'underline' }}
                >
                  {isCaptionExpanded ? ' ...less' : ' ...more'}
                </AppText>
              ) : null}
            </AppText>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};
