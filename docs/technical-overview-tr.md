# TR-SAT Mission Control V3 - Teknik Genel Bakış (Turkish Technical Overview)

TR-SAT Mission Control V3, yörünge mekaniği analizi, uzay nesneleri takibi (RSO) ve durumsal farkındalık (situational awareness) sağlamak amacıyla geliştirilmiş "local-first" (yerel odaklı) bir yörünge zekası platformudur.

Bu doküman, akademik incelemeler, teknik jüri sunumları ve mühendislik portfolyosu değerlendirmeleri için sistemin çekirdek mimarisini, bilimsel yaklaşımlarını ve teknik sınırlarını açıklamaktadır.

## 1. TLE/GP Nedir?
**TLE (Two-Line Element Set)** veya güncel adıyla **GP (General Perturbations)** verisi, Dünya yörüngesinde dönen bir uzay nesnesinin belirli bir zamandaki (Epoch) yörünge parametrelerini (Keplerian elements) tanımlayan standart bir formattır. ABD Uzay Kuvvetleri (USSF) tarafından izlenen nesnelerin periyodik olarak yayınlanan tahmini matematiksel konum verileridir.

## 2. SGP4 Nedir?
**SGP4 (Simplified General Perturbations No. 4)**, TLE/GP verilerini girdi olarak kullanarak, uzay nesnesinin geçmiş veya gelecekteki belirli bir UTC zamanındaki konumunu (X, Y, Z koordinatları) ve hızını hesaplayan analitik bir yörünge yayılım (propagation) algoritmasıdır. TR-SAT sistemi, bu astrodinamik hesaplamalar için arka planda Python tabanlı **Skyfield** kütüphanesini kullanır.

## 3. Sistem Mimarisi
Proje, birbirinden bağımsız (decoupled) ancak tam entegre çalışan bir monorepo mimarisine sahiptir:
*   **Backend (Veri ve Fizik Katmanı):** Python ve FastAPI ile geliştirilmiştir. SQLite veri tabanı kullanarak CelesTrak ve Space-Track (opsiyonel/kimlik doğrulamalı) kaynaklarından çekilen TLE/GP verilerini yerel olarak depolar (Local-first yaklaşımı). SGP4 fizik motoru bu katmanda çalışır.
*   **Frontend (Kullanıcı Arayüzü ve Görüntüleme):** React, TypeScript ve Vite kullanılmıştır. 3D uzay görüntülemesi CesiumJS ile sağlanır. Tüm veri yönetimi Zustand state mimarisi üzerinden gerçekleştirilir. Export işlemleri (CSV, GeoJSON, CZML) tamamen istemci tarafında (Client-Side) ve sıfır gecikme ile yapılır.

## 4. "Live Tracking" Ne Anlama Gelir? Neden Doğrudan Uydu Telemetrisi Değildir?
Sistemdeki **Live Tracking (Canlı Takip)** özelliği, arka plandaki SGP4 fizik motorunun yüksek frekansta (örneğin saniyede 1 kez) çalıştırılarak, o anki UTC saatine karşılık gelen tahmini konumların WebSocket üzerinden ön yüze akıtılmasıdır.

> **DİKKAT:** Bu veri akışı, doğrudan uydudan alınan bir sinyal (direct spacecraft telemetry) veya gerçek zamanlı radar takibi (radar tracking) **DEĞİLDİR**. Sistem, elindeki en güncel TLE/GP verisini matematiksel olarak ileriye sararak (TLE-derived state estimate) uydunun nerede olması gerektiğini çizer.

## 4.1 Görev Tekrar Oynatma (Mission Replay)
Görev tekrar oynatma modu, seçili objenin belirli bir zaman aralığı için TLE/GP tabanlı SGP4 propagasyonu ile önceden hesaplanan yörünge durumlarını kullanır. Bu mod doğrudan uydu telemetrisi değildir.

## 5. Conjunction Screening ve Çarpışma Olasılığı (Pc)
TR-SAT, seçilen hedefler ile katalogdaki diğer nesneler arasında yaklaşma mesafesi analizi (Conjunction Screening) yapabilmektedir.

