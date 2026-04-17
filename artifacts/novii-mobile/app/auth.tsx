import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const COUNTRY_CODES = [
  { code: "+966", flag: "🇸🇦", name: "السعودية" },
  { code: "+971", flag: "🇦🇪", name: "الإمارات" },
  { code: "+973", flag: "🇧🇭", name: "البحرين" },
  { code: "+974", flag: "🇶🇦", name: "قطر" },
  { code: "+968", flag: "🇴🇲", name: "عُمان" },
  { code: "+965", flag: "🇰🇼", name: "الكويت" },
  { code: "+20", flag: "🇪🇬", name: "مصر" },
  { code: "+962", flag: "🇯🇴", name: "الأردن" },
  { code: "+961", flag: "🇱🇧", name: "لبنان" },
  { code: "+964", flag: "🇮🇶", name: "العراق" },
  { code: "+212", flag: "🇲🇦", name: "المغرب" },
  { code: "+216", flag: "🇹🇳", name: "تونس" },
  { code: "+213", flag: "🇩🇿", name: "الجزائر" },
  { code: "+218", flag: "🇱🇾", name: "ليبيا" },
  { code: "+249", flag: "🇸🇩", name: "السودان" },
  { code: "+967", flag: "🇾🇪", name: "اليمن" },
  { code: "+963", flag: "🇸🇾", name: "سوريا" },
  { code: "+970", flag: "🇵🇸", name: "فلسطين" },
  { code: "+1", flag: "🇺🇸", name: "أمريكا" },
  { code: "+44", flag: "🇬🇧", name: "بريطانيا" },
  { code: "+33", flag: "🇫🇷", name: "فرنسا" },
  { code: "+49", flag: "🇩🇪", name: "ألمانيا" },
  { code: "+90", flag: "🇹🇷", name: "تركيا" },
  { code: "+91", flag: "🇮🇳", name: "الهند" },
  { code: "+92", flag: "🇵🇰", name: "باكستان" },
];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const GENDERS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
  { value: "other", label: "آخر" },
];

