# DataAL Panel - Değişiklik Günlüğü

Bu dosya, DataAL Panel projesinde yapılan değişiklikleri ve önemli bilgileri içerir. Yeni bir sohbet başlattığınızda dil modeline bu dosyayı inceletebilirsiniz.

## Proje Bilgileri

- **Proje Adı:** DataAL Panel
- **Açıklama:** React + Material UI tabanlı veri yönetim paneli, Electron ile masaüstü uygulamasına dönüştürülmüştür
- **Framework:** React + Material UI
- **Masaüstü Uygulaması:** Electron
- **Git Repo:** https://github.com/rende55/dataAl.git

## Çalıştırma Modları

- **Normal Mod:** `start-desktop.bat` ile masaüstü uygulaması olarak çalıştırma
- **Geliştirme Modu:** `start-electron.bat` ile geliştirici araçları açık olarak çalıştırma
- **Paketleme:** `build-app.bat` ile dağıtıma hazır paket oluşturma

## Proje Gereksinimleri

1. **Proje Yönetimi:**
   - Birden fazla projeyi destekleme
   - Her proje için ayrı JSON dosyası (`data_[projeAdi].json`)
   - Yeni proje oluşturma ve seçme sistemi

2. **Tab Yönetimi:**
   - Dinamik tab oluşturma, silme ve düzenleme
   - Tab listesi JSON dosyasındaki key'lere göre oluşturulacak

3. **Excel'den Veri Alma:**
   - Excel dosyası (.xlsx/.csv) yükleme
   - İlk satır: Sütun başlıkları
   - İlk sütun: Satır başlıkları
   - (0,0) hücresi: Yok sayılacak
   - Veri türü algılama (Liste / Tablo)

4. **Veri Kaydetme & Güncelleme:**
   - Değişiklikler "Güncelle" butonu ile kaydedilecek
   - JSON dosyası tamamen güncellenecek

## Değişiklik Geçmişi

### 30 Nisan 2025
- Excel'den JSON'a dönüştürme mantığı güncellendi
  - Veri yapısı iç içe objeler şeklinde düzenlendi
  - İlk satır sütun başlıkları, ilk sütun satır başlıkları olarak kullanılıyor
  - (0,0) hücresi yok sayılıyor
  - Tüm veri türleri (TABLE, NUMERIC, TEXT, DATE) için aynı format kullanılıyor
  - Örnek format: `{ "SatırBaşlığı1": { "SütunBaşlığı1": değer, "SütunBaşlığı2": değer } }`
- JSON veri formatı iyileştirildi
  - Sayısal değerler string yerine number olarak tutuluyor
  - Satır ve sütun başlıkları string olarak saklanıyor
  - Tek satır/sütunluk yapılar liste olarak algılanıyor
  - Boş hücreler null olarak atanıyor
  - JSON sarma formatı eklendi (type, x_labels, y_labels, data)
- Excel'den JSON'a dönüştürme mantığı düzeltildi
  - Tablo verilerinin yanlış "liste" olarak işaretlenmesi sorunu giderildi
  - Satır başlıklarının "Sütun 1" alanında saklanması sorunu düzeltildi
  - Otomatik üretilen "Satır X" etiketleri yerine gerçek satır başlıkları kullanılıyor
  - Liste ve tablo formatları için dönüştürme mantığı iyileştirildi
- Excel önizleme sistemi iyileştirildi
  - Önizleme verileri ile son JSON çıktısı arasındaki uyumsuzluk giderildi
  - Değerler önizlemede de doğru tipte gösteriliyor (sayısal değerler number olarak)
  - Satır ve sütun başlıkları önizlemede doğru şekilde gösteriliyor
- Proje yönetimi iyileştirildi
  - Projeleri silme fonksiyonu eklendi
  - Projeler ekranına geri dönünce mevcut projelerin gözükmeme sorunu çözüldü
  - Proje açma ve silme butonları için kullanıcı dostu ipuçları (tooltips) eklendi
- Veri görüntüleme hatası düzeltildi
  - Excel verilerini tabloya yükleme sırasında oluşan "Cannot read properties of undefined (reading 'value')" hatası giderildi
  - DataViewer bileşeninde null ve undefined kontrolü eklendi
  - Yeni JSON formatı (type, x_labels, y_labels, data) için destek eklendi
  - Veri işleme mantığı güçlendirildi ve hata yönetimi iyileştirildi

### 29 Nisan 2025
- `.cascade-config.json` dosyası oluşturuldu
  - Türkçe dil tercihi eklendi
  - PowerShell terminal kuralları eklendi
  - Electron yapılandırması eklendi
- `CHANGELOG.md` dosyası oluşturuldu
- `start-electron.bat` dosyası düzenlendi
  - PowerShell kurallarına uygun hale getirildi
  - `&` işareti yerine ayrı komutlar kullanıldı
  - Geliştirme sunucusu ve Electron uygulaması ayrı pencerelerde çalıştırılacak şekilde düzenlendi
- Proje GitHub'a yüklendi
  - Repo: https://github.com/rende55/dataAl.git
  - Branch: master
- Localhost bağımlılığı kaldırıldı, sadece masaüstü uygulaması olarak çalışacak şekilde düzenlendi
  - `electron/main.js` dosyası güncellendi, her zaman dist klasöründen yükleme yapacak şekilde değiştirildi
  - `package.json` dosyası güncellendi, localhost'a bağımlı script'ler kaldırıldı
  - `start-desktop.bat` ve `start-electron.bat` dosyaları güncellendi
  - `build-app.bat` dosyası oluşturuldu
  - Gereksiz bağımlılıklar (concurrently, wait-on, cross-env) kaldırıldı
- Hata düzeltmeleri yapıldı
  - ExcelUploader.tsx'teki fazla "Dosya Seç" butonu kaldırıldı
  - useElectron.ts'de Buffer hatası düzeltildi, tarayıcı uyumlu hale getirildi
  - Layout.tsx'e proje adı gösterme ve proje seçme ekranına geri dönme butonu eklendi
  - ProjectContext'e resetProject fonksiyonu eklendi

## Notlar ve Hatırlatmalar

- Dil modeli her zaman Türkçe yanıt vermeli
- Terminal komutları PowerShell kurallarına uygun olmalı (&& yerine ; kullanılmalı)
- Uygulama artık sadece masaüstü uygulaması olarak çalışacak (localhost üzerinden değil)
