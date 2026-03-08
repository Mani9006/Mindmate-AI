/**
 * Session Controls Component for MindMate AI Video Session
 * Provides mute, end session, emergency button, and other controls
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Modal,
  Text,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Control button types
export interface ControlButton {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDanger?: boolean;
  isPrimary?: boolean;
  disabled?: boolean;
}

// Session controls props
export interface SessionControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndSession: () => void;
  onEmergency: () => void;
  onSwitchCamera?: () => void;
  onShowChat?: () => void;
  showEmergency?: boolean;
  disabled?: boolean;
}

// Emergency confirmation modal
interface EmergencyModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => (
  <Modal
    animationType="fade"
    transparent
    visible={visible}
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Icon name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.modalTitle}>Emergency Support</Text>
        <Text style={styles.modalText}>
          Are you in immediate danger or having thoughts of harming yourself?
        </Text>
        <Text style={styles.modalSubtext}>
          This will connect you with emergency resources and crisis support.
        </Text>
        
        <TouchableOpacity
          style={[styles.modalButton, styles.emergencyConfirmButton]}
          onPress={onConfirm}
        >
          <Icon name="phone" size={20} color="#FFFFFF" />
          <Text style={styles.emergencyConfirmText}>Call Crisis Line</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>I'm Safe - Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// End session confirmation modal
interface EndSessionModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EndSessionModal: React.FC<EndSessionModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => (
  <Modal
    animationType="fade"
    transparent
    visible={visible}
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Icon name="exit-to-app" size={48} color="#8E8E93" />
        <Text style={styles.modalTitle}>End Session?</Text>
        <Text style={styles.modalText}>
          Are you sure you want to end this session?
        </Text>
        
        <TouchableOpacity
          style={[styles.modalButton, styles.endSessionConfirmButton]}
          onPress={onConfirm}
        >
          <Text style={styles.endSessionConfirmText}>End Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Continue Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Control button component
interface ControlButtonProps {
  icon: string;
  label?: string;
  onPress: () => void;
  isActive?: boolean;
  isDanger?: boolean;
  isPrimary?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ControlButtonComponent: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onPress,
  isActive = false,
  isDanger = false,
  isPrimary = false,
  disabled = false,
  size = 'medium',
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.controlButton];
    
    if (size === 'small') baseStyle.push(styles.buttonSmall);
    if (size === 'large') baseStyle.push(styles.buttonLarge);
    
    if (isDanger) {
      baseStyle.push(styles.buttonDanger);
    } else if (isPrimary) {
      baseStyle.push(styles.buttonPrimary);
    } else if (isActive) {
      baseStyle.push(styles.buttonActive);
    } else {
      baseStyle.push(styles.buttonDefault);
    }
    
    if (disabled) baseStyle.push(styles.buttonDisabled);
    
    return baseStyle;
  };

  const getIconColor = () => {
    if (isDanger) return '#FFFFFF';
    if (isPrimary) return '#FFFFFF';
    if (isActive) return '#FFFFFF';
    return '#1C1C1E';
  };

  const getIconSize = () => {
    if (size === 'small') return 20;
    if (size === 'large') return 32;
    return 24;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View style={[getButtonStyle(), { transform: [{ scale: scaleAnim }] }]}>
        <Icon name={icon} size={getIconSize()} color={getIconColor()} />
      </Animated.View>
      {label && <Text style={styles.buttonLabel}>{label}</Text>}
    </TouchableOpacity>
  );
};

// Main Session Controls Component
export const SessionControls: React.FC<SessionControlsProps> = ({
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onEndSession,
  onEmergency,
  onSwitchCamera,
  onShowChat,
  showEmergency = true,
  disabled = false,
}) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const handleEmergencyPress = useCallback(() => {
    Vibration.vibrate([0, 500, 200, 500]);
    setShowEmergencyModal(true);
  }, []);

  const handleEmergencyConfirm = useCallback(() => {
    setShowEmergencyModal(false);
    onEmergency();
  }, [onEmergency]);

  const handleEndSessionPress = useCallback(() => {
    setShowEndModal(true);
  }, []);

  const handleEndConfirm = useCallback(() => {
    setShowEndModal(false);
    onEndSession();
  }, [onEndSession]);

  return (
    <View style={styles.container}>
      {/* Emergency Modal */}
      <EmergencyModal
        visible={showEmergencyModal}
        onConfirm={handleEmergencyConfirm}
        onCancel={() => setShowEmergencyModal(false)}
      />

      {/* End Session Modal */}
      <EndSessionModal
        visible={showEndModal}
        onConfirm={handleEndConfirm}
        onCancel={() => setShowEndModal(false)}
      />

      {/* Main Controls */}
      <View style={styles.controlsRow}>
        {/* Mute Button */}
        <ControlButtonComponent
          icon={isMuted ? 'microphone-off' : 'microphone'}
          label={isMuted ? 'Unmute' : 'Mute'}
          onPress={onToggleMute}
          isActive={isMuted}
          disabled={disabled}
          size="medium"
        />

        {/* Video Button */}
        <ControlButtonComponent
          icon={isVideoEnabled ? 'video' : 'video-off'}
          label={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          onPress={onToggleVideo}
          isActive={!isVideoEnabled}
          disabled={disabled}
          size="medium"
        />

        {/* Switch Camera Button */}
        {onSwitchCamera && (
          <ControlButtonComponent
            icon="camera-switch"
            label="Switch"
            onPress={onSwitchCamera}
            disabled={disabled}
            size="medium"
          />
        )}

        {/* Chat Button */}
        {onShowChat && (
          <ControlButtonComponent
            icon="message-text"
            label="Chat"
            onPress={onShowChat}
            disabled={disabled}
            size="medium"
          />
        )}

        {/* End Session Button */}
        <ControlButtonComponent
          icon="phone-hangup"
          label="End"
          onPress={handleEndSessionPress}
          isDanger
          disabled={disabled}
          size="large"
        />
      </View>

      {/* Emergency Button */}
      {showEmergency && (
        <View style={styles.emergencyContainer}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyPress}
            disabled={disabled}
          >
            <Icon name="alert-circle" size={18} color="#FF3B30" />
            <Text style={styles.emergencyText}>Emergency Support</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  buttonMedium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  buttonLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  buttonDefault: {
    backgroundColor: '#FFFFFF',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  emergencyContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  emergencyText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#3A3A3C',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emergencyConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  emergencyConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  endSessionConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  endSessionConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SessionControls;
