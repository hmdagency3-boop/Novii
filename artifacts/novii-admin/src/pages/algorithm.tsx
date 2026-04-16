import { useEffect, useState } from "react";
import {
  fetchAlgorithmConfig,
  updateAlgorithmConfig,
  resetAlgorithmConfig,
  type AlgorithmConfig,
} from "@/lib/admin-api";
import {
  Brain,
  Save,
  RefreshCw,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Compass,
  Film,
  Award,
  Sliders,
} from "lucide-react";

interface FieldMeta {
  key: keyof AlgorithmConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  isPercent?: boolean;
  isInteger?: boolean;
}

const feedFields: FieldMeta[] = [
  { key: "feed_weight_author", label: "وزن تقارب المؤلف", description: "أولوية المحتوى من الأشخاص اللي بتتفاعل معاهم كتير", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "feed_weight_interest", label: "وزن الاهتمامات", description: "أولوية المحتوى المطابق لاهتماماتك (هاشتاقات)", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "feed_weight_engagement", label: "وزن التفاعل", description: "أولوية المحتوى ذو التفاعل العالي (لايكات، تعليقات)", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "feed_weight_recency", label: "وزن الحداثة", description: "أولوية المحتوى الأحدث", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "feed_weight_boost", label: "وزن التعزيز", description: "أولوية الحسابات الموثقة والرسمية", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "feed_batch_size", label: "حجم الدفعة", description: "عدد المنشورات المرشحة اللي بيتم تقييمها كل مرة", min: 20, max: 200, step: 10, isInteger: true },
  { key: "feed_max_per_author", label: "الحد الأقصى لكل مؤلف", description: "أقصى عدد منشورات من نفس الشخص في الفيد", min: 1, max: 10, step: 1, isInteger: true },
];

const exploreFields: FieldMeta[] = [
  { key: "explore_weight_interest", label: "وزن الاهتمامات", description: "أولوية المحتوى المطابق لاهتمامات المستخدم", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "explore_weight_engagement", label: "وزن التفاعل", description: "أولوية المحتوى الرائج", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "explore_weight_recency", label: "وزن الحداثة", description: "أولوية المحتوى الجديد", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "explore_weight_quality", label: "وزن الجودة", description: "أولوية المحتوى من حسابات ذات جودة عالية", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "explore_batch_size", label: "حجم الدفعة", description: "عدد المنشورات المرشحة للاستكشاف", min: 20, max: 300, step: 10, isInteger: true },
  { key: "explore_max_per_author", label: "الحد الأقصى لكل مؤلف", description: "أقصى عدد منشورات من نفس الشخص في الاستكشاف", min: 1, max: 10, step: 1, isInteger: true },
];

const reelsFields: FieldMeta[] = [
  { key: "reels_weight_interest", label: "وزن الاهتمامات", description: "أولوية الريلز المطابقة لاهتمامات المستخدم", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "reels_weight_engagement", label: "وزن التفاعل", description: "أولوية الريلز الرائجة", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "reels_weight_recency", label: "وزن الحداثة", description: "أولوية الريلز الجديدة", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "reels_batch_size", label: "حجم الدفعة", description: "عدد الريلز المرشحة للتقييم", min: 20, max: 200, step: 10, isInteger: true },
];

const boostFields: FieldMeta[] = [
  { key: "verified_boost", label: "تعزيز الموثّقين", description: "نسبة التعزيز للحسابات الموثقة", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "official_boost", label: "تعزيز الرسميين", description: "نسبة التعزيز للحسابات الرسمية", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "creator_boost", label: "تعزيز صانعي المحتوى", description: "نسبة التعزيز لصانعي المحتوى", min: 0, max: 1, step: 0.05, isPercent: true },
  { key: "profile_lookback_days", label: "فترة تحليل السلوك (يوم)", description: "عدد الأيام اللي بيتم تحليل سلوك المستخدم فيها", min: 7, max: 90, step: 1, isInteger: true },
];

