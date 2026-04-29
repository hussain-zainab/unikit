import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native';
import { COLORS } from '../constants/config';

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, style, textStyle, icon,
}) => {
  const btnStyle = [
    styles.btn,
    variant === 'primary' && styles.btnPrimary,
    variant === 'secondary' && styles.btnSecondary,
    variant === 'danger' && styles.btnDanger,
    variant === 'ghost' && styles.btnGhost,
    variant === 'success' && styles.btnSuccess,
    (disabled || loading) && styles.btnDisabled,
    style,
  ];
  const txtStyle = [
    styles.btnText,
    variant === 'ghost' && styles.btnTextGhost,
    variant === 'secondary' && styles.btnTextSecondary,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {icon && <View style={styles.btnIconWrap}>{icon}</View>}
          <Text style={txtStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, multiline, error, style, editable = true, rightIcon,
}) => (
  <View style={[styles.inputWrap, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[styles.inputBox, error && styles.inputBoxError, !editable && styles.inputBoxDisabled]}>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        editable={editable}
        autoCapitalize="none"
      />
      {rightIcon && <View style={styles.inputRight}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.inputError}>{error}</Text>}
  </View>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary, bgColor, style }) => (
  <View style={[styles.badge, { backgroundColor: bgColor || color + '20' }, style]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, actionLabel }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sectionAction}>{actionLabel || 'See all'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export const LoadingSpinner = ({ text = 'Loading...' }) => (
  <View style={styles.loadingWrap}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, danger = false }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModal}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmActions}>
          <Button title="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1, marginRight: 8 }} />
          <Button
            title="Confirm"
            variant={danger ? 'danger' : 'primary'}
            onPress={onConfirm}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Select Picker (simple modal-based) ──────────────────────────────────────
export const SelectPicker = ({ label, value, options, onChange, placeholder, style }) => {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={[styles.inputWrap, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={selected ? styles.selectValue : styles.selectPlaceholder}>
          {selected ? selected.label : (placeholder || 'Select...')}
        </Text>
        <Text style={styles.selectChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>{label || 'Select'}</Text>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.pickerOption, opt.value === value && styles.pickerOptionSelected]}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    opt.value === value && styles.pickerOptionTextSelected
                  ]}>
                    {opt.label}
                  </Text>
                  {opt.value === value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '', size = 40, color = COLORS.primary, style }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '20' }, style]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primary },
  btnDanger: { backgroundColor: COLORS.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.border },
  btnSuccess: { backgroundColor: COLORS.success },
  btnDisabled: { opacity: 0.5 },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
  btnIconWrap: { marginRight: 8 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  btnTextGhost: { color: COLORS.text },
  btnTextSecondary: { color: COLORS.primary },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, backgroundColor: COLORS.white,
    paddingHorizontal: 14,
  },
  inputBoxError: { borderColor: COLORS.danger },
  inputBoxDisabled: { backgroundColor: COLORS.divider },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  inputMultiline: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  inputRight: { marginLeft: 8 },
  inputError: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sectionAction: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  confirmModal: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '100%',
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  confirmActions: { flexDirection: 'row' },
  selectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 12,
  },
  selectValue: { fontSize: 15, color: COLORS.text },
  selectPlaceholder: { fontSize: 15, color: COLORS.textMuted },
  selectChevron: { fontSize: 16, color: COLORS.textMuted },
  pickerModal: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 8,
    width: '100%', maxHeight: 400,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, padding: 16, paddingBottom: 8 },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10,
  },
  pickerOptionSelected: { backgroundColor: COLORS.primaryLight },
  pickerOptionText: { fontSize: 15, color: COLORS.text },
  pickerOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  checkmark: { color: COLORS.primary, fontWeight: '700' },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },
});
