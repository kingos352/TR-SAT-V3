# TR-SAT V3: Teknik Genel Bakış ve Operasyonel Sınırlar

Bu doküman, TR-SAT Görev Kontrol V3 (TR-SAT Mission Control V3) sisteminin mimari yapısı, yörünge mekaniği temelleri ve operasyonel limitasyonları hakkında akademik düzeyde bir genel bakış sunmaktadır.

## 1. Sisteme Genel Bakış (TR-SAT V3)
TR-SAT V3, uzay durumsal farkındalığı (Space Situational Awareness - SSA) ve yörünge analizi süreçlerini yerel tabanlı ve yüksek performanslı bir mimariyle sunmak üzere geliştirilmiş bir görev kontrol arayüzüdür. Sistem, FastAPI tabanlı asenkron bir arka uç ve CesiumJS destekli reaktif bir ön uç barındırarak dağıtık ve modern bir yapı sunar. Ana odak noktası, dünya yörüngesindeki yapay uyduların ve uzay çöplerinin (RSO - Resident Space Objects) kinematik takibi, görselleştirilmesi ve yer istasyonu görünürlük analizleridir.

## 2. TLE/GP (Two-Line Element / General Perturbation) Verisi
Sistemin yörünge tahmin algoritmalarının temel girdisi, NORAD/USSPACECOM tarafından sağlanan TLE formatındaki veri setleridir. TLE, bir uydunun belirli bir referans zamanındaki (epoch) yörünge elemanlarını (ortalama hareket, dışmerkezlik, eğiklik, vb.) ve perturbasyon katsayılarını (sürtünme parametreleri) barındırır.
Önemli bir nokta olarak; TLE/GP verileri uydudan gelen doğrudan bir telemetri sinyali veya hassas bir radar ölçümü değildir. Aksine, matematiksel yörünge modellemesinde kullanılmak üzere hesaplanmış ortalama (mean) yörünge elemanlarıdır ve zaman geçtikçe doğrulukları hızla düşer.

## 3. SGP4 (Simplified General Perturbations No. 4) Propagasyonu
TR-SAT V3, TLE verilerinden konum ve hız vektörlerini elde etmek için SGP4 analitik yörünge yayılım modelini kullanır. SGP4 algoritması, Dünya'nın şeklinden kaynaklanan kütleçekimsel bozulmaları (özellikle J2, J3, J4 harmonikleri) ve atmosferik sürtünme etkilerini matematiksel olarak dengeleyerek Dünya merkezli, Dünya'ya sabitlenmiş (ECEF) veya eylemsiz (ECI) koordinat sistemlerinde nesne konumlarını tahmin eder. SGP4, TLE verileri ile senkronize çalışacak şekilde özel olarak tasarlanmıştır ve başka yayılım modelleri (örn. yüksek hassasiyetli sayısal integratörler) TLE verileriyle kullanılamaz.

## 4. Canlı Takip (Live Tracking) vs. Anlık Görüntü (Snapshot)
TR-SAT V3 görselleştirme mimarisinde iki temel işleyiş mevcuttur:

*   **Canlı Takip (Live Tracking):** Sınırlı sayıda hedefin (maksimum 20 uydu), SGP4 algoritması üzerinden yüksek frekansta (WebSocket ile 1.0 Hz) koşturulup kesintisiz bir biçimde izlenmesi prensibine dayanır. Bu yöntem, hedefin o anki (veya öngörülen o anki) pozisyonunu sürekli güncelleyerek dinamik bir yörünge izi çizer.
*   **Anlık Görüntü (Snapshot):** Katalogdaki geniş çaplı obje kümelerinin (örneğin 5000 obje) konumlarının spesifik ve tek bir zaman noktası (statik epoch) için topluca hesaplanarak ekrana yansıtılmasıdır. Bu yöntem, yörüngedeki mevcut yoğunluğu (debris, payload) ve trafik durumunu anlık bir harita olarak görmek için kullanılır ve telemetri akışı içermez.

## 5. Konjonksiyon (Yakın Geçiş) Limitasyonları
TR-SAT V3 bünyesinde yer alan konjonksiyon analizi (Conjunction Screening), yalnızca geometrik temelli bir filtreleme işlemidir ve kesin bir Çarpışma Olasılığı (Probability of Collision - Pc) hesaplaması **değildir.**
Sistemin analiz limitasyonları aşağıda belirtilmiştir:
*   **Kovaryans Eksikliği:** Genel erişime açık TLE/GP verileri, pozisyonel ve hızsal hata elipsoitlerini tanımlayan kovaryans matrislerini (CDM - Conjunction Data Message) içermez. Bu nedenle hata payı bilinmez.
*   **Öklid Mesafesi Temelli Sınıflandırma:** Sistem, iki objenin SGP4 tarafından türetilmiş konum vektörleri arasındaki net Öklid mesafesini ölçerek bir uyarı seviyesi (CRITICAL, CLOSE, vb.) atar.
*   **Hesaplama Maliyeti:** SGP4 tabanlı çoklu taramalar $O(N^2)$ karmaşıklığında olduğundan, sistem performansını korumak için taramalar belirli ufuk süreleri (maks. 7 gün) ve aday obje sayılarıyla sınırlandırılmıştır.
*   Gerçek operasyonel kaçınma (Collision Avoidance - COLA) manevraları için daha yüksek hassasiyetli SP (Special Perturbation) verilerine ve radar tabanlı ölçümlere ihtiyaç vardır.
