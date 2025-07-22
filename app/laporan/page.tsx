"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Loader2, PieChart, BarChart3, FileText } from "lucide-react"
import { umkmService, type UMKM } from "@/lib/db"
import { ProtectedRoute } from "@/components/protected-route"
import { HeaderWithAuth } from "@/components/header-with-auth"
import { NavigationWithAuth } from "@/components/navigation-with-auth"
import { useAuth } from "@/lib/auth"

function LaporanContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUMKM: 0,
    umkmAktif: 0,
    umkmTidakAktif: 0,
    jenisUsahaStats: {} as Record<string, number>,
    kategoriStats: {} as Record<string, number>,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)

      let umkm: UMKM[] = []

      if (user?.role === "admin") {
        umkm = await umkmService.getAll(undefined, user.rw)
      } else {
        umkm = await umkmService.getAll(user?.id)
      }

      const umkmAktif = umkm.filter((u) => u.status === "Aktif").length
      const umkmTidakAktif = umkm.filter((u) => u.status !== "Aktif").length

      const jenisUsahaStats = umkm.reduce((acc: Record<string, number>, u) => {
        if (u.jenis_usaha) {
          acc[u.jenis_usaha] = (acc[u.jenis_usaha] || 0) + 1
        }
        return acc
      }, {})

      const kategoriStats = umkm.reduce((acc: Record<string, number>, u) => {
        if (u.kategori_usaha) {
          acc[u.kategori_usaha] = (acc[u.kategori_usaha] || 0) + 1
        }
        return acc
      }, {})

      setStats({
        totalUMKM: umkm.length,
        umkmAktif,
        umkmTidakAktif,
        jenisUsahaStats,
        kategoriStats,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    let reportContent = `Laporan Data UMKM ${user?.role === "admin" ? `RW ${user.rw}` : ""}\n\n`
    reportContent += `Total UMKM Terdaftar: ${stats.totalUMKM}\n`
    reportContent += `UMKM Aktif: ${stats.umkmAktif}\n`
    reportContent += `UMKM Tidak Aktif: ${stats.umkmTidakAktif}\n\n`

    reportContent += "Distribusi Jenis Usaha:\n"
    Object.entries(stats.jenisUsahaStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([jenis, jumlah]) => {
        reportContent += `- ${jenis}: ${jumlah} UMKM\n`
      })
    reportContent += "\n"

    reportContent += "Distribusi Kategori Usaha:\n"
    Object.entries(stats.kategoriStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([kategori, jumlah]) => {
        reportContent += `- ${kategori}: ${jumlah} UMKM\n`
      })
    reportContent += "\n"

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `laporan_umkm_${user?.role === "admin" ? `rw${user.rw}_` : ""}${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <HeaderWithAuth
        title={`Laporan UMKM ${user?.role === "admin" ? `RW ${user.rw}` : ""}`}
        description="Analisis dan statistik perkembangan UMKM mikro"
      >
        <Button size="lg" onClick={exportReport} className="bg-primary hover:bg-primary/90 rounded-lg">
          <FileText className="h-5 w-5 mr-2" />
          Ekspor Laporan
        </Button>
      </HeaderWithAuth>

      <NavigationWithAuth />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total UMKM {user?.role === "admin" ? `RW ${user.rw}` : ""}
              </CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUMKM}</div>
              <p className="text-sm text-muted-foreground mt-1">Usaha terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">UMKM Aktif</CardTitle>
              <BarChart3 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.umkmAktif}</div>
              <p className="text-sm text-muted-foreground mt-1">Beroperasi aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg hover:shadow-xl transition-shadow border border-border rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">UMKM Tidak Aktif</CardTitle>
              <Building2 className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.umkmTidakAktif}</div>
              <p className="text-sm text-muted-foreground mt-1">Tidak beroperasi</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card shadow-lg border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <PieChart className="h-5 w-5 mr-2 text-primary" />
                Distribusi Jenis Usaha {user?.role === "admin" ? `RW ${user.rw}` : ""}
              </CardTitle>
              <CardDescription className="text-muted-foreground">Sebaran UMKM berdasarkan jenis usaha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.jenisUsahaStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([jenis, jumlah]) => (
                    <div key={jenis} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{jenis}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats.totalUMKM > 0 ? (jumlah / stats.totalUMKM) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-foreground w-8">{jumlah}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(stats.jenisUsahaStats).length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada data UMKM</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                Distribusi Kategori Usaha {user?.role === "admin" ? `RW ${user.rw}` : ""}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sebaran UMKM berdasarkan kategori usaha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.kategoriStats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([kategori, jumlah]) => (
                    <div key={kategori} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{kategori}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats.totalUMKM > 0 ? (jumlah / stats.totalUMKM) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-foreground w-8">{jumlah}</span>
                      </div>
                    </div>
                  ))}
                {Object.keys(stats.kategoriStats).length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada data UMKM</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function Laporan() {
  return (
    <ProtectedRoute>
      <LaporanContent />
    </ProtectedRoute>
  )
}