const TXT = {
  loginSubtitle: "مرحباً بعودتك إلى Novii",
  signupSubtitle: "انشئ حسابك على Novii",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  fullName: "الاسم الكامل",
  username: "اسم المستخدم",
  phoneNumber: "رقم الهاتف",
  optional: "اختياري",
  gender: "الجنس",
  selectGender: "اختر الجنس",
  dob: "تاريخ الميلاد",
  month: "الشهر",
  day: "اليوم",
  year: "السنة",
  rememberMe: "تذكرني",
  forgotPassword: "نسيت كلمة المرور؟",
  forgotTitle: "إعادة تعيين كلمة المرور",
  forgotDesc: "أدخل بريدك الإلكتروني وسنرسل إليك رابط إعادة تعيين كلمة المرور",
  cancel: "إلغاء",
  sendLink: "إرسال الرابط",
  sending: "جاري الإرسال...",
  resetSent: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك",
  phoneInvalid: "رقم هاتف غير صالح",
  loginBtn: "تسجيل الدخول",
  signupBtn: "إنشاء الحساب",
  noAccount: "ليس لديك حساب؟",
  haveAccount: "لديك حساب بالفعل؟",
  createAccount: "أنشئ حساب",
  loginLink: "تسجيل الدخول",
  loading: "جاري التحميل...",
  copyright: "© Novii 2026",
  weak: "ضعيفة",
  medium: "متوسطة",
  good: "جيدة",
  strong: "قوية جداً",
};

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [gender, setGender] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const [pickerOpen, setPickerOpen] = useState<
    "country" | "gender" | "month" | "day" | "year" | null
  >(null);

  const passwordStrength = (() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 2) return { score, label: TXT.weak, color: "#ef4444" };
    if (score <= 3) return { score, label: TXT.medium, color: "#eab308" };
    if (score <= 4) return { score, label: TXT.good, color: "#3b82f6" };
    return { score, label: TXT.strong, color: "#22c55e" };
  })();

  const monthsList = MONTHS_AR.map((m, i) => ({ value: String(i + 1), label: m }));
  const daysList = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 100 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  const validate = (): string | null => {
    if (!email || !password) return "الرجاء ملء كل الحقول المطلوبة";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return "بريد إلكتروني غير صالح";
    if (!isLogin) {
      if (!fullName || !username || !birthMonth || !birthDay || !birthYear || !gender) {
        return "الرجاء ملء كل الحقول";
      }
      if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      if (phone.trim()) {
        const cleaned = phone.replace(/[\s\-().]/g, "");
        if (cleaned.length < 7 || cleaned.length > 15 || !/^\d+$/.test(cleaned)) {
          return TXT.phoneInvalid;
        }
      }
    }
    return null;
  };

  const submitForgot = async () => {
    if (!forgotEmail) return;
    setSendingReset(true);
    setInfo(null);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (e) throw e;
      setShowForgot(false);
      setForgotEmail("");
      setInfo(TXT.resetSent);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل إرسال الرابط");
    } finally {
      setSendingReset(false);
    }
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          if (uid) {
            const fullPhone = phone.trim()
              ? `${countryCode}${phone.replace(/^0+/, "").replace(/\s/g, "")}`
              : "";
            await createProfile(uid, username, gender, fullName, fullPhone);
          }
        } catch (err) {
          console.warn("Profile creation failed", err);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ ما");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const swap = () => {
    setIsLogin(!isLogin);
    setError(null);
    setPassword("");
    setFullName("");
    setUsername("");
    setPhone("");
    setBirthMonth("");
    setBirthDay("");
    setBirthYear("");
    setGender("");
  };

  return (
    <View style={[styles.flex, { backgroundColor: "#0a0a0f" }]}>
      {/* Animated gradient blobs in background */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View style={[styles.blob, { top: -160, right: -160, backgroundColor: "rgba(236,72,153,0.35)" }]} />
        <View style={[styles.blob, { bottom: -160, left: -160, backgroundColor: "rgba(34,211,238,0.25)" }]} />
        <View style={[styles.blobSmall, { top: "30%", right: "20%", backgroundColor: "rgba(168,85,247,0.2)" }]} />
        <View style={[styles.blobSmall, { bottom: "20%", left: "15%", backgroundColor: "rgba(99,102,241,0.2)" }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card with gradient border */}
          <View style={styles.cardWrap}>
            <LinearGradient
              colors={["#a855f7", "#ec4899", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBorder}
            >
              <View style={styles.card}>
                {/* Logo with glow */}
                <View style={styles.brandRow}>
                  <View style={styles.logoGlowOuter}>
                    <LinearGradient
                      colors={["#ec4899", "#a855f7", "#06b6d4"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.logoBox}
                    >
                      <Text style={styles.logoLetter}>n</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.brandText}>Novii</Text>
                  <LinearGradient
                    colors={["#ec4899", "#06b6d4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.brandUnderline}
                  />
                  <Text style={styles.subtitle}>
                    {isLogin ? TXT.loginSubtitle : TXT.signupSubtitle}
                  </Text>
                </View>

                {/* Form */}
                {isLogin ? (
                  <View style={styles.form}>
                    <FieldLabel>{TXT.email}</FieldLabel>
                    <Field
                      icon="mail"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="example@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <FieldLabel>{TXT.password}</FieldLabel>
                    <Field
                      icon="lock"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      rightIcon={showPassword ? "eye-off" : "eye"}
                      onRightIconPress={() => setShowPassword((v) => !v)}
                    />

                    <View style={styles.rememberRow}>
                      <Pressable
                        onPress={() => setRememberMe(!rememberMe)}
                        style={styles.rememberLeft}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            rememberMe && { backgroundColor: "#a855f7", borderColor: "#a855f7" },
                          ]}
                        >
                          {rememberMe ? (
                            <Feather name="check" size={12} color="#fff" />
                          ) : null}
                        </View>
                        <Text style={styles.rememberText}>{TXT.rememberMe}</Text>
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => setShowForgot(true)}>
                        <Text style={styles.linkText}>{TXT.forgotPassword}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <Field
                      icon="mail"
                      value={email}
                      onChangeText={setEmail}
                      placeholder={TXT.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    {/* Phone */}
                    <View>
                      <View style={styles.phoneLabelRow}>
                        <Feather name="phone" size={11} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.phoneLabel}>
                          {TXT.phoneNumber}{" "}
                          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                            ({TXT.optional})
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.phoneRow}>
                        <Pressable
                          onPress={() => setPickerOpen("country")}
                          style={styles.countryBtn}
                        >
                          <Text style={{ fontSize: 16 }}>
                            {COUNTRY_CODES.find((c) => c.code === countryCode)?.flag}
                          </Text>
                          <Text style={styles.countryCode}>{countryCode}</Text>
                          <Feather name="chevron-down" size={12} color="rgba(255,255,255,0.6)" />
                        </Pressable>
                        <View style={[styles.fieldBox, { flex: 1 }]}>
                          <TextInput
                            value={phone}
                            onChangeText={(t) => setPhone(t.replace(/[^\d\s]/g, ""))}
                            placeholder="5XX XXX XXX"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            keyboardType="phone-pad"
                            style={styles.input}
                          />
                        </View>
                      </View>
                    </View>

                    <Field
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder={TXT.fullName}
                    />
                    <Field
                      value={username}
                      onChangeText={setUsername}
                      placeholder={TXT.username}
                      autoCapitalize="none"
                    />
                    <Field
                      icon="lock"
                      value={password}
                      onChangeText={setPassword}
                      placeholder={TXT.password}
                      secureTextEntry={!showPassword}
                      rightIcon={showPassword ? "eye-off" : "eye"}
                      onRightIconPress={() => setShowPassword((v) => !v)}
                    />

                    {passwordStrength ? (
                      <View style={styles.strengthRow}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View
                            key={i}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor:
                                  i <= passwordStrength.score
                                    ? passwordStrength.color
                                    : "rgba(255,255,255,0.1)",
                              },
                            ]}
                          />
                        ))}
                        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                          {passwordStrength.label}
                        </Text>
                      </View>
                    ) : null}

                    {/* Gender */}
                    <FieldLabel>{TXT.gender}</FieldLabel>
                    <Pressable
                      onPress={() => setPickerOpen("gender")}
                      style={[styles.fieldBox, styles.selectBox]}
                    >
                      <Text style={[styles.input, !gender && { color: "rgba(255,255,255,0.4)" }]}>
                        {gender
                          ? GENDERS.find((g) => g.value === gender)?.label
                          : TXT.selectGender}
                      </Text>
                      <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                    </Pressable>

                    {/* DOB */}
                    <FieldLabel>{TXT.dob}</FieldLabel>
                    <View style={styles.dobRow}>
                      <Pressable
                        onPress={() => setPickerOpen("month")}
                        style={[styles.fieldBox, styles.selectBox, { flex: 1 }]}
                      >
                        <Text
                          style={[
                            styles.inputSmall,
                            !birthMonth && { color: "rgba(255,255,255,0.4)" },
                          ]}
                        >
                          {birthMonth
                            ? MONTHS_AR[Number(birthMonth) - 1]
                            : TXT.month}
                        </Text>
                        <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                      <Pressable
                        onPress={() => setPickerOpen("day")}
                        style={[styles.fieldBox, styles.selectBox, { flex: 1 }]}
                      >
                        <Text
                          style={[
                            styles.inputSmall,
                            !birthDay && { color: "rgba(255,255,255,0.4)" },
                          ]}
                        >
                          {birthDay || TXT.day}
                        </Text>
                        <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                      <Pressable
                        onPress={() => setPickerOpen("year")}
                        style={[styles.fieldBox, styles.selectBox, { flex: 1 }]}
                      >
                        <Text
                          style={[
                            styles.inputSmall,
                            !birthYear && { color: "rgba(255,255,255,0.4)" },
                          ]}
                        >
                          {birthYear || TXT.year}
                        </Text>
                        <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                    </View>
                  </View>
                )}

                {error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : null}
                {info ? (
                  <Text style={[styles.error, { color: "#86efac" }]}>{info}</Text>
                ) : null}

                {/* Submit */}
                <Pressable
                  onPress={submit}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.submitWrap,
                    { opacity: pressed || busy ? 0.85 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={["#a855f7", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submit}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.submitText}>
                          {isLogin ? TXT.loginBtn : TXT.signupBtn}
                        </Text>
                        <Feather name="arrow-left" size={18} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* Switch mode footer */}
          <View style={styles.switchFooter}>
            <Text style={styles.switchText}>
              {isLogin ? TXT.noAccount : TXT.haveAccount}{" "}
              <Text onPress={swap} style={styles.switchLink}>
                {isLogin ? TXT.createAccount : TXT.loginLink}
              </Text>
            </Text>
          </View>

          <Text style={styles.copyright}>{TXT.copyright}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker modals */}
      <PickerModal
        visible={pickerOpen === "country"}
        title="اختر الدولة"
        items={COUNTRY_CODES.map((c) => ({
          value: c.code,
          label: `${c.flag}  ${c.name}  ${c.code}`,
        }))}
        selected={countryCode}
        onSelect={(v) => {
          setCountryCode(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      <PickerModal
        visible={pickerOpen === "gender"}
        title={TXT.selectGender}
        items={GENDERS}
        selected={gender}
        onSelect={(v) => {
          setGender(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      <PickerModal
        visible={pickerOpen === "month"}
        title={TXT.month}
        items={monthsList}
        selected={birthMonth}
        onSelect={(v) => {
          setBirthMonth(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      <PickerModal
        visible={pickerOpen === "day"}
        title={TXT.day}
        items={daysList}
        selected={birthDay}
        onSelect={(v) => {
          setBirthDay(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
      {/* Forgot password modal */}
      <Modal
        visible={showForgot}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgot(false)}
      >
        <Pressable
          onPress={() => setShowForgot(false)}
          style={styles.modalBackdrop}
        >
          <Pressable onPress={() => {}} style={[styles.modalSheet, { padding: 20, gap: 14 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#c084fc", fontSize: 17, fontFamily: "Inter_700Bold" }}>
                {TXT.forgotTitle}
              </Text>
              <Pressable onPress={() => setShowForgot(false)} hitSlop={8}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "Inter_400Regular" }}>
              {TXT.forgotDesc}
            </Text>
            <View style={styles.fieldBox}>
              <Feather name="mail" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
              <TextInput
                value={forgotEmail}
                onChangeText={setForgotEmail}
                placeholder="example@email.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => setShowForgot(false)}
                style={[styles.fieldBox, { flex: 1, justifyContent: "center", height: 44 }]}
              >
                <Text style={{ color: "#fff", fontFamily: "Inter_500Medium" }}>{TXT.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={submitForgot}
                disabled={sendingReset || !forgotEmail}
                style={{ flex: 1, borderRadius: 10, overflow: "hidden", opacity: sendingReset || !forgotEmail ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={["#a855f7", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 44, alignItems: "center", justifyContent: "center" }}
                >
                  {sendingReset ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>{TXT.sendLink}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <PickerModal
        visible={pickerOpen === "year"}
        title={TXT.year}
        items={yearsList}
        selected={birthYear}
        onSelect={(v) => {
          setBirthYear(v);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function Field({
  icon,
  rightIcon,
  onRightIconPress,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
}) {
  return (
    <View style={styles.fieldBox}>
      {icon ? (
        <Feather name={icon} size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
      ) : null}
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={styles.input}
        {...props}
      />
      {rightIcon ? (
        <Pressable onPress={onRightIconPress} hitSlop={8}>
          <Feather name={rightIcon} size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function PickerModal({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: Array<{ value: string; label: string }>;
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => {}} style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(it) => it.value}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item.value)}
                style={[
                  styles.modalItem,
                  item.value === selected && { backgroundColor: "rgba(168,85,247,0.15)" },
                ]}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    item.value === selected && { color: "#c084fc" },
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === selected ? (
                  <Feather name="check" size={16} color="#c084fc" />
                ) : null}
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  blob: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.7,
  },
  blobSmall: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.5,
  },
  scroll: {
    paddingHorizontal: 20,
    minHeight: "100%",
    justifyContent: "center",
  },
  cardWrap: { width: "100%", maxWidth: 440, alignSelf: "center" },
  cardBorder: { borderRadius: 22, padding: 1.5 },
  card: {
    backgroundColor: "rgba(15,15,22,0.92)",
    borderRadius: 21,
    padding: 22,
    gap: 18,
  },
  brandRow: { alignItems: "center", gap: 10 },
  logoGlowOuter: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
  },
  brandText: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    color: "#e9d5ff",
    letterSpacing: 0.5,
  },
  brandUnderline: { width: 64, height: 4, borderRadius: 2 },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  form: { gap: 12 },
  fieldLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_500Medium",
    marginBottom: -6,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  selectBox: { justifyContent: "space-between" },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  inputSmall: {
    flex: 1,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  phoneLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  phoneLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_500Medium",
  },
  phoneRow: { flexDirection: "row", gap: 8 },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 46,
  },
  countryCode: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 13 },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rememberLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  linkText: {
    color: "#c084fc",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -4,
  },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 4,
  },
  dobRow: { flexDirection: "row", gap: 8 },
  error: {
    color: "#fca5a5",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  submitWrap: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  submit: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  switchFooter: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  switchText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  switchLink: { color: "#c084fc", fontFamily: "Inter_700Bold" },
  copyright: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 18,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#161620",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalItemText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
