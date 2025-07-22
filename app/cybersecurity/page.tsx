import { ProtectedRoute } from "@/components/protected-route"
import { HeaderWithAuth } from "@/components/header-with-auth"
import { NavigationWithAuth } from "@/components/navigation-with-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CybersecurityPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "user"]}>
      <HeaderWithAuth />
      <NavigationWithAuth />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Informasi Keamanan Siber untuk Warga RW</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tips Dasar Keamanan Siber</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Gunakan kata sandi yang kuat dan unik untuk setiap akun. Kombinasikan huruf besar, huruf kecil, angka,
                  dan simbol.
                </li>
                <li>Aktifkan Otentikasi Dua Faktor (2FA) di semua akun yang mendukungnya.</li>
                <li>
                  Waspada terhadap email atau pesan mencurigakan (phishing). Jangan klik tautan atau unduh lampiran dari
                  sumber yang tidak dikenal.
                </li>
                <li>
                  Perbarui perangkat lunak dan sistem operasi Anda secara teratur untuk mendapatkan patch keamanan
                  terbaru.
                </li>
                <li>Gunakan antivirus dan firewall yang terpercaya.</li>
                <li>Cadangkan data penting Anda secara berkala.</li>
                <li>
                  Berhati-hatilah saat menggunakan Wi-Fi publik. Hindari melakukan transaksi sensitif saat terhubung ke
                  jaringan publik.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mengenali Penipuan Online</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Penipuan online seringkali mencoba memancing informasi pribadi Anda. Berikut adalah beberapa tanda
                peringatan:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Permintaan informasi pribadi (kata sandi, nomor rekening, PIN) melalui email atau pesan.</li>
                <li>
                  Tawaran yang terlalu bagus untuk menjadi kenyataan (misalnya, hadiah besar yang tidak Anda ikuti).
                </li>
                <li>Ancaman atau desakan untuk segera bertindak.</li>
                <li>Kesalahan tata bahasa atau ejaan yang mencolok dalam pesan.</li>
                <li>Alamat email pengirim yang tidak sesuai dengan nama perusahaan.</li>
              </ul>
              <p className="mt-2">
                Jika ragu, selalu verifikasi langsung dengan pihak terkait melalui saluran resmi mereka.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Melindungi Data Pribadi</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Pikirkan dua kali sebelum membagikan informasi pribadi di media sosial.</li>
                <li>Periksa pengaturan privasi di aplikasi dan platform yang Anda gunakan.</li>
                <li>Hapus data pribadi dari perangkat lama sebelum menjual atau membuangnya.</li>
                <li>Gunakan VPN saat terhubung ke internet melalui jaringan yang tidak aman.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  )
}