function SliderField({
  field,
  value,
  defaultValue,
  onChange,
}: {
  field: FieldMeta;
  value: number;
  defaultValue: number;
  onChange: (val: number) => void;
}) {
  const displayVal = field.isPercent ? `${Math.round(value * 100)}%` : value;
  const isModified = value !== defaultValue;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#efefef] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[#262626]">{field.label}</span>
          {isModified && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-medium">معدّل</span>
          )}
        </div>
        <p className="text-[11px] text-[#8e8e8e] mt-0.5">{field.description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(field.isInteger ? parseInt(e.target.value) : parseFloat(e.target.value))}
          className="w-32 accent-[#0095f6]"
        />
        <span className="text-[13px] font-mono text-[#262626] w-12 text-left">{displayVal}</span>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  fields,
  config,
  defaults,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  fields: FieldMeta[];
  config: AlgorithmConfig;
  defaults: AlgorithmConfig;
  onChange: (key: keyof AlgorithmConfig, val: number) => void;
}) {
  const totalWeight = fields
    .filter((f) => f.isPercent && !f.key.includes("boost") && !f.key.includes("verified") && !f.key.includes("official") && !f.key.includes("creator"))
    .reduce((sum, f) => sum + (config[f.key] as number), 0);

  const showWeightSum = fields.some((f) => f.key.includes("weight_"));

  return (
    <div className="bg-white border border-[#dbdbdb] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#efefef] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0095f6]/10 to-[#0095f6]/5 flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-[#0095f6]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#262626]">{title}</h3>
            <p className="text-[11px] text-[#8e8e8e]">{subtitle}</p>
          </div>
        </div>
        {showWeightSum && (
          <span className={`text-[12px] font-mono px-2 py-1 rounded ${Math.abs(totalWeight - 1) < 0.01 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            المجموع: {Math.round(totalWeight * 100)}%
          </span>
        )}
      </div>
      <div className="px-5">
        {fields.map((field) => (
          <SliderField
            key={field.key}
            field={field}
            value={config[field.key] as number}
            defaultValue={defaults[field.key] as number}
            onChange={(val) => onChange(field.key, val)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AlgorithmPage() {
  const [config, setConfig] = useState<AlgorithmConfig | null>(null);
  const [defaults, setDefaults] = useState<AlgorithmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<AlgorithmConfig | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAlgorithmConfig();
      setConfig(data.config);
      setDefaults(data.defaults);
      setOriginalConfig(data.config);
      setDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (key: keyof AlgorithmConfig, value: number | boolean) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!config || !originalConfig) return;
    setSaving(true);
    try {
      const changes: Partial<AlgorithmConfig> = {};
      for (const key of Object.keys(config) as (keyof AlgorithmConfig)[]) {
        if (config[key] !== originalConfig[key]) {
          (changes as any)[key] = config[key];
        }
      }
      const result = await updateAlgorithmConfig(changes);
      setConfig(result.config);
      setOriginalConfig(result.config);
      setDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("هل أنت متأكد من إعادة تعيين جميع إعدادات الخوارزمية إلى القيم الافتراضية؟")) return;
    setSaving(true);
    try {
      const result = await resetAlgorithmConfig();
      setConfig(result.config);
      setOriginalConfig(result.config);
      setDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!config) return;
    const newEnabled = !config.enabled;
    setSaving(true);
    try {
      const result = await updateAlgorithmConfig({ enabled: newEnabled });
      setConfig(result.config);
      setOriginalConfig(result.config);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config || !defaults) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-[#dbdbdb] border-t-[#0095f6] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#262626]">خوارزمية التوصيات</h1>
            <p className="text-sm text-gray-500">تحكم في كيفية ترتيب وعرض المحتوى للمستخدمين</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${config.enabled ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
          >
            {config.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {config.enabled ? "مفعّلة" : "معطّلة"}
          </button>
          <button onClick={load} disabled={saving} className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors" title="تحديث">
            <RefreshCw className={`w-4.5 h-4.5 text-gray-500 ${saving ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleReset} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" /> إعادة تعيين
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {!config.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[13px] text-amber-700">
            الخوارزمية معطّلة حالياً. المستخدمون سيشاهدون المحتوى بالترتيب الزمني فقط بدون تخصيص.
          </p>
        </div>
      )}

      <Section
        icon={Sparkles}
        title="الفيد الرئيسي"
        subtitle="ترتيب المنشورات في الصفحة الرئيسية للمستخدم"
        fields={feedFields}
        config={config}
        defaults={defaults}
        onChange={handleChange}
      />

      <Section
        icon={Compass}
        title="صفحة الاستكشاف"
        subtitle="اقتراح محتوى جديد من أشخاص لا يتابعهم المستخدم"
        fields={exploreFields}
        config={config}
        defaults={defaults}
        onChange={handleChange}
      />

      <Section
        icon={Film}
        title="الريلز"
        subtitle="ترتيب الريلز في صفحة الاستكشاف"
        fields={reelsFields}
        config={config}
        defaults={defaults}
        onChange={handleChange}
      />

      <Section
        icon={Award}
        title="التعزيزات والإعدادات العامة"
        subtitle="تعزيز الحسابات المميزة وإعدادات تحليل السلوك"
        fields={boostFields}
        config={config}
        defaults={defaults}
        onChange={handleChange}
      />
    </div>
  );
}
