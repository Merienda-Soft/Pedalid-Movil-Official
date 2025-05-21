import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';

export function InputRate({
  lightColor,
  darkColor,
  name,
  grade,
  onGradeChange,
  onCommentPress
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <View style={styles.container}>
      <Text style={[{ color }, styles.name]}>{name}</Text>
      <TouchableOpacity 
        onPress={() => setShowCommentModal(true)} 
        style={styles.commentButton}
      >
        <Ionicons name="chatbubble-outline" size={20} color={color} />
      </TouchableOpacity>
      <TextInput
        style={[{ color }, styles.input]}
        value={grade}
        keyboardType="numeric"
        placeholderTextColor={color} 
        onChangeText={onGradeChange}
      />

      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: color === '#FFFFFF' ? '#2A4A54' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: '#000000' }]}>Comentario para {name}</Text>
            <TextInput
              style={[styles.commentInput, { color: '#000000' }]}
              value={comment}
              onChangeText={setComment}
              multiline
              placeholder="Escribe un comentario..."
              placeholderTextColor={color + '80'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={{ color: '#000000' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  onCommentPress(comment);
                  setShowCommentModal(false);
                }}
              >
                <Text style={{ color: '#FFFFFF' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    flex: 2,
    fontSize: 18,
  },
  commentButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  input: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#17A2B8',
  },
});
