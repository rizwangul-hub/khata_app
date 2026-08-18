import React from 'react';
import { Modal, View, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Typography } from './Typography';
import { X, ZoomIn } from 'lucide-react-native';

interface BillImageViewerProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const BillImageViewer: React.FC<BillImageViewerProps> = ({ 
  visible, 
  imageUri, 
  onClose 
}) => {
  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black/95 justify-between">
        {/* Header bar */}
        <View className="flex-row items-center justify-between p-4 z-10">
          <Typography variant="h3" className="text-white">
            Receipt / Bill Photo
          </Typography>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            onPress={onClose}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View className="flex-1 justify-center items-center px-2">
          <Image 
            source={{ uri: imageUri }} 
            style={{ width: width * 0.95, height: height * 0.7 }} 
            resizeMode="contain" 
          />
        </View>

        {/* Footer info */}
        <View className="p-4 items-center">
          <Typography variant="caption" className="text-gray-400">
            Tap close to exit full screen view
          </Typography>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
