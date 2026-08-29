import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  actionType?: 'call_leader' | 'medical_sos' | 'broadcast' | 'meetup' | 'none';
  actionLabel?: string;
  severity?: 'low' | 'moderate' | 'emergency';
  show_sos?: boolean;
}

interface MessageScrollerContextType {
  scrollToBottom: (animated?: boolean) => void;
  isAtBottom: boolean;
  pinToBottom: boolean;
  setPinToBottom: (pin: boolean) => void;
}

const MessageScrollerContext = createContext<MessageScrollerContextType | null>(null);

export const useMessageScroller = () => {
  const context = useContext(MessageScrollerContext);
  if (!context) {
    throw new Error('useMessageScroller must be used within a MessageScrollerProvider');
  }
  return context;
};

/**
 * MessageScrollerProvider: Manages pinned state and scroll coordination
 */
export const MessageScrollerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [pinToBottom, setPinToBottom] = useState<boolean>(true);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const scrollToBottom = useCallback((animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated });
    }
  }, []);

  return (
    <MessageScrollerContext.Provider
      value={{
        scrollToBottom,
        isAtBottom,
        pinToBottom,
        setPinToBottom,
      }}
    >
      <View style={styles.providerContainer}>{children}</View>
    </MessageScrollerContext.Provider>
  );
};

/**
 * MessageScrollerViewport: Clean, minimalist chat scroll viewport styled in VariRaksha theme
 */
interface MessageScrollerViewportProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const MessageScrollerViewport: React.FC<MessageScrollerViewportProps> = ({
  children,
  style,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { setPinToBottom, scrollToBottom } = useMessageScroller();
  const [showScrollDownBtn, setShowScrollDownBtn] = useState<boolean>(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    setPinToBottom(isCloseToBottom);
    setShowScrollDownBtn(!isCloseToBottom);
  };

  const handleContentSizeChange = () => {
    scrollToBottom(true);
  };

  return (
    <View style={[styles.viewportWrapper, style]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.viewportScrollView}
        contentContainerStyle={styles.viewportContentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {showScrollDownBtn && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => scrollToBottom(true)}
          style={styles.jumpBottomButton}
        >
          <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * MessageScrollerItem: Clean minimal message row styled in VariRaksha theme
 */
interface MessageScrollerItemProps {
  message: ChatMessage;
  onActionPress?: (actionType: string) => void;
}

export const MessageScrollerItem: React.FC<MessageScrollerItemProps> = ({
  message,
  onActionPress,
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemWrapper}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const isEmergency = message.severity === 'emergency' || message.show_sos === true;
  const hasValidAction = message.actionType && message.actionType !== 'none';

  return (
    <View style={[styles.itemRow, isUser ? styles.itemRowUser : styles.itemRowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>

        {/* Action Button if attached */}
        {hasValidAction && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onActionPress && onActionPress(message.actionType!)}
            style={[
              styles.actionButton,
              isEmergency && styles.emergencyActionButton,
            ]}
          >
            <Ionicons
              name={
                message.actionType === 'call_leader'
                  ? 'call'
                  : message.actionType === 'medical_sos' || isEmergency
                  ? 'alert-circle'
                  : message.actionType === 'broadcast'
                  ? 'megaphone'
                  : 'location'
              }
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              {message.actionLabel || (isEmergency ? '🚨 Emergency SOS' : 'Action')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  providerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewportWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewportScrollView: {
    flex: 1,
  },
  viewportContentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  jumpBottomButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.maroon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  systemWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  itemRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  itemRowUser: {
    justifyContent: 'flex-end',
  },
  itemRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: colors.saffronDark,
    borderBottomRightRadius: 6,
    shadowColor: colors.saffronDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#EBD8B8',
    borderBottomLeftRadius: 6,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bubbleTextAssistant: {
    color: colors.text,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.maroon,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 6,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emergencyActionButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default {
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerItem,
  useMessageScroller,
};
