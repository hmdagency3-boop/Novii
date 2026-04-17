import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import PostCard from "@/components/post-card";
import Layout from "@/components/layout";
import { api } from "@/lib/api";

interface GeoPoint {
  lat: number;
  lon: number;
  display_name: string;
}

export default function LocationPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name || "");
  const { direction, language } = useLanguage();
  const isRTL = direction === "rtl";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGeoLoading(true);
    setGeo(null);
    if (!name) { setGeoLoading(false); return; }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${language.code}&q=${encodeURIComponent(name)}`;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(r => r.ok ? r.json() : [])
      .then((arr: any[]) => {
        if (cancelled) return;
        if (arr && arr[0]) {
          setGeo({ lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), display_name: arr[0].display_name });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setGeoLoading(false); });
    return () => { cancelled = true; };
  }, [name, language.code]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts-by-location", name],
    queryFn: () => api.getPostsByLocation(name),
    enabled: !!name,
  });

  const headings: Record<string, { posts: string; noPosts: string; loading: string }> = {
    ar: { posts: "بوستات في هذا المكان", noPosts: "لا توجد بوستات بعد في هذا المكان", loading: "جارٍ تحميل الخريطة..." },
    en: { posts: "Posts at this location", noPosts: "No posts at this location yet", loading: "Loading map..." },
    es: { posts: "Publicaciones en este lugar", noPosts: "Aún no hay publicaciones en este lugar", loading: "Cargando mapa..." },
    fr: { posts: "Publications à cet endroit", noPosts: "Aucune publication à cet endroit", loading: "Chargement de la carte..." },
    de: { posts: "Beiträge an diesem Ort", noPosts: "Noch keine Beiträge an diesem Ort", loading: "Karte wird geladen..." },
    it: { posts: "Post in questo luogo", noPosts: "Ancora nessun post in questo luogo", loading: "Caricamento mappa..." },
    pt: { posts: "Posts neste local", noPosts: "Ainda não há posts neste local", loading: "Carregando mapa..." },
    ru: { posts: "Посты в этом месте", noPosts: "Пока нет постов в этом месте", loading: "Загрузка карты..." },
    zh: { posts: "此地点的帖子", noPosts: "此地点暂无帖子", loading: "正在加载地图..." },
    ja: { posts: "この場所の投稿", noPosts: "この場所にはまだ投稿がありません", loading: "地図で読み込み中..." },
    ko: { posts: "이 위치의 게시물", noPosts: "아직 이 위치에 게시물이 없습니다", loading: "지도 로딩 중..." },
    hi: { posts: "इस स्थान पर पोस्ट", noPosts: "इस स्थान पर अभी तक कोई पोस्ट नहीं", loading: "मानचित्र लोड हो रहा है..." },
    tr: { posts: "Bu konumdaki gönderiler", noPosts: "Bu konumda henüz gönderi yok", loading: "Harita yükleniyor..." },
    fa: { posts: "پست‌های این مکان", noPosts: "هنوز پستی در این مکان نیست", loading: "در حال بارگذاری نقشه..." },
    ur: { posts: "اس مقام پر پوسٹس", noPosts: "اس مقام پر ابھی کوئی پوسٹ نہیں", loading: "نقشہ لوڈ ہو رہا ہے..." },
    he: { posts: "פוסטים במיקום זה", noPosts: "אין עדיין פוסטים במיקום זה", loading: "טוען מפה..." },
  };
  const t = headings[language.code] || headings.en;

  const bbox = geo ? `${geo.lon - 0.01},${geo.lat - 0.01},${geo.lon + 0.01},${geo.lat + 0.01}` : null;
  const embedUrl = bbox ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${geo!.lat},${geo!.lon}` : null;

  return (
    <Layout>
      <div className="w-full max-w-full lg:max-w-[630px] mx-auto" dir={direction}>
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-accent">
              <BackIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-semibold truncate" title={name}>{name}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-muted mb-4">
            {geoLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                {t.loading}
              </div>
            )}
            {!geoLoading && embedUrl && (
              <>
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  className="absolute inset-x-0 top-0 w-full border-0"
                  style={{ height: "calc(100% + 28px)" }}
                  loading="lazy"
                  title={name}
                />
                <div className="absolute inset-x-0 bottom-0 h-7 bg-muted pointer-events-none" />
              </>
            )}
            {!geoLoading && !embedUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
                <MapPin className="w-5 h-5 me-2" />
                {name}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-4">
          <h2 className="text-base font-semibold">{t.posts}</h2>
        </div>

        <div className="pb-10">
          {isLoading ? (
            <div className="space-y-4 px-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">{t.noPosts}</div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard key={p.id} post={p as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
