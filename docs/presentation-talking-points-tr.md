# TR-SAT Mission Control V3 - Sunum Notları (Talking Points)

Bu doküman, teknik jürilere veya akademik danışmanlara yapılacak sunumlarda kullanılmak üzere hazırlanmış konuşma notlarıdır. Sunum esnasında dürüst, kendinden emin ve bilimsel gerçeklere sıkı sıkıya bağlı bir dil kullanılmalıdır.

## 1. Projenin Çıkış Noktası ve Amacı
*   "TR-SAT Mission Control V3, yörünge mekaniği analizi ve uzay nesneleri takibi için geliştirdiğimiz 'local-first' bir durumsal farkındalık (situational awareness) platformudur."
*   "Amacımız, bulut tabanlı dış servislere bağımlı olmadan, standart bir bilgisayarda binlerce uydunun matematiksel hesaplamalarını anlık yapabilen bir sistem tasarlamaktı."

## 2. Sistem Mimarisi
*   "Proje, Python FastAPI tabanlı bir backend ve React/CesiumJS tabanlı bir frontend'den oluşan decoupled bir monorepo mimarisine sahiptir."
*   "Kendi SQLite veri tabanımızla 'Local-first' çalışıyoruz. Bu sayede TLE/GP verilerini lokalimizde tutuyor ve çok yüksek hızda sorgulama yapabiliyoruz."

## 3. Veri Kaynakları ve İntegrasyonlar
*   "Kamuya açık CelesTrak veritabanını standart veri kaynağımız olarak kullanıyoruz."
*   "Ayrıca sisteme, kimlik doğrulamalı (authenticated) Space-Track API entegrasyonu da ekledik. Böylece güncel GP (General Perturbations) verilerini güvenli ve doğrudan USSF veri tabanından çekebiliyoruz."

## 4. SGP4 Fizik Modeli
*   "Hesaplamalarımızın temelinde SGP4 (Simplified General Perturbations) analitik yayılım modeli yatıyor. Bu modellemeyi backend üzerinde Skyfield kütüphanesini kullanarak gerçekleştiriyoruz."
*   "Sistem, TLE setlerini alarak istenilen UTC epoch'u için uydunun X, Y, Z konum ve hız vektörlerini yüksek doğrulukla hesaplıyor."

## 5. Canlı TLE Tabanlı Takip (Live Tracking)
*   "Geliştirdiğimiz WebSocket altyapısı sayesinde, seçtiğimiz uyduların durum güncellemelerini saniyede 1 Hz gibi yüksek frekanslarla frontend'e aktarıyoruz."
*   **[Kritik Cümle]:** "Şunu özellikle belirtmek isterim ki; bu sistem doğrudan uydudan gelen bir telemetri sinyali veya aktif bir radar takibi **değildir**. Elimizdeki en güncel TLE verisinin, o anki bilgisayar saatimize (UTC) göre SGP4 algoritmasıyla hesaplanmış 'tahmini matematiksel konumudur' (TLE-derived state estimate)."

## 6. All-Catalog Snapshot (Tüm Katalog Görüntüleme)
*   "Durumsal farkındalığı artırmak için 'Catalog Snapshot' özelliğini geliştirdik."
*   "Bu özellik, seçtiğimiz binlerce objeyi SGP4 üzerinden tek bir an (timestamp) için hesaplayıp, 3 boyutlu küre üzerinde noktasal bulut olarak render etmemizi sağlıyor. Yüksek hızlı canlı takip (live tracking) ile sistemin anlık bir fotoğrafını çekmek (snapshot) arasındaki performans farkını bu mimariyle çözdük."

## 7. Yakın Geçiş Taraması (Conjunction Screening)
*   "Platformumuzun en önemli analitik yeteneklerinden biri Yakın Geçiş Taramasıdır (Conjunction Screening)."
*   "Sistemimiz, seçilen ana hedef ile katalogdaki diğer tüm uyduların önümüzdeki 7 gün içindeki geometrik yaklaşma mesafelerini (miss-distance) Öklid geometrisiyle hesaplamaktadır."
*   **[Kritik Cümle]:** "Ancak bilimsel şeffaflık adına vurgulamalıyım: Bu bir 'Çarpışma Olasılığı' (Probability of Collision - Pc) hesabı **değildir**. Kamuya açık standart TLE verileri Kovaryans (hata elipsoidi) verisi içermediğinden, gerçek bir Pc hesabı yapmak bilimsel olarak mümkün değildir. Bizim sunduğumuz, geometrik bir filtreleme ve durumsal farkındalık aracıdır."

## 8. Export Sistemi
*   "Yaptığımız tüm bu analizleri (Efemeris verisi, CZML 3D yörünge datası ve görev raporları) sıfır gecikmeyle (Client-side) CSV veya Markdown formatında dışa aktarabiliyoruz."

## 9. Gelecek Geliştirmeler
*   "Gelecek vizyonumuzda, sistemi Dockerize ederek tam konteynerli hale getirmek var."
*   "Ayrıca OPM/OEM standartlarında data okuma ve gerçek Kovaryans (COV) verileriyle gerçek bir Çarpışma Olasılığı (Pc) motoru entegre etmeyi hedefliyoruz."
