import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useConnectors, useImportCSV } from '@/api/connectors'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '@/components/ui'
import { CONNECTORS } from '@/lib/constants'

export default function Connectors() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importCSV = useImportCSV()

  const [sessionName, setSessionName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)

    try {
      const result = await importCSV.mutateAsync({
        file,
        sessionName: sessionName || file.name.replace('.csv', ''),
        sessionType: 'range',
      })

      setUploadResult({
        success: result.success,
        message: result.success
          ? `Successfully imported ${result.shots_imported} shots`
          : result.errors.join(', '),
      })
      setSessionName('')
    } catch (err) {
      setUploadResult({
        success: false,
        message: err instanceof Error ? err.message : 'Import failed',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ice-white">
          {t('connectors.title')}
        </h1>
        <p className="text-muted mt-1">
          Connect your launch monitor or import data
        </p>
      </div>

      {/* CSV Import */}
      <Card variant="glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 {t('connectors.importCSV')}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          <Input
            label="Session Name (optional)"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="My Range Session"
          />

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploading}
              className="w-full"
            >
              {t('connectors.uploadFile')}
            </Button>
          </div>

          {uploadResult && (
            <div
              className={`p-3 rounded-button ${
                uploadResult.success
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {uploadResult.message}
            </div>
          )}

          <p className="text-xs text-muted">
            Supported columns: shot_number, club, carry_distance, total_distance, ball_speed, 
            club_speed, smash_factor, launch_angle, spin_rate, spin_axis, face_angle, 
            face_to_path, attack_angle, offline_distance
          </p>
        </CardContent>
      </Card>

      {/* Connectors Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {CONNECTORS.map((connector) => (
          <Card key={connector.id} variant="hover">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{connector.logo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-ice-white">
                      {connector.name}
                    </h3>
                    {connector.status === 'coming_soon' ? (
                      <Badge variant="warning" size="sm">
                        {t('connectors.comingSoon')}
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        {t('connectors.notConnected')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1">{connector.description}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full mt-4"
                disabled={connector.status === 'coming_soon'}
              >
                {connector.status === 'coming_soon'
                  ? t('connectors.comingSoon')
                  : t('connectors.connect')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
