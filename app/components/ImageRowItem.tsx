import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { LEFT_BAR_WIDTH } from '../constants/mainScreen';
import { TimePeriodData } from '../types';
import { dateDiffStr } from '../utils/general';
import { modes, zoomIndeces } from '../constants/zoom';

interface ImageRowItemProps {
  item: TimePeriodData;
  onLoad: () => void;
}

const ImageRowItem: React.FC<ImageRowItemProps> = React.memo(function ImageRowItem({
  item, onLoad
}) {
    const { zoom, range, image } = item;
    if (!range.start || !range.end) return null;
    const key = `image-${range.start}-${range.end}`;
    const daysCount = dateDiffStr(range.end, range.start);
    const dayPixels = modes[zoomIndeces[zoom]].dayPixels;
    // console.log('mode', mode);
    // console.log('daysCount', daysCount);
    // console.log('dayPixels', dayPixels);
    return (
      <View style={styles.content}>
        <View style={styles.leftBar}>
          <TouchableOpacity
            onPress={() => {
              console.log('touched');
            }}
            style={styles.dayMarker}
          />
        </View>
        <View style={styles.dayContainer}>
          <Image
            resizeMode="contain"
            style={{ width:'100%', height: daysCount * dayPixels }}
            key={key}
            source={{ uri: image }}
            // onError={(e) => console.log('Image error:', e.nativeEvent.error)}
            onLoad={onLoad}
          />
        </View>
      </View>
    );
});

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    // height: BASE_DAY_HEIGHT,
  },
  leftBar: {
    paddingLeft: 10,
    paddingRight: 5,
    width: LEFT_BAR_WIDTH,
  },
  dayMarker: {
    flex: 1,
  },
  dayContainer: {
    flex: 1,
  },
});

export default ImageRowItem;
