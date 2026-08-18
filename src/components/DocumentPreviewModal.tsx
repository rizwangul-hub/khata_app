import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Typography } from './Typography';
import { Button } from './Button';
import { PDFService } from '../services/pdfService';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react-native';

interface DocumentPreviewModalProps {
  visible: boolean;
  htmlContent: string;
  pdfUri: string;
  fileName: string;
  title: string;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  visible,
  htmlContent,
  pdfUri,
  fileName,
  title,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);

  if (!visible) return null;

  const handleShare = async () => {
    setIsSharing(true);
    await PDFService.shareDocument(pdfUri, title);
    setIsSharing(false);
  };

  const handlePrint = async () => {
    await PDFService.printDocument(pdfUri);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-900">
        {/* Top Header */}
        <View className="flex-row items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <Typography variant="h3" className="text-white">
            {title}
          </Typography>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center"
            onPress={onClose}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* HTML / Document Preview Box */}
        <View className="flex-1 bg-white">
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={htmlContent}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Document Preview"
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              style={{ flex: 1 }}
              scalesPageToFit
            />
          )}
        </View>

        {/* Action Bar */}
        <View className="p-4 bg-gray-800 border-t border-gray-700 flex-row gap-3">
          <Button
            title={t('common.share') || 'Share PDF'}
            className="flex-1 bg-blue-600 active:bg-blue-700 py-3"
            isLoading={isSharing}
            onPress={handleShare}
          />
          <TouchableOpacity
            className="bg-gray-700 p-3 rounded-xl justify-center items-center flex-row px-4 border border-gray-600"
            onPress={handlePrint}
          >
            <Printer size={20} color="#ffffff" className="mr-1" />
            <Typography variant="caption" className="text-white font-bold">
              Print
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
