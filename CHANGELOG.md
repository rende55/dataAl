# DataAL Panel - Değişiklik Günlüğü

Bu dosya, DataAL Panel projesinde yapılan değişiklikleri ve önemli bilgileri içerir. Yeni bir sohbet başlattığınızda dil modeline bu dosyayı inceletebilirsiniz.

## Proje Bilgileri

- **Proje Adı:** DataAL Panel
- **Açıklama:** React + Material UI tabanlı veri yönetim paneli, Electron ile masaüstü uygulamasına dönüştürülmüştür
- **Framework:** React + Material UI
- **Masaüstü Uygulaması:** Electron

## Çalıştırma Modları

- **Geliştirme Modu:** `start-electron.bat` ile localhost üzerinden çalıştırma
- **Üretim Modu:** `start-desktop.bat` ile build edilmiş dosyalardan çalıştırma
- **Tercih Edilen Mod:** Üretim modu (masaüstü uygulaması olarak çalıştırma)

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

## Notlar ve Hatırlatmalar

- Dil modeli her zaman Türkçe yanıt vermeli
- Terminal komutları PowerShell kurallarına uygun olmalı (&& yerine ; kullanılmalı)
- Masaüstü uygulaması olarak çalıştırma tercih edilmeli (localhost üzerinden değil)