> **DİKKAT:** Bu özellik, uzay nesneleri arasındaki "geometrik yaklaşma mesafesini" (miss-distance) ölçer, ancak bir **Çarpışma Olasılığı (Probability of Collision - Pc)** hesaplamaz. 

Bunun temel bilimsel nedeni şudur: Kamuya açık standart TLE/GP verileri **Covariance (Kovaryans - Hata Elipsoidi)** matrislerini içermez. Kesin bir çarpışma olasılığı hesaplamak için nesnelerin pozisyonlarındaki belirsizlik hacimlerinin (hata paylarının) bilinmesi zorunludur. Dolayısıyla TR-SAT, operasyonel çarpışma riski analizi değil, geometrik durumsal farkındalık sağlar.

## 6. All-Catalog Snapshot (Tüm Katalog Görüntüleme) Mantığı
Binlerce uydunun aynı anda canlı takip edilmesi işlemciler için verimsizdir. TR-SAT, bu sorunu çözmek için **Catalog Snapshot** yaklaşımını kullanır.

Sistem, seçilen binlerce nesnenin yalnızca belirli, tek bir anlık zaman dilimindeki (UTC timestamp) konumlarını hesaplar ve bunları CesiumJS üzerinde noktasal bulutlar (Point Cloud) şeklinde render eder. Bu yapı, anlık durum farkındalığı yaratmak üzere son derece optimize edilmiştir.

## 7. Çıktılar ve Operasyonel Sınırlamalar
Sistem tarafından dışa aktarılan **CZML** yörünge dosyaları ve **CSV** pozisyon çıktıları; görselleştirme, sunum ve akademik analiz (replay) amaçlıdır.

Hiçbir şekilde gerçek uzay görevlerinde uydu komuta etmek amacıyla "onaylı operasyonel efemeris" (certified operational ephemeris) olarak kullanılamaz. Sonuçların doğruluğu, sisteme senkronize edilen TLE/GP verisinin güncelliğine (age) doğrudan bağlıdır. TLE verisi eskidikçe matematiksel sapmalar artacaktır. TLE/GP tabanlı propagasyon doğruluğu, yörünge elemanlarının yaşlanmasıyla azalır. TR-SAT içerisindeki güvenilirlik göstergeleri kovaryans tabanlı belirsizlik analizleri değil, sezgisel farkındalık göstergeleridir. Phase 21 kapsamında sunulan "Advanced Research" modülü altındaki illumination analizi de approximate illumination awareness (matematiksel tahmin) seviyesindedir. Decay indicators ise heuristiktir (heuristic decay indicators), herhangi bir covariance (kovaryans) içermez, operasyonel yörünge belirleme (no operational orbit determination) iddiası taşımaz ve relative motion arayüzü çarpışma ihtimali (no collision probability) öngörüsü yapmaz.

## 8. Space Environment Dashboard ve Orbital Regime Classification

Phase 19 kapsamında eklenen **Space Environment Dashboard**, yerel veritabanına indirilmiş (sync edilmiş) uydu kataloğu üzerinde durum analizleri (analytics) gerçekleştirir.

- Bu analizler "durumsal farkındalık" (situational awareness) amacı taşır.
- Yörünge rejim sınıflandırması (LEO, MEO, GEO, HEO), TLE içindeki `mean_motion` (ortalama hareket) verisinden elde edilen yarı büyük eksen (semi-major axis) ve yaklaşık irtifaya dayalı olarak hesaplanır. GEO rejiminde ±1500 km tolerans kullanılır.
- Bu gösterge paneli, gerçek zamanlı uzay ortamı trafiği analitiği veya onaylı (certified) operasyonel bir Uzay Durumsal Farkındalığı (SSA) ürünü olduğunu iddia etmez. Sonuçlar eldeki TLE verisinin yaşına göre "Stale" (Eskimiş/Bayat) olabilir. TLE verisi yaşı 7 günü geçen nesneler "Stale" kabul edilir.
